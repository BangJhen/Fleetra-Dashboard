import { matchTrips } from "./domain";
import type { Etle, FleetState } from "./types";

const examples = [
  { tripId: "trip-89", reference: "BDG ETLE 2026 001", location: "Jalan Pasirkaliki, Bandung" },
  { tripId: "trip-90", reference: "BDG ETLE 2026 002", location: "Jalan Terusan Jakarta, Antapani" },
  { tripId: "trip-97", reference: "BDG ETLE 2026 003", location: "Jalan Buah Batu, Bandung" },
];

export function ensureDemoEtle(state: FleetState): boolean {
  let changed = false;
  for (const [index, example] of examples.entries()) {
    const id = `demo-etle-${index + 1}`;
    if (state.etle.some((record) => record.id === id || record.reference === example.reference)) continue;
    const trip = state.trips.find((item) => item.id === example.tripId);
    const vehicle = state.vehicles.find((item) => item.id === trip?.vehicleId);
    if (!trip?.startedAt || !vehicle || trip.status === "cancelled") continue;
    const at = new Date(Date.parse(trip.startedAt) + 20 * 60_000).toISOString();
    const candidates = matchTrips(state, vehicle.plate, at);
    if (!candidates.includes(trip.id)) continue;
    const record: Etle = {
      id,
      reference: example.reference,
      plate: vehicle.plate,
      at,
      location: example.location,
      candidates,
      status: candidates.length === 1 ? "candidate_match" : "needs_review",
      source: "simulasi",
    };
    state.etle.push(record);
    changed = true;
  }
  return changed;
}
