/* eslint-disable @typescript-eslint/no-explicit-any */
import type {
  PoolConnection,
  RowDataPacket,
  ResultSetHeader,
} from "mysql2/promise";
import { mysqlPool } from "./mysql";
import { captureSafety } from "./safety-history";
import type { FleetState, SafetySnapshot } from "./types";

type Row = RowDataPacket & Record<string, any>;
type Ids = Record<string, Map<string, number>>;
const iso = (value: string | null | undefined) =>
  value
    ? new Date(
        value.replace(" ", "T") + (value.includes("T") ? "" : "Z"),
      ).toISOString()
    : undefined;
const sqlDate = (value: string | undefined | null) =>
  value
    ? new Date(value).toISOString().replace("T", " ").replace("Z", "")
    : null;
const external = (row: Row, prefix: string) =>
  row.external_id || `${prefix}-${row.id}`;
const parsed = (value: unknown) =>
  typeof value === "string" ? JSON.parse(value) : value;
async function rows(
  c: PoolConnection,
  sql: string,
  params: unknown[] = [],
): Promise<Row[]> {
  const [result] = await c.query<Row[]>(sql, params);
  return result;
}
async function load(
  c: PoolConnection,
  company: Row,
): Promise<{ state: FleetState; ids: Ids }> {
  const id = company.id;
  const [
    locations,
    drivers,
    vehicles,
    trips,
    waypoints,
    proofs,
    contracts,
    ledger,
    etle,
    candidates,
    health,
    safety,
    notices,
    users,
  ] = await Promise.all([
    rows(
      c,
      "SELECT * FROM locations WHERE company_id=? ORDER BY location_index",
      [id],
    ),
    rows(c, "SELECT * FROM drivers WHERE company_id=? ORDER BY id", [id]),
    rows(c, "SELECT * FROM vehicles WHERE company_id=? ORDER BY id", [id]),
    rows(c, "SELECT * FROM trips WHERE company_id=? ORDER BY id", [id]),
    rows(
      c,
      "SELECT * FROM trip_waypoints WHERE company_id=? ORDER BY sequence_number",
      [id],
    ),
    rows(c, "SELECT * FROM epod_records WHERE company_id=?", [id]),
    rows(c, "SELECT * FROM rto_contracts WHERE company_id=? ORDER BY id", [id]),
    rows(c, "SELECT * FROM rto_transactions WHERE company_id=? ORDER BY id", [
      id,
    ]),
    rows(c, "SELECT * FROM etle_violations WHERE company_id=? ORDER BY id", [
      id,
    ]),
    rows(c, "SELECT * FROM etle_trip_candidates WHERE company_id=?", [id]),
    rows(
      c,
      "SELECT * FROM vehicle_health_snapshots WHERE company_id=? ORDER BY recorded_at DESC,id DESC",
      [id],
    ),
    rows(
      c,
      "SELECT * FROM driver_safety_snapshots WHERE company_id=? ORDER BY recorded_at DESC,id DESC",
      [id],
    ),
    rows(c, "SELECT * FROM notifications WHERE company_id=? ORDER BY id DESC", [
      id,
    ]),
    rows(c, "SELECT * FROM users WHERE company_id=? AND external_id='demo'", [
      id,
    ]),
  ]);
  const sets: [string, Row[]][] = [
    ["drivers", drivers],
    ["vehicles", vehicles],
    ["trips", trips],
    ["trip_waypoints", waypoints],
    ["rto_contracts", contracts],
    ["rto_transactions", ledger],
    ["etle_violations", etle],
    ["vehicle_health_snapshots", health],
    ["driver_safety_snapshots", safety],
    ["notifications", notices],
  ];
  const ids: Ids = {};
  const reverse: Record<string, Map<number, string>> = {};
  for (const [name, list] of sets) {
    ids[name] = new Map(list.map((r) => [external(r, name), r.id]));
    reverse[name] = new Map(list.map((r) => [r.id, external(r, name)]));
  }
  const ref = (name: string, value: number | null) =>
    value == null ? "" : reverse[name].get(value) || "";
  const histories: SafetySnapshot[] = [
    ...health.map((r) => ({
      id: external(r, "vehicle_health_snapshots"),
      kind: "vehicles" as const,
      entityId: ref("vehicles", r.vehicle_id),
      at: iso(r.recorded_at)!,
      source: r.source,
      note: r.note || "",
      ...(r.idempotency_key ? { key: r.idempotency_key } : {}),
      values: {
        health: r.health_score,
        brake: r.brake_health_pct,
        fuel: r.fuel_level_pct,
        odometer: r.odometer_km,
        speed: r.speed_kmh,
        status: r.status,
      },
    })),
    ...safety.map((r) => ({
      id: external(r, "driver_safety_snapshots"),
      kind: "drivers" as const,
      entityId: ref("drivers", r.driver_id),
      at: iso(r.recorded_at)!,
      source: r.source,
      note: r.note || "",
      ...(r.idempotency_key ? { key: r.idempotency_key } : {}),
      values: {
        score: r.safety_score,
        braking: r.braking_count,
        speeding: r.speeding_count,
        trips: r.trip_count,
      },
    })),
  ].sort((a, b) => b.at.localeCompare(a.at));
  const demo = users[0];
  if (!demo) throw Error("Profil demo database belum tersedia. Jalankan seed.");
  return {
    ids,
    state: {
      workspace: {
        name: company.name,
        region: company.address || "Belum diisi",
      },
      locations: locations.map((r) => ({
        name: r.name,
        address: r.address,
        lat: r.latitude,
        lng: r.longitude,
      })),
      operatorProfile: {
        name: demo.full_name,
        email: demo.contact_email || demo.email,
        phone: demo.phone || "",
        version: demo.version,
      },
      drivers: drivers.map((r) => ({
        id: external(r, "drivers"),
        name: r.full_name,
        phone: r.phone || "",
        score: r.safety_score,
        trips: r.trip_count,
        braking: r.braking_count,
        speeding: r.speeding_count,
        version: r.version,
        ...(r.creation_key ? { creationKey: r.creation_key } : {}),
        ...(r.archived_at ? { archivedAt: iso(r.archived_at) } : {}),
      })),
      vehicles: vehicles.map((r) => ({
        id: external(r, "vehicles"),
        plate: r.license_plate,
        model: r.model,
        type: r.vehicle_type,
        status: r.status,
        driverId: ref("drivers", r.reference_driver_id),
        lat: r.latitude,
        lng: r.longitude,
        heading: r.heading || 0,
        speed: r.speed_kmh || 0,
        fuel: r.fuel_level_pct,
        brake: r.brake_health_pct,
        odometer: r.current_odometer_km,
        health: r.health_score,
        location: r.location_label || "",
        version: r.version,
        ...(r.creation_key ? { creationKey: r.creation_key } : {}),
        ...(r.archived_at ? { archivedAt: iso(r.archived_at) } : {}),
      })),
      trips: trips.map((t) => ({
        id: external(t, "trips"),
        code: t.trip_code,
        vehicleId: ref("vehicles", t.vehicle_id),
        driverId: ref("drivers", t.driver_id),
        status: t.status,
        createdAt: iso(t.created_at)!,
        ...(t.started_at ? { startedAt: iso(t.started_at) } : {}),
        ...(t.completed_at ? { completedAt: iso(t.completed_at) } : {}),
        distance: t.distance_km,
        duration: t.duration_minutes,
        ...(t.route_geometry
          ? { route: parsed(t.route_geometry), routeSource: t.route_source }
          : {}),
        key: t.idempotency_key,
        stops: waypoints
          .filter((w) => w.trip_id === t.id)
          .map((w) => {
            const proof = proofs.find((p) => p.waypoint_id === w.id);
            return {
              id: external(w, "trip_waypoints"),
              name: w.destination_name,
              address: w.address,
              lat: w.latitude,
              lng: w.longitude,
              type: w.stop_type,
              status: w.status,
              ...(w.failure_reason ? { failureReason: w.failure_reason } : {}),
              ...(proof
                ? {
                    epod: {
                      recipient: proof.recipient_name,
                      photo: proof.photo_url,
                      signature: proof.signature_url,
                      at: iso(proof.submitted_at)!,
                    },
                  }
                : {}),
            };
          }),
      })),
      contracts: contracts.map((r) => ({
        id: external(r, "rto_contracts"),
        driverId: ref("drivers", r.driver_id),
        vehicleId: ref("vehicles", r.vehicle_id),
        total: r.target_price,
        openingBalance: r.opening_balance,
        months: r.tenor_months,
        elapsed: r.elapsed_months,
      })),
      ledger: ledger.map((r) => ({
        id: external(r, "rto_transactions"),
        contractId: ref("rto_contracts", r.contract_id),
        tripId: ref("trips", r.trip_id),
        amount: r.amount_deducted,
        at: iso(r.created_at)!,
      })),
      etle: etle.map((r) => ({
        id: external(r, "etle_violations"),
        reference: r.ticket_number,
        plate: r.vehicle_plate,
        at: iso(r.incident_time)!,
        location: r.camera_location_name || "Tidak dicantumkan",
        candidates: candidates
          .filter((x) => x.etle_id === r.id)
          .map((x) => ref("trips", x.trip_id)),
        status: r.review_status,
        source: r.source,
      })),
      notices: notices.map((r) => ({
        id: external(r, "notifications"),
        title: r.title,
        description: r.description,
        kind: r.kind,
        href: r.target_url || "",
        at: iso(r.created_at)!,
        status: r.status,
      })),
      safetyHistory: histories,
      updatedAt: iso(company.updated_at)!,
    },
  };
}
function changed(a: unknown, b: unknown) {
  return JSON.stringify(a) !== JSON.stringify(b);
}
async function save(
  c: PoolConnection,
  companyId: number,
  state: FleetState,
  old: FleetState | undefined,
  ids: Ids,
) {
  async function sync(
    table: string,
    ext: string,
    values: Record<string, any>,
    previous: unknown,
    next: unknown,
  ) {
    const map = (ids[table] ||= new Map<string, number>());
    const existing = map.get(ext);
    if (existing && !changed(previous, next)) return existing;
    const cols = Object.keys(values);
    const params = Object.values(values);
    if (existing)
      await c.execute(
        `UPDATE ${table} SET ${cols.map((k) => `${k}=?`).join(",")} WHERE company_id=? AND id=?`,
        [...params, companyId, existing],
      );
    else {
      const [r] = await c.execute<ResultSetHeader>(
        `INSERT INTO ${table} (company_id,external_id,${cols.join(",")}) VALUES (?, ?, ${cols.map(() => "?").join(",")})`,
        [companyId, ext, ...params],
      );
      map.set(ext, r.insertId);
    }
    return map.get(ext)!;
  }
  const requireId = (table: string, ext: string) => {
    const id = ids[table]?.get(ext);
    if (!id) throw Error(`Referensi ${table} tidak ditemukan: ${ext}`);
    return id;
  };
  const oldBy = <T extends { id: string }>(list: T[] | undefined, id: string) =>
    list?.find((v) => v.id === id);
  for (const d of state.drivers)
    await sync(
      "drivers",
      d.id,
      {
        full_name: d.name,
        phone: d.phone,
        safety_score: d.score,
        trip_count: d.trips,
        braking_count: d.braking,
        speeding_count: d.speeding,
        version: d.version || 0,
        creation_key: d.creationKey || null,
        archived_at: sqlDate(d.archivedAt),
      },
      oldBy(old?.drivers, d.id),
      d,
    );
  for (const v of state.vehicles)
    await sync(
      "vehicles",
      v.id,
      {
        license_plate: v.plate,
        model: v.model,
        vehicle_type: v.type,
        status: v.status,
        reference_driver_id: v.driverId
          ? requireId("drivers", v.driverId)
          : null,
        current_odometer_km: v.odometer,
        fuel_level_pct: v.fuel,
        brake_health_pct: v.brake,
        health_score: v.health,
        latitude: v.lat,
        longitude: v.lng,
        heading: v.heading,
        speed_kmh: v.speed,
        location_label: v.location,
        version: v.version || 0,
        creation_key: v.creationKey || null,
        archived_at: sqlDate(v.archivedAt),
      },
      oldBy(old?.vehicles, v.id),
      v,
    );
  for (const t of state.trips) {
    const before = oldBy(old?.trips, t.id);
    const tripId = await sync(
      "trips",
      t.id,
      {
        vehicle_id: requireId("vehicles", t.vehicleId),
        driver_id: requireId("drivers", t.driverId),
        trip_code: t.code,
        status: t.status,
        started_at: sqlDate(t.startedAt),
        completed_at: sqlDate(t.completedAt),
        distance_km: t.distance,
        duration_minutes: t.duration,
        route_geometry: t.route ? JSON.stringify(t.route) : null,
        route_source: t.routeSource || null,
        idempotency_key: t.key,
        created_at: sqlDate(t.createdAt),
      },
      before,
      t,
    );
    for (const [index, stop] of t.stops.entries()) {
      const prior = before?.stops.find((s) => s.id === stop.id);
      const epod = stop.epod;
      const waypointId = await sync(
        "trip_waypoints",
        stop.id,
        {
          trip_id: tripId,
          sequence_number: index + 1,
          stop_type: stop.type,
          destination_name: stop.name,
          address: stop.address,
          latitude: stop.lat,
          longitude: stop.lng,
          status: stop.status,
          failure_reason: stop.failureReason || null,
        },
        prior,
        stop,
      );
      if (epod && changed(prior?.epod, epod))
        await c.execute(
          "INSERT INTO epod_records (company_id,waypoint_id,recipient_name,photo_url,signature_url,submitted_at) VALUES (?,?,?,?,?,?) ON DUPLICATE KEY UPDATE recipient_name=VALUES(recipient_name),photo_url=VALUES(photo_url),signature_url=VALUES(signature_url),submitted_at=VALUES(submitted_at)",
          [
            companyId,
            waypointId,
            epod.recipient,
            epod.photo,
            epod.signature,
            sqlDate(epod.at),
          ],
        );
    }
  }
  for (const k of state.contracts)
    await sync(
      "rto_contracts",
      k.id,
      {
        vehicle_id: requireId("vehicles", k.vehicleId),
        driver_id: requireId("drivers", k.driverId),
        target_price: k.total,
        opening_balance: k.openingBalance,
        tenor_months: k.months,
        elapsed_months: k.elapsed,
      },
      oldBy(old?.contracts, k.id),
      k,
    );
  for (const l of state.ledger)
    await sync(
      "rto_transactions",
      l.id,
      {
        contract_id: requireId("rto_contracts", l.contractId),
        trip_id: requireId("trips", l.tripId),
        amount_deducted: l.amount,
        created_at: sqlDate(l.at),
      },
      oldBy(old?.ledger, l.id),
      l,
    );
  for (const e of state.etle) {
    const prior = oldBy(old?.etle, e.id);
    const vehicle = state.vehicles.find(
      (v) =>
        v.plate.replace(/\s/g, "").toLowerCase() ===
        e.plate.replace(/\s/g, "").toLowerCase(),
    );
    const eid = await sync(
      "etle_violations",
      e.id,
      {
        vehicle_id: vehicle ? requireId("vehicles", vehicle.id) : null,
        ticket_number: e.reference,
        vehicle_plate: e.plate,
        camera_location_name: e.location,
        incident_time: sqlDate(e.at),
        review_status: e.status,
        source: e.source || "operator",
      },
      prior,
      e,
    );
    if (changed(prior?.candidates, e.candidates)) {
      await c.execute(
        "DELETE FROM etle_trip_candidates WHERE company_id=? AND etle_id=?",
        [companyId, eid],
      );
      for (const trip of e.candidates)
        await c.execute(
          "INSERT INTO etle_trip_candidates (company_id,etle_id,trip_id) VALUES (?,?,?)",
          [companyId, eid, requireId("trips", trip)],
        );
    }
  }
  for (const h of [...state.safetyHistory].reverse()) {
    const prior = oldBy(old?.safetyHistory, h.id);
    const v = h.values;
    const common = {
      recorded_at: sqlDate(h.at),
      source: h.source,
      note: h.note,
      idempotency_key: h.key || null,
    };
    if (h.kind === "vehicles")
      await sync(
        "vehicle_health_snapshots",
        h.id,
        {
          vehicle_id: requireId("vehicles", h.entityId),
          ...common,
          status: v.status || null,
          health_score: v.health ?? null,
          brake_health_pct: v.brake ?? null,
          fuel_level_pct: v.fuel ?? null,
          odometer_km: v.odometer ?? null,
          speed_kmh: v.speed ?? null,
        },
        prior,
        h,
      );
    else
      await sync(
        "driver_safety_snapshots",
        h.id,
        {
          driver_id: requireId("drivers", h.entityId),
          ...common,
          safety_score: v.score ?? null,
          braking_count: v.braking ?? null,
          speeding_count: v.speeding ?? null,
          trip_count: v.trips ?? null,
        },
        prior,
        h,
      );
  }
  for (const n of [...state.notices].reverse())
    await sync(
      "notifications",
      n.id,
      {
        title: n.title,
        description: n.description,
        kind: n.kind,
        target_url: n.href,
        status: n.status,
        created_at: sqlDate(n.at),
      },
      oldBy(old?.notices, n.id),
      n,
    );
  if (!old || changed(old.operatorProfile, state.operatorProfile))
    await c.execute(
      "UPDATE users SET full_name=?,contact_email=?,phone=?,version=? WHERE company_id=? AND external_id='demo'",
      [
        state.operatorProfile.name,
        state.operatorProfile.email,
        state.operatorProfile.phone,
        state.operatorProfile.version,
        companyId,
      ],
    );
  await c.execute("UPDATE companies SET updated_at=? WHERE id=?", [
    sqlDate(state.updatedAt),
    companyId,
  ]);
}
export async function mysqlTransact<T>(
  fn: (state: FleetState) => T | Promise<T>,
  write = true,
): Promise<T> {
  const c = await mysqlPool().getConnection();
  try {
    await c.beginTransaction();
    const company = (
      await rows(
        c,
        `SELECT * FROM companies WHERE slug=?${write ? " FOR UPDATE" : ""}`,
        ["fleetra-demo"],
      )
    )[0];
    if (!company)
      throw Error(
        "Database belum berisi data awal FLEETRA. Jalankan seed database.",
      );
    const { state, ids } = await load(c, company);
    const previous = write ? structuredClone(state) : undefined;
    const result = await fn(state);
    if (write) {
      captureSafety(state);
      state.updatedAt = new Date().toISOString();
      await save(c, company.id, state, previous, ids);
    }
    await c.commit();
    return result;
  } catch (error) {
    await c.rollback();
    throw error;
  } finally {
    c.release();
  }
}
export async function seedMysql(
  state: FleetState,
  accounts: {
    id: string;
    loginEmail: string;
    salt: string;
    passwordHash: string;
    profile: { name: string; email: string; phone: string; version: number };
    createdAt: string;
  }[] = [],
) {
  const c = await mysqlPool().getConnection();
  try {
    await c.beginTransaction();
    const existing = await rows(
      c,
      "SELECT id FROM companies LIMIT 1 FOR UPDATE",
    );
    if (existing.length)
      throw Error(
        "Database tidak kosong. Seed dibatalkan untuk melindungi data yang ada.",
      );
    const [result] = await c.execute<ResultSetHeader>(
      "INSERT INTO companies (slug,name,address,updated_at) VALUES (?,?,?,?)",
      [
        "fleetra-demo",
        state.workspace.name,
        state.workspace.region,
        sqlDate(state.updatedAt),
      ],
    );
    const id = result.insertId;
    await c.execute(
      "INSERT INTO users (company_id,external_id,full_name,email,contact_email,phone,password_hash,role,version) VALUES (?,?,?,?,?,?,?,'admin',?)",
      [
        id,
        "demo",
        state.operatorProfile.name,
        "manager@fleetra.demo",
        state.operatorProfile.email,
        state.operatorProfile.phone,
        "!",
        state.operatorProfile.version,
      ],
    );
    for (const account of accounts)
      await c.execute(
        "INSERT INTO users (company_id,external_id,full_name,email,contact_email,phone,password_hash,role,version,created_at) VALUES (?,?,?,?,?,?,?,'dispatcher',?,?)",
        [
          id,
          account.id,
          account.profile.name,
          account.loginEmail,
          account.profile.email,
          account.profile.phone,
          `${account.salt}:${account.passwordHash}`,
          account.profile.version,
          sqlDate(account.createdAt),
        ],
      );
    for (const [index, location] of state.locations.entries())
      await c.execute(
        "INSERT INTO locations (company_id,location_index,name,address,latitude,longitude) VALUES (?,?,?,?,?,?)",
        [
          id,
          index,
          location.name,
          location.address,
          location.lat,
          location.lng,
        ],
      );
    await save(c, id, state, undefined, {});
    await c.commit();
  } catch (error) {
    await c.rollback();
    throw error;
  } finally {
    c.release();
  }
}
