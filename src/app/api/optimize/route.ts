import { sameOrigin } from "@/lib/request";
import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { locations } from "@/lib/seed";
export async function POST(req: NextRequest) {
  if (!(await isAuthenticated()))
    return NextResponse.json({ error: "Sesi berakhir." }, { status: 401 });
  if (!sameOrigin(req))
    return NextResponse.json(
      { error: "Origin tidak diizinkan." },
      { status: 403 },
    );
  try {
    const { stops } = await req.json();
    if (
      !Array.isArray(stops) ||
      stops.length < 2 ||
      stops.length > 20 ||
      stops.some((n) => !Number.isInteger(n) || !locations[n])
    )
      throw Error("Pilih minimal dua titik rute valid.");
    const coordinates = stops
      .map((n) => `${locations[n].lng},${locations[n].lat}`)
      .join(";");
    const res = await fetch(
      `https://router.project-osrm.org/trip/v1/driving/${coordinates}?source=first&roundtrip=false&geometries=geojson&overview=full`,
      { signal: AbortSignal.timeout(10000), cache: "no-store" },
    );
    if (!res.ok) throw Error("Layanan rute tidak tersedia.");
    const data = await res.json();
    if (data.code !== "Ok" || !data.trips?.[0])
      throw Error("Rute tidak ditemukan.");
    const route = data.trips[0];
    const order = stops
      .map((n, i) => ({ n, index: data.waypoints[i].waypoint_index }))
      .sort((a, b) => a.index - b.index)
      .map((p) => p.n);
    return NextResponse.json({
      order,
      distance: route.distance / 1000,
      duration: Math.ceil(route.duration / 60),
      route: route.geometry.coordinates.map(([lng, lat]: [number, number]) => [
        lat,
        lng,
      ]),
      source: "OSRM",
    });
  } catch {
    return NextResponse.json(
      {
        error:
          "OSRM belum dapat menghitung rute. Coba lagi atau lanjutkan dengan urutan manual.",
      },
      { status: 503 },
    );
  }
}
