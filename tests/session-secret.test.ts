import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { sessionSecret } from "../src/lib/session-secret";

describe("Local session signing key", () => {
  it("survives module reloads and server restarts without sharing another workspace key", () => {
    const first = mkdtempSync(path.join(os.tmpdir(), "fleetra-session-a-"));
    const second = mkdtempSync(path.join(os.tmpdir(), "fleetra-session-b-"));
    try {
      const key = sessionSecret(first, "");
      assert.match(key, /^[a-f0-9]{64}$/);
      assert.equal(sessionSecret(first, ""), key);
      assert.notEqual(sessionSecret(second, ""), key);
      assert.equal(readFileSync(path.join(first, "session-secret"), "utf8"), key);
      assert.equal(statSync(path.join(first, "session-secret")).mode & 0o777, 0o600);
      assert.equal(sessionSecret(first, "configured-secret"), "configured-secret");
      writeFileSync(path.join(first, "session-secret"), "invalid");
      assert.throws(() => sessionSecret(first, ""), /tidak valid/);
    } finally {
      rmSync(first, { recursive: true, force: true });
      rmSync(second, { recursive: true, force: true });
    }
  });
});
