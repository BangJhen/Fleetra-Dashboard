import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createSeed } from "../src/lib/seed";
import { updateOperatorProfile } from "../src/lib/operator-profile";
describe("Operator profile editing", () => {
  it("validates and persists contact information without changing access roles", () => {
    const s = createSeed();
    updateOperatorProfile(s, {
      name: " Nadia Pratama ",
      email: "nadia@example.com",
      phone: "+628123456789",
      version: 0,
      role: "other",
    });
    assert.equal(s.operatorProfile.name, "Nadia Pratama");
    assert.equal(s.operatorProfile.version, 1);
    assert.equal(s.operatorProfile.email, "nadia@example.com");
    assert.equal("role" in s.operatorProfile, false);
    assert.equal(
      JSON.parse(JSON.stringify(s)).operatorProfile.phone,
      "+628123456789",
    );
  });
  it("rejects stale changes, blank names, malformed emails and invalid phone numbers", () => {
    for (const changes of [
      { name: " " },
      { email: "invalid-email" },
      { phone: "abc" },
      { version: 12 },
    ]) {
      const s = createSeed();
      assert.throws(() =>
        updateOperatorProfile(s, {
          name: "Operator",
          email: "operator@example.com",
          phone: "",
          version: 0,
          ...changes,
        }),
      );
      assert.equal(s.operatorProfile.version, 0);
    }
  });
});
