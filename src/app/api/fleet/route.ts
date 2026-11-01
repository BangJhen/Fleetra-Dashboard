import { sameOrigin } from "@/lib/request";
import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { getState, transact } from "@/lib/store";
import { assertAllocation, matchTrips } from "@/lib/domain";
import { locations } from "@/lib/seed";
import type { Etle, Trip } from "@/lib/types";
export const runtime = "nodejs";
export async function GET() {
  if (!(await isAuthenticated()))
    return NextResponse.json(
      { error: "Sesi berakhir. Silakan masuk kembali." },
      { status: 401 },
    );
  return NextResponse.json(await getState(), {
    headers: { "Cache-Control": "no-store" },
  });
}
export async function POST(req: NextRequest) {
  if (!(await isAuthenticated()))
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
    const result = await transact((s) => {
      const now = new Date().toISOString();
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
            (n: unknown) => typeof n !== "number" || !locations[n],
          )
        )
          throw Error("Pilih gudang dan minimal satu tujuan yang valid.");
        if (new Set(body.stops).size !== body.stops.length)
          throw Error("Titik singgah tidak boleh berulang.");
        const trip: Trip = {
          id: crypto.randomUUID(),
          code: `TRIP-2026-${String(99 + s.trips.filter((t) => !t.key.startsWith("seed")).length).padStart(3, "0")}`,
          vehicleId: body.vehicleId,
          driverId: body.driverId,
          status: "assigned",
          createdAt: now,
          key: body.key,
          stops: body.stops.map((n: number, i: number) => ({
            ...locations[n],
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
