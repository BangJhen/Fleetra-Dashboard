import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { sameOrigin } from "@/lib/request";
import { getState, transact } from "@/lib/store";
import { calculateRoadRoute } from "@/lib/road-route";
export const runtime = "nodejs";
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAuthenticated())) return NextResponse.json({ error: "Sesi berakhir." }, { status: 401 });
  if (!sameOrigin(req)) return NextResponse.json({ error: "Origin tidak diizinkan." }, { status: 403 });
  const { id } = await params;
  const trip = (await getState()).trips.find(t => t.id === id);
  if (!trip) return NextResponse.json({ error: "Perjalanan tidak ditemukan." }, { status: 404 });
  if (trip.route?.length) return NextResponse.json({ route: trip.route, source: trip.routeSource });
  try {
    // Reconstruct legacy geometry in its saved stop order, preserving the assignment and estimates.
    // Keep the network call outside the store queue so other dashboard actions can continue.
    const signature = JSON.stringify(trip.stops.map(p => [p.lat, p.lng]));
    const route = await calculateRoadRoute(trip.stops, req.signal);
    const saved = await transact(s => {
      const current = s.trips.find(t => t.id === id);
      if (!current || JSON.stringify(current.stops.map(p => [p.lat, p.lng])) !== signature)
        throw Error("Titik perjalanan telah berubah. Muat ulang halaman.");
      if (!current.route?.length) {
        current.route = route;
        current.routeSource = "OSRM";
      }
      return { route: current.route, source: current.routeSource };
    });
    return NextResponse.json(saved);
  } catch {
    return NextResponse.json({ error: "Rute OSRM belum dapat dimuat. Coba lagi." }, { status: 503 });
  }
}
