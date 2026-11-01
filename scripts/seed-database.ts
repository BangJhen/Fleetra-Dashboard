import { readFile } from "node:fs/promises";
import path from "node:path";
import { createSeed, defaultWorkspace, locations } from "../src/lib/seed";
import { migrateVehicleTypes } from "../src/lib/vehicle-types";
import { defaultOperatorProfile } from "../src/lib/operator-profile";
import { ensureDemoEtle } from "../src/lib/etle-demo";
import { captureSafety } from "../src/lib/safety-history";
import { seedMysql } from "../src/lib/mysql-store";
import { closeMysqlPool } from "../src/lib/mysql";
import type { FleetState } from "../src/lib/types";

async function main() {
  const directory = path.resolve(
    process.cwd(),
    process.env.FLEETRA_DATA_DIR || ".data",
  );
  let state: FleetState;
  try {
    state = JSON.parse(
      await readFile(path.join(directory, "fleetra.json"), "utf8"),
    );
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    state = createSeed();
  }
  state.locations ??= locations.map((location) => ({ ...location }));
  state.workspace ??= { ...defaultWorkspace };
  state.operatorProfile ??= { ...defaultOperatorProfile };
  state.safetyHistory ??= [];
  migrateVehicleTypes(state.vehicles);
  ensureDemoEtle(state);
  captureSafety(state, "baseline");
  let accounts = [];
  try {
    accounts = JSON.parse(
      await readFile(path.join(directory, "accounts.json"), "utf8"),
    );
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
  await seedMysql(state, accounts);
  console.log(
    `Seed selesai: ${state.vehicles.length} armada, ${state.drivers.length} pengemudi, ${state.trips.length} perjalanan, ${state.locations.length} lokasi.`,
  );
}
main()
  .catch((error) => {
    console.error("Seed gagal:", error.message);
    process.exitCode = 1;
  })
  .finally(closeMysqlPool);
