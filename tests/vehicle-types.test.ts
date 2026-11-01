import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createSeed } from "../src/lib/seed";
import { migrateVehicleTypes, vehicleTypes } from "../src/lib/vehicle-types";
import { changeMaster } from "../src/lib/master-data";

describe("Vehicle categories and legacy data", () => {
  it("includes every supported category in the demo fleet", () => {
    assert.deepEqual(new Set(createSeed().vehicles.map(v => v.type)), new Set(vehicleTypes));
  });
  it("upgrades untouched demo models once, preserving operator models and operational data", () => {
    const s = createSeed();
    for (const [i, v] of s.vehicles.entries()) {
      delete (v as Partial<typeof v>).type;
      v.model = ["Daihatsu Gran Max", "Suzuki Carry", "Mitsubishi L300"][i % 3];
    }
    const custom = s.vehicles[5];
    custom.model = "Honda Vario Operator";
    custom.version = 2;
    const edited = s.vehicles[6];
    edited.model = "Daihatsu Gran Max";
    edited.version = 4;
    const before = s.vehicles.map(({ id, plate, fuel, odometer, status }) => ({ id, plate, fuel, odometer, status }));
    assert.equal(migrateVehicleTypes(s.vehicles), true);
    assert.equal(custom.model, "Honda Vario Operator");
    assert.equal(custom.type, "motorcycle");
    assert.equal(edited.model, "Daihatsu Gran Max");
    assert.equal(edited.type, "van");
    assert.deepEqual(s.vehicles.map(({ id, plate, fuel, odometer, status }) => ({ id, plate, fuel, odometer, status })), before);
    assert.equal(migrateVehicleTypes(s.vehicles), false);
  });
  it("persists the chosen category and rejects unknown types before modifying a record", () => {
    const s = createSeed();
    const values = { plate: "D 9998 QA", model: "Honda Vario", type: "motorcycle", status: "idle", driverId: "", fuel: 50, brake: 90, health: 95, odometer: 120, locationIndex: 0 };
    const result = changeMaster(s, { action: "master-save", kind: "vehicles", key: "vehicle-kind", values });
    const v = s.vehicles.find(v => v.id === result.id)!;
    assert.equal(v.type, "motorcycle");
    assert.throws(() => changeMaster(s, { action: "master-save", kind: "vehicles", id: v.id, version: v.version, values: { ...values, type: "unknown" } }), /jenis kendaraan/);
    assert.equal(v.type, "motorcycle");
    changeMaster(s, { action: "master-save", kind: "vehicles", id: v.id, version: v.version, values: { ...values, type: "truck", model: "Isuzu Elf" } });
    assert.equal(v.type, "truck");
  });
});
