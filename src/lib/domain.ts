import type { FleetState, Trip } from "./types";
export function activeTrip(t: Trip) {
  return t.status === "assigned" || t.status === "in_progress";
}
export function availableResources(s: FleetState) {
  const active = s.trips.filter(activeTrip);
  return {
    vehicles: s.vehicles.filter(
      (v) => v.status === "idle" && !active.some((t) => t.vehicleId === v.id),
    ),
    drivers: s.drivers.filter(
      (d) => d.score > 85 && !active.some((t) => t.driverId === d.id),
    ),
  };
}
export function matchTrips(s: FleetState, plate: string, at: string) {
  const time = Date.parse(at);
  if (!Number.isFinite(time)) throw Error("Waktu kejadian tidak valid.");
  const vehicle = s.vehicles.find(
    (v) =>
      v.plate.replace(/\s/g, "").toLowerCase() ===
      plate.replace(/\s/g, "").toLowerCase(),
  );
  return s.trips
    .filter(
      (t) =>
        t.vehicleId === vehicle?.id &&
        t.startedAt &&
        Date.parse(t.startedAt) <= time &&
        (t.completedAt
          ? time <= Date.parse(t.completedAt)
          : t.status === "in_progress" && time <= Date.now()),
    )
    .map((t) => t.id);
}
export function assertAllocation(
  s: FleetState,
  vehicleId: string,
  driverId: string,
) {
  const r = availableResources(s);
  if (!r.vehicles.some((v) => v.id === vehicleId))
    throw Error(
      "Kendaraan tidak idle, sedang bertugas atau memerlukan servis. Pilih armada lain.",
    );
  if (!r.drivers.some((d) => d.id === driverId))
    throw Error(
      "Pengemudi tidak tersedia atau skor keselamatan tidak memenuhi syarat.",
    );
}
