import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createSeed } from "../src/lib/seed";
import { changeMaster } from "../src/lib/master-data";
import { availableResources } from "../src/lib/domain";
const values = {
  plate: "D 1234 QA",
  model: "Gran Max QA",
  status: "idle",
  driverId: "",
  fuel: 50,
  brake: 80,
  health: 90,
  odometer: 1000,
  locationIndex: 0,
};
describe("Master data CRUD integrity", () => {
  it("creates once on retry, edits with version check, archives and restores a vehicle", () => {
    const s = createSeed();
    const req = {
      action: "master-save" as const,
      kind: "vehicles" as const,
      key: "unique-key",
      values,
    };
    const first = changeMaster(s, req);
    assert.equal(changeMaster(s, req).id, first.id);
    assert.equal(s.vehicles.filter((v) => v.id === first.id).length, 1);
    const v = s.vehicles.find((v) => v.id === first.id)!;
    changeMaster(s, {
      ...req,
      id: v.id,
      version: v.version,
      values: { ...values, model: "Edited" },
    });
    assert.equal(v.model, "Edited");
    assert.throws(() => changeMaster(s, { ...req, id: v.id, version: 1 }));
    changeMaster(s, {
      action: "master-archive",
      kind: "vehicles",
      id: v.id,
      version: v.version,
    });
    assert.ok(v.archivedAt);
    assert.ok(!availableResources(s).vehicles.some((x) => x.id === v.id));
    changeMaster(s, {
      action: "master-restore",
      kind: "vehicles",
      id: v.id,
      version: v.version,
    });
    assert.equal(v.archivedAt, undefined);
  });
  it("rejects duplicate plates regardless of spacing and casing, invalid percentages and unsafe service status", () => {
    const s = createSeed();
    changeMaster(s, {
      action: "master-save",
      kind: "vehicles",
      key: "first",
      values,
    });
    for (const payload of [
      { ...values, plate: "d1234qa" },
      { ...values, plate: "D 9876 QA", fuel: 101 },
      { ...values, plate: "D 9876 QA", brake: 20 },
    ])
      assert.throws(() =>
        changeMaster(s, {
          action: "master-save",
          kind: "vehicles",
          key: crypto.randomUUID(),
          values: payload,
        }),
      );
  });
  it("blocks changes during an active trip and archiving RTO or referenced drivers", () => {
    const s = createSeed();
    assert.throws(() =>
      changeMaster(s, {
        action: "master-archive",
        kind: "vehicles",
        id: "v1",
        version: 0,
      }),
    );
    assert.throws(() =>
      changeMaster(s, {
        action: "master-archive",
        kind: "drivers",
        id: "d89",
        version: 0,
      }),
    );
    s.vehicles[0].driverId = "";
    s.trips = s.trips.filter((t) => t.driverId !== "d1");
    assert.throws(() =>
      changeMaster(s, {
        action: "master-archive",
        kind: "drivers",
        id: "d1",
        version: 0,
      }),
    );
  });
  it("validates driver input and preserves identity and history on archive", () => {
    const s = createSeed();
    const { id } = changeMaster(s, {
      action: "master-save",
      kind: "drivers",
      key: "driver-key",
      values: { name: "QA Driver", phone: "+628123456789", score: 94 },
    });
    const d = s.drivers.find((d) => d.id === id)!;
    assert.equal(d.score, 94);
    assert.throws(() =>
      changeMaster(s, {
        action: "master-save",
        kind: "drivers",
        id,
        version: d.version,
        values: { name: "", phone: "", score: 101 },
      }),
    );
    changeMaster(s, {
      action: "master-archive",
      kind: "drivers",
      id,
      version: d.version,
    });
    assert.ok(s.drivers.find((d) => d.id === id)?.archivedAt);
    assert.ok(!availableResources(s).drivers.some((d) => d.id === id));
  });
});
