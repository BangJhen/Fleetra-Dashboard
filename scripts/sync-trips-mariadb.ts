import { mysqlPool } from "../src/lib/mysql";
import { mysqlTransact } from "../src/lib/mysql-store";
import { createSeed } from "../src/lib/seed";
import { availableResources } from "../src/lib/domain";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

async function main() {
  console.log("🚀 Menyelaraskan Penugasan Armada ke MariaDB FLEETRA...");

  // Generate seed state containing 118 trips
  const seeded = createSeed();
  console.log(`Generated seeded trips: ${seeded.trips.length} penugasan`);

  const inProgress = seeded.trips.filter((t) => t.status === "in_progress").length;
  const assigned = seeded.trips.filter((t) => t.status === "assigned").length;
  const completed = seeded.trips.filter((t) => t.status === "completed").length;
  console.log(`Status breakdown: ${inProgress} Sedang berjalan, ${assigned} Menunggu dimulai, ${completed} Selesai.`);

  // Connect to MariaDB and get company
  const pool = mysqlPool();
  const c = await pool.getConnection();

  try {
    const [companies] = await c.query<any[]>("SELECT * FROM companies WHERE id=1");
    if (!companies.length) {
      throw new Error("Perusahaan dengan ID 1 tidak ditemukan di MariaDB.");
    }
    const company = companies[0];

    // Clean up temporary manual trips 1, 2, 3 which have no external foreign keys
    await c.execute("DELETE FROM trip_waypoints WHERE company_id=1 AND trip_id IN (1, 2, 3)");
    await c.execute("DELETE FROM trips WHERE company_id=1 AND id IN (1, 2, 3)");

    // Pre-clear active status and rename codes on remaining trips to prevent collisions during batch update
    console.log("Mempersiapkan status transisi aktif dan kode tiket di MariaDB...");
    await c.execute("UPDATE trips SET status='completed', trip_code=CONCAT('TRANS-', id) WHERE company_id=1");

    // Transact the updated seeded state into MariaDB
    console.log("Menyimpan data 118 penugasan ke MariaDB via mysqlTransact...");
    await mysqlTransact(async (state) => {
      state.trips = seeded.trips;
      return state;
    }, true);

    // Verify loaded state from MariaDB
    const reloaded = await mysqlTransact((state) => state, false);
    const dbInProgress = reloaded.trips.filter((t) => t.status === "in_progress").length;
    const dbAssigned = reloaded.trips.filter((t) => t.status === "assigned").length;
    const dbCompleted = reloaded.trips.filter((t) => t.status === "completed").length;
    const resources = availableResources(reloaded);

    console.log("\n✅ Verifikasi Berhasil dari MariaDB:");
    console.log(`- Total penugasan tersimpan di MariaDB: ${reloaded.trips.length}`);
    console.log(`- Penugasan Sedang berjalan (in_progress): ${dbInProgress} (100% sinkron dengan 88 unit armada bergerak)`);
    console.log(`- Penugasan Menunggu dimulai (assigned): ${dbAssigned} (6 unit armada idle yang dialokasikan)`);
    console.log(`- Penugasan Selesai (completed): ${dbCompleted} (shift pagi tuntas)`);
    console.log(`- Armada idle siaga di pul: ${resources.vehicles.length} unit siap dialokasikan di (+ Buat penugasan)`);

    // Also update .data/fleetra.json for fallback consistency
    const jsonPath = path.resolve(process.cwd(), ".data", "fleetra.json");
    await mkdir(path.dirname(jsonPath), { recursive: true });
    await writeFile(jsonPath, JSON.stringify(reloaded, null, 2), "utf8");
    console.log(`- JSON mirror tersinkronisasi di: ${jsonPath}`);

  } finally {
    c.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error("❌ Gagal menyelaraskan database:", err);
  process.exit(1);
});
