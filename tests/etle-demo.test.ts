import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createSeed } from "../src/lib/seed";
import { ensureDemoEtle } from "../src/lib/etle-demo";
import { matchTrips } from "../src/lib/domain";

describe("ETLE example cases", () => {
  it("matches actual seeded trips and does not duplicate cases during migration", () => {
    const state = createSeed();
    assert.equal(state.etle.length, 3);
    for (const record of state.etle) {
      assert.equal(record.source, "simulasi");
      assert.equal(record.status, "candidate_match");
      assert.equal(record.candidates.length, 1);
      assert.deepEqual(matchTrips(state, record.plate, record.at), record.candidates);
      assert.ok(record.location.includes("Bandung") || record.location.includes("Antapani"));
    }
    state.etle.unshift({ id: "operator-case", reference: "OPERATOR 001", plate: "D 0000 XYZ", at: new Date().toISOString(), location: "Jalan Asia Afrika", candidates: [], status: "disputed", source: "operator" });
    assert.equal(ensureDemoEtle(state), false);
    assert.equal(state.etle.length, 4);
    state.etle = state.etle.filter((record) => record.id !== "demo-etle-1");
    assert.equal(ensureDemoEtle(state), true);
    assert.equal(state.etle.length, 4);
    assert.equal(state.etle[0].status, "disputed");
  });
});
