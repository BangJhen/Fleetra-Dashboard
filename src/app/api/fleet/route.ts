import { validateRouteGeometry } from "@/lib/road-route";
import { updateOperatorProfile } from "@/lib/operator-profile";
import { recordSafety } from "@/lib/safety-history";
import { changeMaster } from "@/lib/master-data";
import { sameOrigin } from "@/lib/request";
import { NextRequest, NextResponse } from "next/server";
import { sessionUserId } from "@/lib/auth";
import { dashboardState } from "@/lib/dashboard-state";
import { saveRegisteredProfile } from "@/lib/accounts";
import { transact } from "@/lib/store";
import { assertAllocation, matchTrips } from "@/lib/domain";
import type { Etle, Trip } from "@/lib/types";
export const runtime = "nodejs";
export async function GET() {
  const userId = await sessionUserId();
  if (!userId)
    return NextResponse.json(
      { error: "Sesi berakhir. Silakan masuk kembali." },
      { status: 401 },
    );
  return NextResponse.json(await dashboardState(userId), {
    headers: { "Cache-Control": "no-store" },
  });
}
export async function POST(req: NextRequest) {
  const userId = await sessionUserId();
  if (!userId)
    return NextResponse.json(
      { error: "Sesi berakhir. Silakan masuk kembali." },
      { status: 401 },
    );
  if (!sameOrigin(req))
    return NextResponse.json(
      { error: "Origin tidak diizinkan." },
      { status: 403 },
    );
  if (Number(req.headers.get("content-length")) > 3000000)
    return NextResponse.json(
      { error: "Ukuran permintaan melebihi batas 3 MB." },
      { status: 413 },
    );
  try {
    const body = await req.json();
    if (!body || typeof body !== "object" || Array.isArray(body))
      throw Error("Permintaan tidak valid.");
    if (body.action === "update-profile" && userId !== "demo")
      return NextResponse.json(await saveRegisteredProfile(userId, body));
    const result = await transact((s) => {
      const now = new Date().toISOString();
      if (body.action === "update-profile")
        return updateOperatorProfile(s, body);
      if (body.action === "driver-verify") {
        if (!body.driverId || typeof body.driverId !== "string")
          throw Error("ID pengemudi wajib disertakan.");
        const driver = s.drivers.find((d) => d.id === body.driverId);
        if (!driver) throw Error("Pengemudi tidak ditemukan.");
        const approved = body.status === "approved";
        driver.verificationStatus = approved ? "verified" : "rejected";

        let allocatedVehicleSummary = "";
        const scheme = body.scheme === "rto" ? "rto" : "pool";

        if (approved) {
          if (body.vehicleId) {
            const vehicle = s.vehicles.find((v) => v.id === body.vehicleId);
            if (!vehicle) throw Error("Armada yang dipilih tidak ditemukan.");

            if (scheme === "rto") {
              const allowedRtoTypes = ["motorcycle", "car", "van", "pickup"];
              if (!allowedRtoTypes.includes(vehicle.type)) {
                throw Error(
                  `Kendaraan ${vehicle.model} (${vehicle.type.toUpperCase()}) adalah armada berat. Sesuai kebijakan mitigasi risiko aset FLEETRA, program Sewa-Beli (RTO) berlaku untuk armada mobilitas kurir & niaga ringan (Motor, Mobil MPV, Van, Pick-Up). Armada berat (Truk/Bus) wajib menggunakan skema Armada Pool Perusahaan.`
                );
              }

              // Dynamic valuation & tenor by vehicle type
              const rtoValuation =
                vehicle.type === "motorcycle"
                  ? 25000000
                  : vehicle.type === "car"
                  ? 135000000
                  : 180000000;
              const rtoTenorMonths = vehicle.type === "motorcycle" ? 24 : 36;

              // Create or link RTO contract
              s.contracts ??= [];
              let contract = s.contracts.find((c) => c.driverId === driver.id);
              if (!contract) {
                contract = {
                  id: `rto-${driver.id}-${Date.now().toString().slice(-4)}`,
                  driverId: driver.id,
                  vehicleId: vehicle.id,
                  total: rtoValuation,
                  openingBalance: 0,
                  months: rtoTenorMonths,
                  elapsed: 0,
                };
                s.contracts.push(contract);
              } else {
                contract.vehicleId = vehicle.id;
                contract.total = rtoValuation;
                contract.months = rtoTenorMonths;
              }
            }

            // Assign vehicle to this driver
            for (const otherV of s.vehicles) {
              if (otherV.driverId === driver.id && otherV.id !== vehicle.id) {
                otherV.driverId = "";
              }
            }
            vehicle.driverId = driver.id;
            vehicle.status = "idle";
            allocatedVehicleSummary = `${vehicle.model} (${vehicle.plate})`;
          }
        } else {
          // If rejected, unlink any vehicle
          for (const v of s.vehicles) {
            if (v.driverId === driver.id) {
              v.driverId = "";
            }
          }
        }

        s.notices.unshift({
          id: `verified-${driver.id}-${Date.now()}`,
          title: approved
            ? `Mitra Diverifikasi: ${driver.name}`
            : `Pendaftaran Ditolak: ${driver.name}`,
          description: approved
            ? `Mitra ${driver.name} disetujui.${
                allocatedVehicleSummary
                  ? ` Alokasi armada: ${allocatedVehicleSummary} [Skema: ${
                      scheme === "rto" ? "Kemitraan Sewa-Beli RTO" : "Armada Pool Perusahaan"
                    }].`
                  : ""
              }`
            : `Pendaftaran mitra ${driver.name} ditolak oleh operator logistik.`,
          kind: "driver",
          href: `/dashboard/safety/driver/${driver.id}`,
          at: new Date().toISOString(),
          status: "unread",
        });

        return {
          id: driver.id,
          verificationStatus: driver.verificationStatus,
          vehicleId: body.vehicleId || null,
          scheme,
        };
      }
      if (body.action === "safety-record") return recordSafety(s, body);
      if (
        ["master-save", "master-archive", "master-restore"].includes(
          body.action,
        )
      )
        return changeMaster(s, body);
      if (body.action === "create-trip") {
        if (typeof body.key !== "string" || body.key.length > 100)
          throw Error("Kunci penugasan tidak valid.");
        const existing = s.trips.find((t) => t.key === body.key);
        if (existing) return { id: existing.id };
        assertAllocation(s, body.vehicleId, body.driverId);
        if (
          !Array.isArray(body.stops) ||
          body.stops.length < 2 ||
          body.stops.length > 20 ||
          body.stops.some(
            (n: unknown) => typeof n !== "number" || !s.locations[n],
          )
        )
          throw Error("Pilih gudang dan minimal satu tujuan yang valid.");
        if (new Set(body.stops).size !== body.stops.length)
          throw Error("Titik singgah tidak boleh berulang.");
        const route = validateRouteGeometry(body.route);
        const year = new Date().getUTCFullYear();
        const prefix = `TRIP-${year}-`;
        const previousNumbers = s.trips.map((t) => t.code.startsWith(prefix) ? Number(t.code.slice(prefix.length)) : 0).filter(Number.isFinite);
        const nextNumber = Math.max(0, ...previousNumbers) + 1;
        const trip: Trip = {
          ...(route ? { route, routeSource: "OSRM" as const } : {}),
          id: crypto.randomUUID(),
          code: `${prefix}${String(nextNumber).padStart(3, "0")}`,
          vehicleId: body.vehicleId,
          driverId: body.driverId,
          status: "assigned",
          createdAt: now,
          key: body.key,
          stops: body.stops.map((n: number, i: number) => ({
            ...s.locations[n],
            id: crypto.randomUUID(),
            type: i === 0 ? "pickup" : "dropoff",
            status: "pending",
          })),
          distance: Number.isFinite(body.distance)
            ? Math.max(0, body.distance)
            : 0,
          duration: Number.isFinite(body.duration)
            ? Math.max(0, body.duration)
            : 0,
        };
        s.trips.unshift(trip);
        s.notices.unshift({
          id: crypto.randomUUID(),
          title: `${trip.code} ditugaskan`,
          description: `Penugasan tersimpan dengan ${trip.stops.length} titik singgah.`,
          href: `/dashboard/dispatch/${trip.id}`,
          kind: "trip",
          status: "unread",
          at: now,
        });
        return { id: trip.id };
      }
      if (body.action === "etle") {
        if (
          typeof body.reference !== "string" ||
          !body.reference.trim() ||
          body.reference.length > 100 ||
          typeof body.plate !== "string" ||
          !body.plate.trim()
        )
          throw Error("Nomor referensi dan plat kendaraan wajib diisi.");
        if (s.etle.some((e) => e.reference === body.reference.trim()))
          throw Error(
            "Nomor referensi sudah terdaftar. Buka kasus yang sudah tersimpan.",
          );
        const candidates = matchTrips(s, body.plate, body.at);
        const record: Etle = {
          id: crypto.randomUUID(),
          reference: body.reference.trim(),
          plate: body.plate.trim().toUpperCase(),
          at: body.at,
          location: String(body.location || "Tidak dicantumkan").slice(0, 200),
          candidates,
          source: "operator",
          status:
            candidates.length === 0
              ? "unmatched"
              : candidates.length === 1
                ? "candidate_match"
                : "needs_review",
        };
        s.etle.unshift(record);
        return { id: record.id };
      }
      if (body.action === "review-etle") {
        const record = s.etle.find((e) => e.id === body.id);
        if (!record) throw Error("Kasus tidak ditemukan.");
        if (
          !["confirmed", "disputed"].includes(body.status) ||
          (body.status === "confirmed" && record.candidates.length !== 1)
        )
          throw Error(
            "Kasus ambigu harus ditinjau dan tidak dapat dikonfirmasi otomatis.",
          );
        record.status = body.status;
        return { id: record.id };
      }
      if (body.action === "notice") {
        const n = s.notices.find((n) => n.id === body.id);
        if (!n) throw Error("Notifikasi tidak ditemukan.");
        if (!["read", "acknowledged", "resolved"].includes(body.status))
          throw Error("Status tidak valid.");
        if (body.status === "resolved" && n.status !== "acknowledged")
          throw Error("Akui SOS sebelum menutup kasus.");
        n.status = body.status;
        return { id: n.id };
      }
      if (body.action === "read-all") {
        s.notices.forEach((n) => {
          if (n.kind !== "sos" && n.status === "unread") n.status = "read";
        });
        return { ok: true };
      }
      throw Error("Tindakan tidak dikenal.");
    });
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      {
        error:
          e instanceof Error ? e.message : "Permintaan tidak dapat diproses.",
      },
      { status: 400 },
    );
  }
}
