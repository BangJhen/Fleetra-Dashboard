import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getState, transact } from "@/lib/store";
import { applyMobileEvent, type MobileEvent } from "@/lib/mobile-events";
export const runtime = "nodejs";
function authorize(req: NextRequest) {
  const expected = process.env.MOBILE_DEMO_TOKEN;
  const supplied = req.headers.get("authorization")?.replace(/^Bearer /, "");
  if (!expected)
    return NextResponse.json(
      {
        error:
          "Endpoint Mobile demo belum diaktifkan. Konfigurasikan MOBILE_DEMO_TOKEN di server.",
      },
      { status: 503 },
    );
  if (
    !supplied ||
    Buffer.byteLength(supplied) !== Buffer.byteLength(expected) ||
    !timingSafeEqual(Buffer.from(supplied), Buffer.from(expected))
  )
    return NextResponse.json(
      { error: "Token Mobile tidak valid." },
      { status: 401 },
    );
  return null;
}
const driverIdentity = () => process.env.MOBILE_DEMO_DRIVER_ID || "d1";
export async function GET(req: NextRequest) {
  const denied = authorize(req);
  if (denied) return denied;
  const state = await getState();
  const id = driverIdentity();
  const trips = state.trips.filter((t) => t.driverId === id);
  const contracts = state.contracts.filter((c) => c.driverId === id);
  return NextResponse.json(
    {
      source: "simulated",
      driver: state.drivers.find((d) => d.id === id),
      trips,
      vehicles: state.vehicles.filter(
        (v) => v.driverId === id || trips.some((t) => t.vehicleId === v.id),
      ),
      contracts,
      ledger: state.ledger.filter((l) =>
        contracts.some((c) => c.id === l.contractId),
      ),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
export async function POST(req: NextRequest) {
  const denied = authorize(req);
  if (denied) return denied;
  if (Number(req.headers.get("content-length")) > 3000000)
    return NextResponse.json(
      { error: "Batas ukuran permintaan adalah 3 MB." },
      { status: 413 },
    );
  try {
    const raw = await req.text();
    if (raw.length > 3000000)
      throw Error("Batas ukuran permintaan adalah 3 MB.");
    const event = JSON.parse(raw) as MobileEvent;
    return NextResponse.json(
      await transact((s) => applyMobileEvent(s, driverIdentity(), event)),
    );
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Peristiwa gagal diproses." },
      { status: 400 },
    );
  }
}
