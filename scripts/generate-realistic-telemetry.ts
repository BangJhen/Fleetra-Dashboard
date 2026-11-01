import { mysqlPool, closeMysqlPool } from "../src/lib/mysql";
import fs from "node:fs";
import path from "node:path";

function generateVehicleSnapshots(v: any, companyId = 1) {
  const currentHealth = Number(v.health_score) || 88;
  const currentBrake = Number(v.brake_health_pct) || 64;
  const currentFuel = Number(v.fuel_level_pct) || 74;
  const currentOdo = Number(v.current_odometer_km) || 28500;
  const seed = v.id * 17 + 23;

  const daysAgo = [28, 24, 20, 16, 12, 8, 4, 0];
  const notes = [
    "Pencatatan awal pemantauan telematika armada",
    "Pemeriksaan konsumsi BBM rute pengantaran logistik",
    "Pengisian bahan bakar (refueling SPBU) & cek tekanan ban",
    "Pemeriksaan rutin ketebalan kampas rem & level oli",
    "Pencatatan telemetri harian OBD-II & jarak tempuh",
    "Pengisian bahan bakar (refueling) & servis berkala depo",
    "Inspeksi pra-tugas & uji fungsi sistem pengereman",
    "Pembaruan telematika operasional terkini",
  ];

  const totalKmRun = 1200 + (seed % 600);
  const totalBrakeWear = Math.min(16, Math.max(6, Math.floor((100 - currentBrake) * 0.4)));

  const now = Date.now();
  const snapshots = [];

  for (let i = 0; i < 8; i++) {
    const day = daysAgo[i];
    const isLatest = i === 7;
    const isFirst = i === 0;

    // Time: realistic spread across morning and afternoon
    const hourOffset = (seed + i * 3) % 8 + 8; // between 08:00 and 16:00 WIB
    const minuteOffset = (seed + i * 13) % 60;
    const dateObj = new Date(now - day * 86400000);
    dateObj.setUTCHours(hourOffset - 7, minuteOffset, (seed + i) % 60, 0);
    const recordedAt = dateObj.toISOString().replace("T", " ").replace("Z", "");

    // Odometer: strictly monotonic increasing
    const odo = isLatest ? currentOdo : Math.round(currentOdo - totalKmRun * (1 - i / 7));

    // Brake: realistic downward wear curve leading up to currentBrake
    const wearRatio = i / 7;
    const brakeNoise = isLatest ? 0 : ((seed + i * 7) % 3) - 1;
    const brake = isLatest
      ? currentBrake
      : Math.min(99, Math.max(15, Math.round(currentBrake + totalBrakeWear * (1 - wearRatio) + brakeNoise)));

    // Health: realistic operational condition fluctuations
    const healthNoise = isLatest ? 0 : ((seed + i * 11) % 5) - 2;
    const health = isLatest
      ? currentHealth
      : Math.min(99, Math.max(35, currentHealth + healthNoise));

    // Fuel: realistic saw-tooth consumption & refueling cycle
    let fuel: number;
    if (isLatest) {
      fuel = currentFuel;
    } else {
      const fuelPatterns = [
        88 + (seed % 9),
        38 + (seed % 14),
        95 + (seed % 5),
        46 + (seed % 15),
        28 + (seed % 12),
        93 + (seed % 7),
        54 + (seed % 16),
      ];
      fuel = Math.min(100, Math.max(15, fuelPatterns[i]));
    }

    const source = isFirst ? "baseline" : isLatest ? "master" : "manual";
    snapshots.push({
      company_id: companyId,
      vehicle_id: v.id,
      recorded_at: recordedAt,
      source,
      note: notes[i],
      status: isLatest ? v.status : (i % 2 === 1 ? "moving" : "idle"),
      health_score: health,
      brake_health_pct: brake,
      fuel_level_pct: fuel,
      odometer_km: odo,
      speed_kmh: isLatest ? v.speed_kmh : (i % 2 === 1 ? 26 + (seed % 28) : 0),
      external_id: crypto.randomUUID(),
    });
  }

  return snapshots;
}

function generateDriverSnapshots(d: any, companyId = 1) {
  const currentScore = Number(d.safety_score) || 85;
  const currentTrips = Number(d.trip_count) || 20;
  const currentBraking = Number(d.braking_count) || 0;
  const currentSpeeding = Number(d.speeding_count) || 0;
  const seed = d.id * 19 + 11;

  const daysAgo = [28, 21, 14, 7, 2, 0];
  const notes = [
    "Pencatatan awal profil & skor keselamatan pengemudi",
    "Evaluasi mingguan perilaku berkendara & telemetri OSRM",
    "Pemeriksaan tengah bulan kepatuhan batas kecepatan",
    "Pencatatan riwayat penugasan armada & e-POD selesai",
    "Evaluasi insiden pengereman mendadak (harsh braking)",
    "Pembaruan driver safety score harian terkini",
  ];

  const now = Date.now();
  const snapshots = [];

  for (let i = 0; i < 6; i++) {
    const day = daysAgo[i];
    const isLatest = i === 5;
    const isFirst = i === 0;

    const hourOffset = (seed + i * 5) % 8 + 8;
    const dateObj = new Date(now - day * 86400000);
    dateObj.setUTCHours(hourOffset - 7, (seed * 3) % 60, (seed + i) % 60, 0);
    const recordedAt = dateObj.toISOString().replace("T", " ").replace("Z", "");

    // Score fluctuates naturally around currentScore
    const scoreNoise = isLatest ? 0 : ((seed + i * 7) % 5) - 2;
    const score = isLatest
      ? currentScore
      : Math.min(100, Math.max(50, currentScore + scoreNoise));

    // Cumulative trip count
    const trips = isLatest
      ? currentTrips
      : Math.max(0, Math.round(currentTrips * (0.3 + (i / 5) * 0.7)));

    // Cumulative events
    const braking = isLatest
      ? currentBraking
      : Math.max(0, Math.round(currentBraking * (i / 5)));
    const speeding = isLatest
      ? currentSpeeding
      : Math.max(0, Math.round(currentSpeeding * (i / 5)));

    const source = isFirst ? "baseline" : isLatest ? "master" : "manual";
    snapshots.push({
      company_id: companyId,
      driver_id: d.id,
      recorded_at: recordedAt,
      source,
      note: notes[i],
      safety_score: score,
      braking_count: braking,
      speeding_count: speeding,
      trip_count: trips,
      external_id: crypto.randomUUID(),
    });
  }

  return snapshots;
}

