import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getState, transact } from "@/lib/store";
import { applyMobileEvent, type MobileEvent } from "@/lib/mobile-events";
export const runtime = "nodejs";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-driver-id, x-user-email",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

function authorize(req: NextRequest) {
  const expected = process.env.MOBILE_DEMO_TOKEN || "fleetra-qa-local-token";
  const supplied = req.headers.get("authorization")?.replace(/^Bearer /, "");
  if (!expected)
    return NextResponse.json(
      {
        error:
          "Endpoint Mobile demo belum diaktifkan. Konfigurasikan MOBILE_DEMO_TOKEN di server.",
      },
      { status: 503, headers: corsHeaders },
    );
  if (
    !supplied ||
    Buffer.byteLength(supplied) !== Buffer.byteLength(expected) ||
    !timingSafeEqual(Buffer.from(supplied), Buffer.from(expected))
  )
    return NextResponse.json(
      { error: "Token Mobile tidak valid." },
      { status: 401, headers: corsHeaders },
    );
  return null;
}

function resolveDriver(req: NextRequest, drivers: any[]): any {
  const userEmail = (req.headers.get("x-user-email") || req.nextUrl.searchParams.get("email") || "").trim().toLowerCase();
  const driverIdHeader = req.headers.get("x-driver-id") || req.nextUrl.searchParams.get("driverId");

  if (userEmail) {
    const matched = drivers.find((d) => {
      const email = (d.email || "").toLowerCase();
      if (email === userEmail) return true;
      if ((userEmail.startsWith("driver@") || userEmail.startsWith("budi.santoso")) && d.id === "d1") return true;
      if (userEmail.startsWith("ahmad.fauzi") && d.id === "d2") return true;
      return false;
    });
    if (matched) return matched;
  }

  if (driverIdHeader) {
    const matchedById = drivers.find((d) => d.id === driverIdHeader);
    if (matchedById) return matchedById;
  }

  // If userEmail is provided but not matched in drivers, return a clean new driver profile instead of Budi Santoso
  if (userEmail && !userEmail.startsWith("driver@") && !userEmail.startsWith("budi.santoso")) {
    return {
      id: driverIdHeader || `d_${userEmail.replace(/[^a-z0-9]/g, "_")}`,
      name: userEmail.split("@")[0].replace(/\./g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      email: userEmail,
      phone: "",
      score: 100,
      trips: 0,
      braking: 0,
      speeding: 0,
      version: 1,
    };
  }

  const id = driverIdHeader || process.env.MOBILE_DEMO_DRIVER_ID || "d1";
  return drivers.find((d) => d.id === id) || drivers[0];
}

export async function GET(req: NextRequest) {
  const denied = authorize(req);
  if (denied) return denied;
  const state = await getState();
  const driver = resolveDriver(req, state.drivers);
  const actualId = driver?.id || "d1";
  const trips = state.trips.filter((t) => t.driverId === actualId);
  const contracts = state.contracts.filter((c) => c.driverId === actualId);
  const vehicles = state.vehicles.filter(
    (v) => v.driverId === actualId || trips.some((t) => t.vehicleId === v.id),
  );
  const ledger = state.ledger.filter((l) =>
    contracts.some((c) => c.id === l.contractId),
  );
  const notices = state.notices.filter(
    (n) =>
      trips.some((t) => n.href?.includes(t.id)) ||
      n.kind === "trip" ||
      n.kind === "sos",
  );

  const userEmail = req.headers.get("x-user-email") || req.nextUrl.searchParams.get("email");
  let userProfile: { name: string; email: string; phone: string; status?: string } | null = null;
  if (userEmail) {
    try {
      const { mysqlPool, isMysqlBackend } = await import("@/lib/mysql");
      if (isMysqlBackend()) {
        const pool = mysqlPool();
        const [users] = await pool.query<any[]>(
          "SELECT u.full_name, u.email, u.phone, d.status as driver_status FROM users u LEFT JOIN drivers d ON d.user_id = u.id WHERE u.email=? OR u.contact_email=? LIMIT 1",
          [userEmail.toLowerCase(), userEmail.toLowerCase()]
        );
        if (users && users[0]) {
          userProfile = {
            name: users[0].full_name,
            email: users[0].email,
            phone: users[0].phone || "",
            status: users[0].driver_status,
          };
        }
      }
    } catch {}
  }

  const dbStatus = userProfile?.status;
  const verificationStatus =
    dbStatus === "pending_verification"
      ? "pending"
      : dbStatus === "rejected"
        ? "rejected"
        : driver?.verificationStatus || (driver?.id === "d1" ? "verified" : "verified");

  const driverPayload = {
    ...driver,
    name: userProfile?.name || driver.name,
    email: userProfile?.email || driver.email || (driver.id === "d1" ? "driver@fleetra.id" : `${driver.name.toLowerCase().replace(/\s+/g, ".")}@fleetra.id`),
    phone: userProfile?.phone || driver.phone || "+62 812-3456-7890",
    verificationStatus,
  };

  return NextResponse.json(
    {
      source: "live_database",
      driver: driverPayload,
      trips,
      vehicles,
      contracts,
      ledger,
      notices,
      availableDrivers: state.drivers.slice(0, 10).map((d) => ({
        id: d.id,
        name: d.name,
        phone: d.phone,
        score: d.score,
      })),
    },
    {
      headers: {
        "Cache-Control": "no-store",
        ...corsHeaders,
      },
    },
  );
}

export async function POST(req: NextRequest) {
  const denied = authorize(req);
  if (denied) return denied;
  if (Number(req.headers.get("content-length")) > 3000000)
    return NextResponse.json(
      { error: "Batas ukuran permintaan adalah 3 MB." },
      { status: 413, headers: corsHeaders },
    );
  try {
    const raw = await req.text();
    if (raw.length > 3000000)
      throw Error("Batas ukuran permintaan adalah 3 MB.");
    const event = JSON.parse(raw) as MobileEvent;
    const state = await getState();
    const driver = resolveDriver(req, state.drivers);
    const id = driver?.id || req.headers.get("x-driver-id") || req.nextUrl.searchParams.get("driverId") || "d1";

    if (event.type === "profile.updated") {
      try {
        const { mysqlPool, isMysqlBackend } = await import("@/lib/mysql");
        if (isMysqlBackend()) {
          const pool = mysqlPool();
          const [dRows] = await pool.query<any[]>(
            "SELECT id, user_id FROM drivers WHERE external_id=? LIMIT 1",
            [id]
          );
          if (dRows && dRows[0]) {
            const dbDriverId = dRows[0].id;
            const dbUserId = dRows[0].user_id;
            if (event.name || event.phone) {
              await pool.query(
                "UPDATE drivers SET full_name=COALESCE(?, full_name), phone=COALESCE(?, phone) WHERE id=?",
                [event.name || null, event.phone || null, dbDriverId]
              );
              if (dbUserId) {
                await pool.query(
                  "UPDATE users SET full_name=COALESCE(?, full_name), phone=COALESCE(?, phone) WHERE id=?",
                  [event.name || null, event.phone || null, dbUserId]
                );
              }
            }
            if (event.vehiclePlate && event.vehicleModel) {
              const lowerModel = event.vehicleModel.toLowerCase();
              const vType =
                lowerModel.includes("truk") || lowerModel.includes("truck") || lowerModel.includes("box")
                  ? "truck"
                  : lowerModel.includes("pikap") || lowerModel.includes("pickup")
                    ? "pickup"
                    : "van";

              await pool.query(
                `INSERT INTO vehicles 
                  (company_id, license_plate, model, vehicle_type, status, reference_driver_id, current_odometer_km, fuel_level_pct, brake_health_pct, health_score, latitude, longitude, location_label, version, external_id)
                 VALUES 
                  (1, ?, ?, ?, 'idle', ?, 0.00, 100.00, 100.00, 100.00, -6.914744, 107.609810, 'Bandung, Jawa Barat', 1, ?)
                 ON DUPLICATE KEY UPDATE model=VALUES(model), reference_driver_id=VALUES(reference_driver_id), vehicle_type=VALUES(vehicle_type)`,
                [event.vehiclePlate.trim().toUpperCase(), event.vehicleModel.trim(), vType, dbDriverId, `v_${id}`]
              );
            }
          }
        }
      } catch (dbErr) {
        console.warn("Could not sync profile update to MariaDB:", dbErr);
      }
    }

    const result = await transact((s) => applyMobileEvent(s, id, event));
    return NextResponse.json(result, { headers: corsHeaders });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Peristiwa gagal diproses." },
      { status: 400, headers: corsHeaders },
    );
  }
}
