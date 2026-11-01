export type RoutePoint = [number, number];
export function validateRouteGeometry(value: unknown): RoutePoint[] | undefined {
  if (value === undefined || value === null) return undefined;
  if (!Array.isArray(value) || value.length < 2 || value.length > 50000 || value.some(p =>
    !Array.isArray(p) || p.length !== 2 ||
    typeof p[0] !== "number" || !Number.isFinite(p[0]) || Math.abs(p[0]) > 90 ||
    typeof p[1] !== "number" || !Number.isFinite(p[1]) || Math.abs(p[1]) > 180
  )) throw Error("Geometri rute tidak valid.");
  return value as RoutePoint[];
}
export async function calculateRoadRoute(points: { lat: number; lng: number }[], signal?: AbortSignal) {
  const coordinates = points.map(p => `${p.lng},${p.lat}`).join(";");
  const response = await fetch(`https://router.project-osrm.org/route/v1/driving/${coordinates}?geometries=geojson&overview=full`, {
    signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(10000)]) : AbortSignal.timeout(10000), cache: "no-store",
  });
  if (!response.ok) throw Error("Layanan rute tidak tersedia.");
  const data = await response.json();
  const result = data.routes?.[0];
  if (data.code !== "Ok" || !result || !Array.isArray(result.geometry?.coordinates)) throw Error("Rute tidak ditemukan.");
  const route = validateRouteGeometry(result.geometry.coordinates.map(([lng, lat]: RoutePoint) => [lat, lng]));
  if (!route) throw Error("Rute tidak ditemukan.");
  return route;
}
