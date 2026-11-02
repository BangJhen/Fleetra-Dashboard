import type { FleetState } from "./types";
import { createHash } from "node:crypto";
export interface MobileEvent {
  type:
    | "trip.started"
    | "stop.arrived"
    | "stop.pickup_confirmed"
    | "stop.failed"
    | "epod.submitted"
    | "sos.sent"
    | "profile.updated";
  tripId?: string;
  stopId?: string;
  recipient?: string;
  photo?: string;
  signature?: string;
  reason?: string;
  key?: string;
  phone?: string;
  name?: string;
  vehicleModel?: string;
  vehiclePlate?: string;
}
const validImage = (value: unknown): value is string =>
  typeof value === "string" &&
  value.length < 1200000 &&
  /^data:image\/(?:png|jpeg|webp);base64,[A-Za-z0-9+/]+=*$/.test(value) &&
  value.length > 50;
/** Local MVP integration. All records remain explicitly simulated. Caller binds the driver identity. */
export function applyMobileEvent(
  s: FleetState,
  driverId: string,
  event: MobileEvent,
) {
  if (event.type === "profile.updated") {
    const driver = s.drivers.find((d) => d.id === driverId);
    if (!driver) throw Error("Pengemudi tidak ditemukan.");
    if (event.phone !== undefined) driver.phone = event.phone.trim().slice(0, 30);
    if (event.name !== undefined) driver.name = event.name.trim().slice(0, 100);
    if (event.vehiclePlate && event.vehicleModel) {
      const plate = event.vehiclePlate.trim().toUpperCase();
      const model = event.vehicleModel.trim();
      const existingV = s.vehicles.find((veh) => veh.driverId === driverId || veh.plate === plate);
      if (existingV) {
        existingV.plate = plate;
        existingV.model = model;
        existingV.driverId = driverId;
      } else {
        s.vehicles.push({
          id: `v_${driverId}`,
          plate,
          model,
          type: "van",
          status: "idle",
          driverId,
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
      }
    }
    return { id: driver.id };
  }
  if (!event.tripId) throw Error("ID penugasan wajib disertakan.");
  const trip = s.trips.find(
    (t) => t.id === event.tripId && t.driverId === driverId,
  );
  if (!trip) throw Error("Penugasan tidak ditemukan untuk pengemudi ini.");
  const now = new Date().toISOString();
  if (event.type === "sos.sent") {
    if (!event.key || event.key.length > 100)
      throw Error("Kunci idempotensi SOS wajib diisi.");
    const rawId = `sos-${driverId}-${event.key}`;
    const id = rawId.length <= 100 ? rawId : `sos-${createHash("sha256").update(rawId).digest("hex")}`;
    const exists = s.notices.find((n) => n.id === id);
    if (exists) return { id: exists.id };
    if (!["assigned", "in_progress"].includes(trip.status))
      throw Error("SOS memerlukan penugasan aktif pada demo ini.");
    const driver = s.drivers.find((d) => d.id === driverId);
    const vehicle = s.vehicles.find((v) => v.id === trip.vehicleId);
    s.notices.unshift({
      id,
      title: `SOS simulasi dari ${driver?.name}`,
      description: `${vehicle?.plate} / ${trip.code}. ${String(event.reason || "Pengemudi meminta bantuan.").slice(0, 300)} Lokasi simulasi: ${vehicle?.lat}, ${vehicle?.lng}.`,
      kind: "sos",
      href: `/dashboard/dispatch/${trip.id}`,
      at: now,
      status: "unread",
    });
    return { id };
  }
  if (event.type === "trip.started") {
    if (trip.status === "in_progress") return { id: trip.id };
    if (trip.status !== "assigned")
      throw Error("Hanya penugasan yang belum dimulai dapat dijalankan.");
    trip.status = "in_progress";
    trip.startedAt = now;
    const v = s.vehicles.find((v) => v.id === trip.vehicleId);
    if (v) v.status = "moving";
    return { id: trip.id };
  }
  const stop = trip.stops.find((p) => p.id === event.stopId);
  if (!stop) throw Error("Titik singgah tidak ditemukan.");
  if (event.type === "epod.submitted" && stop.epod) return { id: stop.id };
  if (trip.status !== "in_progress")
    throw Error("Mulai perjalanan sebelum memperbarui titik singgah.");
  const index = trip.stops.indexOf(stop);
  if (trip.stops.slice(0, index).some((p) => p.status !== "delivered"))
    throw Error("Selesaikan titik sebelumnya terlebih dahulu.");
  if (event.type === "stop.arrived") {
    if (stop.status === "delivered") return { id: stop.id };
    stop.status = "arrived";
    return { id: stop.id };
  }
  if (event.type === "stop.failed") {
    if (
      stop.type !== "dropoff" ||
      stop.status !== "arrived" ||
      !event.reason?.trim()
    )
      throw Error(
        "Catat alasan kegagalan pada titik pengantaran yang sudah didatangi.",
      );
    stop.status = "failed_attempt";
    stop.failureReason = event.reason.trim().slice(0, 300);
    return { id: stop.id };
  }
  if (event.type === "stop.pickup_confirmed") {
    if (
      stop.type !== "pickup" ||
      !["arrived", "delivered"].includes(stop.status)
    )
      throw Error("Konfirmasi pickup hanya untuk gudang yang sudah didatangi.");
    stop.status = "delivered";
    return { id: stop.id };
  }
  if (event.type !== "epod.submitted")
    throw Error("Jenis peristiwa tidak dikenal.");
  if (stop.type !== "dropoff" || stop.status !== "arrived")
    throw Error("e-POD hanya untuk titik pengantaran yang sudah didatangi.");
  if (
    !event.recipient?.trim() ||
    event.recipient.length > 100 ||
    !validImage(event.photo) ||
    !validImage(event.signature)
  )
    throw Error(
      "Nama penerima, foto dan tanda tangan berupa gambar wajib dilengkapi. Maksimal 900 KB per gambar.",
    );
  stop.epod = {
    recipient: event.recipient.trim(),
    photo: event.photo,
    signature: event.signature,
    at: now,
  };
  stop.status = "delivered";
  s.notices.unshift({
    id: crypto.randomUUID(),
    title: `Bukti e-POD diterima / ${trip.code}`,
    description: `Serah terima ${stop.name} tercatat untuk ${event.recipient.trim()}.`,
    href: `/dashboard/dispatch/${trip.id}`,
    kind: "trip",
    status: "unread",
    at: now,
  });
  if (trip.stops.every((p) => p.status === "delivered")) {
    trip.status = "completed";
    trip.completedAt = now;
    const v = s.vehicles.find((v) => v.id === trip.vehicleId);
    if (v) {
      v.status = "idle";
      v.speed = 0;
    }
    const d = s.drivers.find((d) => d.id === trip.driverId);
    if (d) {
      d.trips = (d.trips || 0) + 1;
    }
    const contract = s.contracts.find(
      (c) => c.driverId === trip.driverId && c.vehicleId === trip.vehicleId,
    );
    if (contract && !s.ledger.some((l) => l.tripId === trip.id)) {
      const paid =
        contract.openingBalance +
        s.ledger
          .filter((l) => l.contractId === contract.id)
          .reduce((n, l) => n + l.amount, 0);
      const amount = Math.min(45000, Math.max(0, contract.total - paid));
      if (amount > 0)
        s.ledger.push({
          id: crypto.randomUUID(),
          contractId: contract.id,
          tripId: trip.id,
          amount,
          at: now,
        });
    }
  }
  return { id: stop.id };
}
