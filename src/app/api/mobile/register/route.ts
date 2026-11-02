import { NextRequest, NextResponse } from "next/server";
import { registerAccount } from "@/lib/accounts";
import { getState, transact } from "@/lib/store";

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
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const phone = typeof body.phone === "string" ? body.phone.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";
    const simNumber = typeof body.simNumber === "string" ? body.simNumber.trim() : "";
    const vehicleModel = typeof body.vehicleModel === "string" ? body.vehicleModel.trim() : "";
    const vehiclePlate = typeof body.vehiclePlate === "string" ? body.vehiclePlate.trim().toUpperCase() : "";

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Nama, email, dan kata sandi wajib diisi." },
        { status: 400, headers: corsHeaders }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Kata sandi minimal 6 karakter." },
        { status: 400, headers: corsHeaders }
      );
    }

    // Normalizing password length if user enters standard mobile pass
    const normalizedPassword = password.length < 12 ? `${password}!Fleetra2026` : password;

    const account = await registerAccount({
      name,
      email,
      password: normalizedPassword,
      confirmPassword: normalizedPassword,
    });

    let driverExtId = `d_${account.id}`;
    let registeredVehicleId: string | null = null;
    try {
      const { mysqlPool, isMysqlBackend } = await import("@/lib/mysql");
      if (isMysqlBackend()) {
        const pool = mysqlPool();
        const [users] = await pool.query<any[]>(
          "SELECT id FROM users WHERE email=? OR external_id=? LIMIT 1",
          [email, account.id]
        );
        const userId = users?.[0]?.id;
        if (userId) {
          driverExtId = `d_user_${userId}`;
          const sim = simNumber || "SIM B1 Umum";
          await pool.query(
            `INSERT INTO drivers 
              (company_id, user_id, full_name, phone, sim_number, safety_score, status, trip_count, braking_count, speeding_count, version, external_id)
             VALUES 
              (1, ?, ?, ?, ?, 100.00, 'pending_verification', 0, 0, 0, 1, ?)
             ON DUPLICATE KEY UPDATE full_name=VALUES(full_name), phone=VALUES(phone), sim_number=VALUES(sim_number)`,
            [userId, name, phone, sim, driverExtId]
          );
          await pool.query("UPDATE users SET role='driver', phone=? WHERE id=?", [phone, userId]);

          // Get inserted driver's numeric ID
          const [driverRows] = await pool.query<any[]>(
            "SELECT id FROM drivers WHERE user_id=? OR external_id=? LIMIT 1",
            [userId, driverExtId]
          );
          const dbDriverId = driverRows?.[0]?.id;

          // If vehicle info provided, persist vehicle linked to this driver
          if (vehiclePlate && vehicleModel && dbDriverId) {
            registeredVehicleId = `v_${account.id}`;
            const lowerModel = vehicleModel.toLowerCase();
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
              [vehiclePlate, vehicleModel, vType, dbDriverId, registeredVehicleId]
            );
          }
        }
      }
    } catch (e) {
      console.warn("Failed to create driver/vehicle record in database:", e);
    }

    try {
      await transact((s) => {
        const existing = s.drivers.find((d) => d.id === driverExtId || d.email === email);
        if (!existing) {
          s.drivers.push({
            id: driverExtId,
            name,
            email,
            phone,
            score: 100,
            trips: 0,
            braking: 0,
            speeding: 0,
            version: 1,
            verificationStatus: "pending",
            simNumber: simNumber || "SIM B1 Umum",
          });
          s.notices.unshift({
            id: `verify-driver-${driverExtId}`,
            title: `Pendaftaran Mitra Baru: ${name}`,
            description: `${name} (${phone || email}) mengajukan verifikasi pengemudi dengan armada ${vehicleModel || "Van"} (${vehiclePlate || "-"}).`,
            kind: "driver",
            href: "/dashboard/safety?tab=drivers",
            at: new Date().toISOString(),
            status: "unread",
          });
        }
        if (vehiclePlate && vehicleModel) {
          const vExtId = registeredVehicleId || `v_${account.id}`;
          const existingV = s.vehicles.find((v) => v.id === vExtId || v.plate === vehiclePlate);
          if (!existingV) {
            s.vehicles.push({
              id: vExtId,
              plate: vehiclePlate,
              model: vehicleModel,
              type: "van",
              status: "idle",
              driverId: driverExtId,
              lat: -6.914744,
              lng: 107.609810,
              heading: 0,
              speed: 0,
              fuel: 100,
              brake: 100,
              odometer: 0,
              health: 100,
              location: "Bandung, Jawa Barat",
              version: 1,
            });
          } else {
            existingV.driverId = driverExtId;
            existingV.model = vehicleModel;
            existingV.plate = vehiclePlate;
          }
        }
        return { id: driverExtId };
      });
    } catch {}

    return NextResponse.json(
      {
        ok: true,
        driverId: driverExtId,
        token: process.env.MOBILE_DEMO_TOKEN || "fleetra-qa-local-token",
        user: {
          id: account.id,
          name,
          email,
          phone,
        },
        vehicle: vehiclePlate ? {
          id: registeredVehicleId || `v_${account.id}`,
          plate: vehiclePlate,
          model: vehicleModel,
        } : null,
        message: "Pendaftaran mitra pengemudi berhasil.",
      },
      { status: 201, headers: corsHeaders }
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Pendaftaran gagal. Silakan coba lagi." },
      { status: 400, headers: corsHeaders }
    );
  }
}