async function main() {
  const pool = mysqlPool();
  console.log("Menghubungkan ke database MariaDB FLEETRA...");

  const [vehicles]: any = await pool.query(
    "SELECT * FROM vehicles WHERE company_id=1 ORDER BY id"
  );
  const [drivers]: any = await pool.query(
    "SELECT * FROM drivers WHERE company_id=1 ORDER BY id"
  );

  console.log(`Memproses ${vehicles.length} armada dan ${drivers.length} pengemudi...`);

  // Clear old flat snapshots
  await pool.query("DELETE FROM vehicle_health_snapshots WHERE company_id=1");
  await pool.query("DELETE FROM driver_safety_snapshots WHERE company_id=1");

  // Insert vehicle health snapshots
  let vehicleSnapshotsCount = 0;
  for (const v of vehicles) {
    const list = generateVehicleSnapshots(v, 1);
    for (const s of list) {
      await pool.query(
        `INSERT INTO vehicle_health_snapshots 
        (company_id, vehicle_id, recorded_at, source, note, status, health_score, brake_health_pct, fuel_level_pct, odometer_km, speed_kmh, external_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          s.company_id,
          s.vehicle_id,
          s.recorded_at,
          s.source,
          s.note,
          s.status,
          s.health_score,
          s.brake_health_pct,
          s.fuel_level_pct,
          s.odometer_km,
          s.speed_kmh,
          s.external_id,
        ]
      );
      vehicleSnapshotsCount++;
    }
  }

  // Insert driver safety snapshots
  let driverSnapshotsCount = 0;
  for (const d of drivers) {
    const list = generateDriverSnapshots(d, 1);
    for (const s of list) {
      await pool.query(
        `INSERT INTO driver_safety_snapshots 
        (company_id, driver_id, recorded_at, source, note, safety_score, braking_count, speeding_count, trip_count, external_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          s.company_id,
          s.driver_id,
          s.recorded_at,
          s.source,
          s.note,
          s.safety_score,
          s.braking_count,
          s.speeding_count,
          s.trip_count,
          s.external_id,
        ]
      );
      driverSnapshotsCount++;
    }
  }

  console.log(`Berhasil menyimpan ${vehicleSnapshotsCount} snapshot kondisi kendaraan ke MariaDB.`);
  console.log(`Berhasil menyimpan ${driverSnapshotsCount} snapshot safety driver ke MariaDB.`);

  // Sync to fleetra.json for full parity
  const jsonPath = path.resolve(process.cwd(), ".data/fleetra.json");
  if (fs.existsSync(jsonPath)) {
    const data = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
    const [allHealth]: any = await pool.query(
      "SELECT h.*, v.external_id as vehicle_ext FROM vehicle_health_snapshots h JOIN vehicles v ON h.vehicle_id=v.id WHERE h.company_id=1 ORDER BY h.recorded_at DESC"
    );
    const [allDriverSafety]: any = await pool.query(
      "SELECT s.*, d.external_id as driver_ext FROM driver_safety_snapshots s JOIN drivers d ON s.driver_id=d.id WHERE s.company_id=1 ORDER BY s.recorded_at DESC"
    );

    const safetyHistory = [
      ...allHealth.map((r: any) => ({
        id: r.external_id,
        kind: "vehicles",
        entityId: r.vehicle_ext,
        at: new Date(r.recorded_at).toISOString(),
        source: r.source,
        note: r.note || "",
        values: {
          health: Number(r.health_score),
          brake: Number(r.brake_health_pct),
          fuel: Number(r.fuel_level_pct),
          odometer: Number(r.odometer_km),
          speed: Number(r.speed_kmh),
          status: r.status,
        },
      })),
      ...allDriverSafety.map((r: any) => ({
        id: r.external_id,
        kind: "drivers",
        entityId: r.driver_ext,
        at: new Date(r.recorded_at).toISOString(),
        source: r.source,
        note: r.note || "",
        values: {
          score: Number(r.safety_score),
          braking: Number(r.braking_count),
          speeding: Number(r.speeding_count),
          trips: Number(r.trip_count),
        },
      })),
    ];

    data.safetyHistory = safetyHistory;
    fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2));
    console.log(`Sinkronisasi fleetra.json selesai dengan total ${safetyHistory.length} riwayat snapshot.`);
  }

  await closeMysqlPool();
}

main().catch(console.error);
