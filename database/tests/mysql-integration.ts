import assert from "node:assert/strict";
import { mysqlPool } from "../../src/lib/mysql";
import { mysqlTransact, seedMysql } from "../../src/lib/mysql-store";
import { changeMaster } from "../../src/lib/master-data";
import { createSeed } from "../../src/lib/seed";

async function main() {
  const initial = await mysqlTransact((s) => s, false);
  assert.equal(initial.vehicles.length, 142);
  assert.equal(initial.drivers.length, 142);
  assert.equal(initial.locations.length, 8);
  assert.ok(initial.etle.length >= 3);
  const original = initial.vehicles[0];
  await mysqlPool().execute("UPDATE vehicles SET model=? WHERE external_id=?", [
    "Model dari database",
    original.id,
  ]);
  assert.equal(
    (await mysqlTransact((s) => s, false)).vehicles[0].model,
    "Model dari database",
  );
  await mysqlPool().execute("UPDATE vehicles SET model=? WHERE external_id=?", [
    original.model,
    original.id,
  ]);
  const added = await mysqlTransact((s) =>
    changeMaster(s, {
      action: "master-save",
      kind: "drivers",
      key: "test-db-driver",
      values: { name: "Driver database QA", phone: "", score: 94 },
    }),
  );
  let state = await mysqlTransact((s) => s, false);
  const driver = state.drivers.find((d) => d.id === added.id)!;
  assert.ok(driver);
  await mysqlTransact((s) =>
    changeMaster(s, {
      action: "master-save",
      kind: "drivers",
      id: driver.id,
      version: driver.version,
      values: { name: "Driver database updated", phone: "", score: 91 },
    }),
  );
  state = await mysqlTransact((s) => s, false);
  const updated = state.drivers.find((d) => d.id === driver.id)!;
  assert.equal(updated.name, "Driver database updated");
  assert.ok(state.safetyHistory.some((h) => h.entityId === driver.id));
  await mysqlTransact((s) =>
    changeMaster(s, {
      action: "master-archive",
      kind: "drivers",
      id: driver.id,
      version: updated.version,
    }),
  );
  state = await mysqlTransact((s) => s, false);
  assert.ok(state.drivers.find((d) => d.id === driver.id)?.archivedAt);
  await assert.rejects(() => seedMysql(createSeed()), /tidak kosong/);
  await Promise.all([
    mysqlTransact(async (s) => {
      await new Promise((resolve) => setTimeout(resolve, 150));
      s.operatorProfile.phone = "081234567890";
    }),
    mysqlTransact((s) => {
      s.operatorProfile.name = "Operator concurrency";
    }),
  ]);
  state = await mysqlTransact((s) => s, false);
  assert.equal(state.operatorProfile.phone, "081234567890");
  assert.equal(state.operatorProfile.name, "Operator concurrency");
  const [testDriverRow] = await mysqlPool().execute<any[]>(
    "SELECT id FROM drivers WHERE external_id=?",
    [driver.id],
  );
  if (testDriverRow.length > 0) {
    const internalId = testDriverRow[0].id;
    await mysqlPool().execute(
      "DELETE FROM driver_safety_snapshots WHERE driver_id=?",
      [internalId],
    );
    await mysqlPool().execute("DELETE FROM drivers WHERE id=?", [internalId]);
  }
  await mysqlTransact((s) => {
    s.operatorProfile.name = initial.operatorProfile.name;
    s.operatorProfile.phone = initial.operatorProfile.phone;
  });
  console.log(
    "MariaDB seed, query, CRUD, history and concurrent writes passed",
  );
}
main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => mysqlPool().end());
