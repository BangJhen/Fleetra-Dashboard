import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createSeed } from "../src/lib/seed";
import {
  captureSafety,
  recordSafety,
  historyFor,
} from "../src/lib/safety-history";
import { availableResources } from "../src/lib/domain";
describe("Safety history consistency", () => {
  it("starts with current baselines, never backfills fictitious dates and does not duplicate reads", () => {
    const s = createSeed();
    const now = new Date().toISOString();
    captureSafety(s, "baseline", "", now);
    assert.equal(s.safetyHistory.length, 284);
    assert.ok(
      s.safetyHistory.every((h) => h.at === now && h.source === "baseline"),
    );
    assert.equal(captureSafety(s), false);
    assert.equal(s.safetyHistory.length, 284);
  });
  it("retains historical values on master changes and appends only changed entities", () => {
    const s = createSeed();
    const t0 = new Date(Date.now() - 1000).toISOString();
    captureSafety(s, "baseline", "", t0);
    const old = s.vehicles[0].health;
    s.vehicles[0].health = 82;
    captureSafety(s);
    const h = historyFor(s, "vehicles", "v1");
    assert.equal(h.length, 2);
    assert.equal(h[0].values.health, old);
    assert.equal(h[1].values.health, 82);
    assert.equal(captureSafety(s), false);
  });
  it("records inspection once on retries, protects stale edits and blocks unsafe allocation", () => {
    const s = createSeed();
    captureSafety(s);
    const v = s.vehicles[88];
    const request = {
      kind: "vehicles",
      id: v.id,
      version: 0,
      key: "inspection-1",
      note: "Pemeriksaan rem simulasi",
      values: { health: 65, brake: 22, fuel: 40, odometer: v.odometer + 10 },
    };
    const result = recordSafety(s, request);
    assert.deepEqual(recordSafety(s, request), result);
    assert.equal(v.status, "service");
    assert.ok(!availableResources(s).vehicles.some((a) => a.id === v.id));
    assert.equal(historyFor(s, "vehicles", v.id).length, 2);
    assert.equal(captureSafety(s), false);
    assert.throws(() => recordSafety(s, { ...request, key: "stale" }));
  });
  it("rejects odometer rollback and invalid cumulative incident counts", () => {
    const s = createSeed();
    captureSafety(s);
    const v = s.vehicles[0],
      d = s.drivers[0];
    assert.throws(() =>
      recordSafety(s, {
        kind: "vehicles",
        id: v.id,
        version: 0,
        key: "x",
        note: "Bad",
        values: { health: 90, brake: 80, fuel: 60, odometer: v.odometer - 1 },
      }),
    );
    assert.throws(() =>
      recordSafety(s, {
        kind: "drivers",
        id: d.id,
        version: 0,
        key: "y",
        note: "Bad",
        values: { score: 95, braking: -1, speeding: 0 },
      }),
    );
  });
  it("preserves driver events and filters history by entity and selected period", () => {
    const s = createSeed();
    captureSafety(
      s,
      "baseline",
      "",
      new Date(Date.now() - 40 * 86400000).toISOString(),
    );
    recordSafety(s, {
      kind: "drivers",
      id: "d1",
      version: 0,
      key: "driver-1",
      note: "Evaluasi simulasi",
      values: { score: 96, braking: 2, speeding: 1 },
    });
    assert.equal(historyFor(s, "drivers", "d1", 30).length, 1);
    assert.equal(historyFor(s, "drivers", "d1", 90).length, 2);
    assert.equal(historyFor(s, "drivers", "d2", 30).length, 0);
  });
});
