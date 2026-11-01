import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { mysqlPool } from "../../src/lib/mysql";
import { mysqlTransact } from "../../src/lib/mysql-store";
import type { FleetState } from "../../src/lib/types";
async function main() {
  const source: FleetState = JSON.parse(
    await readFile(
      path.join(process.env.FLEETRA_SOURCE_DATA_DIR || ".data", "fleetra.json"),
      "utf8",
    ),
  );
  const actual = await mysqlTransact((s) => s, false);
  for (const key of [
    "vehicles",
    "drivers",
    "trips",
    "contracts",
    "ledger",
    "etle",
    "notices",
  ] as const) {
    assert.deepEqual(
      actual[key].map((x) => x.id).sort(),
      source[key].map((x) => x.id).sort(),
      `IDs ${key}`,
    );
  }
  for (const trip of source.trips) {
    const saved = actual.trips.find((t) => t.id === trip.id)!;
    assert.equal(saved.vehicleId, trip.vehicleId);
    assert.equal(saved.driverId, trip.driverId);
    assert.deepEqual(
      saved.stops.map((s) => s.id),
      trip.stops.map((s) => s.id),
    );
    assert.deepEqual(saved.route, trip.route);
    assert.equal(saved.status, trip.status);
  }
  for (const snapshot of source.safetyHistory)
    assert.ok(
      actual.safetyHistory.some(
        (h) => h.id === snapshot.id && h.entityId === snapshot.entityId,
      ),
    );
  for (const entry of source.etle)
    assert.deepEqual(
      actual.etle.find((e) => e.id === entry.id)?.candidates,
      entry.candidates,
    );
  console.log(
    "Legacy IDs, trips, geometry, history and ETLE relationships preserved",
  );
}
main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => mysqlPool().end());
