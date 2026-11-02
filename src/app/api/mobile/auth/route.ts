import { NextRequest, NextResponse } from "next/server";
import { verifyAccount } from "@/lib/accounts";
import { getState } from "@/lib/store";

export const runtime = "nodejs";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-driver-id",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json().catch(() => null);
    const body = payload && typeof payload === "object" ? payload : {};
    const identifier = (typeof body.identifier === "string" ? body.identifier : body.email || "").trim().toLowerCase();
    const password = typeof body.password === "string" ? body.password : "";

    if (!identifier || !password) {
      return NextResponse.json(
        { error: "Email/Nomor HP dan kata sandi wajib diisi." },
        { status: 400, headers: corsHeaders }
      );
    }

    // 1. Verify against MariaDB registered accounts
    let userId = await verifyAccount(identifier, password);
    if (!userId && password.length < 12) {
      userId = await verifyAccount(identifier, `${password}!Fleetra2026`);
    }

    // 2. Fallback check for demo driver credentials
    const isDemoDriver =
      (identifier === "budi.santoso@fleetra.id" || identifier === "driver@fleetra.id") &&
      (password === "Fleetra2026!" || password === "fleetra2026");

    const isDemoManager =
      identifier === "manager@fleetra.demo" && password === "Fleetra2026!";

    if (!userId && (isDemoDriver || isDemoManager)) {
      userId = isDemoManager ? "demo" : "d1";
    }

    if (!userId) {
      return NextResponse.json(
        { error: "Email atau kata sandi tidak sesuai." },
        { status: 401, headers: corsHeaders }
      );
    }

    // 3. Look up registered user from MariaDB
    let userRecord: { id?: number; name: string; email: string; phone: string } | null = null;
    let resolvedDriverId: string | null = null;
    let driverScore = 100;
    try {
      const { mysqlPool, isMysqlBackend } = await import("@/lib/mysql");
      if (isMysqlBackend()) {
        const pool = mysqlPool();
        const [rows] = await pool.query<any[]>(
          "SELECT u.id, u.full_name, u.email, u.phone, d.external_id as driver_ext_id, d.safety_score FROM users u LEFT JOIN drivers d ON d.user_id = u.id WHERE u.email=? OR u.contact_email=? OR u.external_id=? LIMIT 1",
          [identifier, identifier, userId]
        );
        if (rows && rows[0]) {
          userRecord = {
            id: rows[0].id,
            name: rows[0].full_name,
            email: rows[0].email,
            phone: rows[0].phone || "",
          };
          if (rows[0].driver_ext_id) {
            resolvedDriverId = rows[0].driver_ext_id;
            driverScore = Number(rows[0].safety_score) || 100;
          } else if (rows[0].id) {
            resolvedDriverId = `d_user_${rows[0].id}`;
            await pool.query(
              `INSERT INTO drivers (company_id, user_id, full_name, phone, sim_number, safety_score, status, trip_count, braking_count, speeding_count, version, external_id)
               VALUES (1, ?, ?, ?, 'SIM B1 Umum', 100.00, 'available', 0, 0, 0, 1, ?)
               ON DUPLICATE KEY UPDATE id=LAST_INSERT_ID(id)`,
              [rows[0].id, rows[0].full_name, rows[0].phone || "", resolvedDriverId]
            );
          }
        }
      }
    } catch {}

    const state = await getState();
    // Resolve matching driver in fleet
    const driver =
      (resolvedDriverId && state.drivers.find((d) => d.id === resolvedDriverId)) ||
      state.drivers.find(
        (d) =>
          d.id === userId ||
          (userRecord?.name && d.name.toLowerCase() === userRecord.name.toLowerCase()) ||
          (d.email && d.email.toLowerCase() === identifier)
      ) ||
      (isDemoDriver ? state.drivers[0] : null);

    const driverId = resolvedDriverId || driver?.id || (isDemoDriver ? "d1" : `d_${userId}`);
    const driverName = userRecord?.name || driver?.name || (isDemoDriver ? "Budi Santoso" : "Mitra Pengemudi");
    const driverEmail = userRecord?.email || identifier;
    const driverPhone = userRecord?.phone || driver?.phone || "";
    const finalScore = driver?.score ?? driverScore;

    return NextResponse.json(
      {
        ok: true,
        driverId,
        token: process.env.MOBILE_DEMO_TOKEN || "fleetra-qa-local-token",
        driver: {
          id: driverId,
          name: driverName,
          email: driverEmail,
          phone: driverPhone,
          score: finalScore,
        },
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Terjadi kesalahan server saat login." },
      { status: 500, headers: corsHeaders }
    );
  }
}

