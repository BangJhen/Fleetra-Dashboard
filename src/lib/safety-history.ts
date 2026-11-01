import type { FleetState, SafetySnapshot } from "./types";
export function captureSafety(
  s: FleetState,
  source: SafetySnapshot["source"] = "master",
  note = "Perubahan data master simulasi",
  at = new Date().toISOString(),
) {
  let changed = false;
  s.safetyHistory ??= [];
  for (const kind of ["vehicles", "drivers"] as const) {
    for (const record of s[kind]) {
      if (record.archivedAt) continue;
      const latest = s.safetyHistory.find(
        (h) => h.kind === kind && h.entityId === record.id,
      );
      const values =
        kind === "vehicles"
          ? (() => {
              const v = s.vehicles.find((v) => v.id === record.id)!;
              return {
                health: v.health,
                brake: v.brake,
                fuel: v.fuel,
                odometer: v.odometer,
                speed: v.speed,
                status: v.status,
              };
            })()
          : (() => {
              const d = s.drivers.find((d) => d.id === record.id)!;
              return {
                score: d.score,
                braking: d.braking,
                speeding: d.speeding,
                trips: d.trips,
              };
            })();
      if (latest && JSON.stringify(latest.values) === JSON.stringify(values))
        continue;
      s.safetyHistory.unshift({
        id: crypto.randomUUID(),
        kind,
        entityId: record.id,
        at,
        source: latest ? source : "baseline",
        note: latest
          ? note
          : "Catatan awal simulasi pada saat pemantauan diaktifkan",
        values,
      });
      changed = true;
    }
  }
  return changed;
}
function number(v: unknown, label: string, max = 100) {
  if (typeof v !== "number" || !Number.isFinite(v) || v < 0 || v > max)
    throw Error(`${label} harus antara 0 dan ${max}.`);
  return v;
}
export function recordSafety(s: FleetState, body: Record<string, unknown>) {
  const kind = body.kind;
  if (kind !== "vehicles" && kind !== "drivers")
    throw Error("Jenis pemeriksaan tidak valid.");
  const record = s[kind].find((r) => r.id === body.id && !r.archivedAt);
  if (!record) throw Error("Data aktif tidak ditemukan.");
  if (typeof body.key !== "string" || !body.key.trim() || body.key.length > 100)
    throw Error("Kunci pemeriksaan tidak valid.");
  const existing = s.safetyHistory?.find(
    (h) => h.key === body.key && h.kind === kind && h.entityId === record.id,
  );
  if (existing) return { id: existing.id };
  if (body.version !== (record.version || 0))
    throw Error("Data sudah berubah. Muat ulang sebelum mencatat pemeriksaan.");

  if (
    typeof body.note !== "string" ||
    !body.note.trim() ||
    body.note.length > 500
  )
    throw Error(
      "Catatan pemeriksaan wajib diisi dengan maksimal 500 karakter.",
    );
  const values = body.values as Record<string, unknown>;
  if (!values || typeof values !== "object")
    throw Error("Parameter pemeriksaan tidak valid.");
  let measured: SafetySnapshot["values"];
  if (kind === "vehicles") {
    const v = s.vehicles.find((v) => v.id === record.id)!;
    const health = number(values.health, "Indeks kondisi");
    const brake = number(values.brake, "Estimasi rem");
    const fuel = number(values.fuel, "Bahan bakar");
    const odometer = number(values.odometer, "Odometer", 10000000);
    if (odometer < v.odometer)
      throw Error("Odometer tidak boleh lebih rendah dari catatan sebelumnya.");
    Object.assign(v, { health, brake, fuel, odometer });
    if (brake < 30) {
      v.status = "service";
      v.speed = 0;
    }
    measured = {
      health,
      brake,
      fuel,
      odometer,
      speed: v.speed,
      status: v.status,
    };
  } else {
    const d = s.drivers.find((d) => d.id === record.id)!;
    const score = number(values.score, "Skor keselamatan");
    const braking = number(values.braking, "Pengereman keras", 1000000);
    const speeding = number(values.speeding, "Melebihi kecepatan", 1000000);
    if (
      !Number.isInteger(braking) ||
      !Number.isInteger(speeding) ||
      braking < d.braking ||
      speeding < d.speeding
    )
      throw Error(
        "Jumlah kejadian kumulatif harus bilangan bulat dan tidak boleh berkurang.",
      );
    Object.assign(d, { score, braking, speeding });
    measured = { score, braking, speeding, trips: d.trips };
  }
  record.version = (record.version || 0) + 1;
  const snapshot: SafetySnapshot = {
    id: crypto.randomUUID(),
    entityId: record.id,
    kind,
    at: new Date().toISOString(),
    source: "manual",
    note: body.note.trim(),
    key: body.key,
    values: measured,
  };
  s.safetyHistory.unshift(snapshot);
  return { id: snapshot.id };
}
export function historyFor(
  s: FleetState,
  kind: "vehicles" | "drivers",
  id: string,
  days = 30,
) {
  const cutoff = Date.now() - days * 86400000;
  return (s.safetyHistory || [])
    .filter(
      (h) => h.kind === kind && h.entityId === id && Date.parse(h.at) >= cutoff,
    )
    .toSorted((a, b) => Date.parse(a.at) - Date.parse(b.at));
}
