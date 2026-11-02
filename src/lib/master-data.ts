import { inferVehicleType, vehicleTypes } from "./vehicle-types";
import type { VehicleType, Driver, FleetState } from "./types";
import { activeTrip } from "./domain";
export type MasterKind = "vehicles" | "drivers";
export type MasterRequest = {
  action: "master-save" | "master-archive" | "master-restore";
  kind: MasterKind;
  id?: string;
  key?: string;
  version?: number;
  values?: Record<string, unknown>;
};
function text(v: unknown, label: string, max = 100) {
  if (typeof v !== "string" || !v.trim() || v.trim().length > max)
    throw Error(`${label} wajib diisi dengan maksimal ${max} karakter.`);
  return v.trim();
}
function score(v: unknown, label: string, max = 100) {
  if (typeof v !== "number" || !Number.isFinite(v) || v < 0 || v > max)
    throw Error(`${label} harus berupa angka antara 0 dan ${max}.`);
  return v;
}
const plateKey = (v: string) => v.replace(/\s/g, "").toUpperCase();
export function changeMaster(s: FleetState, b: MasterRequest) {
  if (!["vehicles", "drivers"].includes(b.kind))
    throw Error("Jenis master data tidak valid.");
  const entries = b.kind === "vehicles" ? s.vehicles : s.drivers;
  const record = b.id ? entries.find((v) => v.id === b.id) : undefined;
  if (b.id && !record) throw Error("Data tidak ditemukan.");
  if (
    record &&
    (typeof b.version !== "number" || b.version !== (record.version || 0))
  )
    throw Error(
      "Data sudah berubah. Muat ulang halaman sebelum menyimpan kembali.",
    );
  const busy =
    record &&
    s.trips.some(
      (t) =>
        activeTrip(t) &&
        (b.kind === "vehicles"
          ? t.vehicleId === record.id
          : t.driverId === record.id),
    );
  if (
    busy ||
    (record &&
      b.kind === "vehicles" &&
      s.vehicles.find((v) => v.id === record.id)?.status === "moving")
  )
    throw Error(
      "Data sedang digunakan pada penugasan aktif dan tidak dapat diubah atau diarsipkan.",
    );
  if (b.action === "master-archive" || b.action === "master-restore") {
    if (!record) throw Error("Data tidak ditemukan.");
    if (b.action === "master-archive") {
      if (
        b.kind === "drivers" &&
        s.vehicles.some((v) => !v.archivedAt && v.driverId === record.id)
      )
        throw Error(
          "Lepaskan referensi pengemudi pada armada aktif sebelum mengarsipkan.",
        );
      if (
        s.contracts.some((c) =>
          b.kind === "vehicles"
            ? c.vehicleId === record.id
            : c.driverId === record.id,
        )
      )
        throw Error("Data terikat kontrak RTO dan tidak dapat diarsipkan.");
      record.archivedAt = new Date().toISOString();
    } else {
      if (b.kind === "vehicles") {
        const v = s.vehicles.find((v) => v.id === record.id)!;
        if (
          v.driverId &&
          !s.drivers.some((d) => d.id === v.driverId && !d.archivedAt)
        )
          throw Error("Pulihkan pengemudi referensi terlebih dahulu.");
      }
      delete record.archivedAt;
    }
    record.version = (record.version || 0) + 1;
    return { id: record.id };
  }
  if (b.action !== "master-save")
    throw Error("Tindakan master data tidak valid.");
  if (record?.archivedAt) throw Error("Pulihkan data sebelum mengubahnya.");
  if (!record) {
    if (typeof b.key !== "string" || !b.key.trim() || b.key.length > 100)
      throw Error("Kunci penyimpanan wajib diisi.");
    const existing = entries.find((e) => e.creationKey === b.key);
    if (existing) return { id: existing.id };
  }
  const values = b.values;
  if (!values || typeof values !== "object")
    throw Error("Formulir tidak valid.");
  if (b.kind === "drivers") {
    const name = text(values.name, "Nama pengemudi");
    const phone = typeof values.phone === "string" ? values.phone.trim() : "";
    if (phone && !/^\+?[0-9 ()-]{7,25}$/.test(phone))
      throw Error("Nomor telepon tidak valid.");
    const email =
      typeof values.email === "string" && values.email.trim()
        ? values.email.trim().toLowerCase()
        : undefined;
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      throw Error("Format email tidak valid.");
    const safety = score(values.score, "Skor simulasi");
    const simNumber =
      typeof values.simNumber === "string" ? values.simNumber.trim() : undefined;
    const verificationStatus =
      values.verificationStatus === "pending"
        ? "pending"
        : values.verificationStatus === "rejected"
        ? "rejected"
        : "verified";
    if (record)
      Object.assign(record, {
        name,
        email:
          email ||
          (record as Driver).email ||
          `${name.toLowerCase().replace(/[^a-z0-9]/g, ".")}@fleetra.id`,
        phone,
        score: safety,
        simNumber: simNumber || (record as Driver).simNumber,
        verificationStatus:
          values.verificationStatus !== undefined
            ? verificationStatus
            : (record as Driver).verificationStatus || "verified",
        version: (record.version || 0) + 1,
      });
    else
      s.drivers.unshift({
        id: crypto.randomUUID(),
        name,
        email:
          email ||
          `${name.toLowerCase().replace(/[^a-z0-9]/g, ".")}@fleetra.id`,
        phone,
        score: safety,
        trips: 0,
        braking: 0,
        speeding: 0,
        simNumber: simNumber || "SIM B1 Umum",
        verificationStatus,
        creationKey: b.key,
        version: 1,
      });
  } else {
    const plate = text(values.plate, "Plat kendaraan", 16)
      .toUpperCase()
      .replace(/\s+/g, " ");
    if (!/^[A-Z]{1,2}\s?\d{1,4}\s?[A-Z]{1,3}$/.test(plate))
      throw Error("Format plat kendaraan tidak valid. Contoh D 1234 ABC.");
    if (
      s.vehicles.some(
        (v) => v.id !== record?.id && plateKey(v.plate) === plateKey(plate),
      )
    )
      throw Error("Plat kendaraan sudah terdaftar, termasuk dalam arsip.");
    if (
      record &&
      s.vehicles.find((v) => v.id === record.id)?.plate !== plate &&
      s.trips.some((t) => t.vehicleId === record.id)
    )
      throw Error("Plat dengan riwayat perjalanan tidak dapat diganti.");
    const model = text(values.model, "Model kendaraan");
    const type = values.type === undefined ? inferVehicleType(model) : values.type;
    if (typeof type !== "string" || !vehicleTypes.includes(type as VehicleType))
      throw Error("Pilih jenis kendaraan yang valid.");
    const status = values.status;
    if (status !== "idle" && status !== "service")
      throw Error("Status master harus idle atau perlu servis.");
    const driverId = typeof values.driverId === "string" ? values.driverId : "";
    if (driverId && !s.drivers.some((d) => d.id === driverId && !d.archivedAt))
      throw Error("Pengemudi referensi tidak tersedia.");
    if (
      driverId &&
      s.vehicles.some(
        (v) => v.id !== record?.id && !v.archivedAt && v.driverId === driverId,
      )
    )
      throw Error("Pengemudi sudah menjadi referensi kendaraan lain.");
    const fuel = score(values.fuel, "Bahan bakar");
    const brake = score(values.brake, "Estimasi rem");
    const health = score(values.health, "Indeks kondisi");
    const odometer = score(values.odometer, "Odometer", 10000000);
    if (brake < 30 && status !== "service")
      throw Error("Estimasi rem di bawah 30 harus berstatus perlu servis.");
    const locationIndex = values.locationIndex;
    if (
      typeof locationIndex !== "number" ||
      !Number.isInteger(locationIndex) ||
      !s.locations[locationIndex]
    )
      throw Error("Pilih lokasi simulasi yang valid.");
    const location = s.locations[locationIndex];
    const changes = {
      plate,
      model,
      type: type as VehicleType,
      status,
      driverId,
      fuel,
      brake,
      health,
      odometer,
      lat: location.lat,
      lng: location.lng,
      location: location.address,
    };
    if (record)
      Object.assign(record, { ...changes, version: (record.version || 0) + 1 });
    else
      s.vehicles.unshift({
        ...changes,
        status,
        id: crypto.randomUUID(),
        heading: 0,
        speed: 0,
        creationKey: b.key,
        version: 1,
      });
  }
  return {
    id:
      record?.id ||
      (b.kind === "vehicles" ? s.vehicles[0].id : s.drivers[0].id),
  };
}
