import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createSeed } from "../src/lib/seed";
import {
  availableResources,
  assertAllocation,
  matchTrips,
} from "../src/lib/domain";
describe("Fleet allocation integrity", () => {
  it("counts exactly 142 API seed vehicles and the documented status distribution", () => {
    const s = createSeed();
    assert.equal(s.vehicles.length, 142);
    assert.deepEqual(
      ["moving", "idle", "service"].map(
        (status) => s.vehicles.filter((v) => v.status === status).length,
      ),
      [88, 32, 22],
    );
  });
  it("excludes service vehicles and assigned resources from new trips", () => {
    const s = createSeed();
    const resources = availableResources(s);
    assert.ok(resources.vehicles.every((v) => v.status !== "service"));
    assert.ok(!resources.vehicles.some((v) => v.id === "v1"));
    assert.ok(!resources.drivers.some((d) => d.id === "d1"));
    assert.throws(() => assertAllocation(s, "v121", "d1"));
  });
  it("rejects a second allocation of either an occupied vehicle or driver", () => {
    const s = createSeed();
    const { vehicles, drivers } = availableResources(s);
    assert.doesNotThrow(() =>
      assertAllocation(s, vehicles[0].id, drivers[0].id),
    );
    assert.throws(() => assertAllocation(s, vehicles[0].id, "d1"));
    assert.throws(() => assertAllocation(s, "v1", drivers[0].id));
  });
});
describe("ETLE timestamp matching", () => {
  it("normalizes plate whitespace and case and matches within the interval", () => {
    const s = createSeed();
    s.trips[0].startedAt = "2026-11-01T01:00:00Z";
    s.trips[0].completedAt = "2026-11-01T03:00:00Z";
    assert.deepEqual(matchTrips(s, "b9821kce", "2026-11-01T02:00:00Z"), [
      "trip-89",
    ]);
    assert.deepEqual(matchTrips(s, "B 9821 KCE", "2026-11-01T00:00:00Z"), []);
  });
  it("does not match unstarted or unknown vehicles", () => {
    const s = createSeed();
    assert.deepEqual(matchTrips(s, "X 0000 XXX", new Date().toISOString()), []);
    s.trips[0].startedAt = undefined;
    assert.deepEqual(matchTrips(s, "B 9821 KCE", new Date().toISOString()), []);
  });
  it("retains all candidates when assignment history is ambiguous", () => {
    const s = createSeed();
    s.trips[0].startedAt = "2026-11-01T01:00:00Z";
    s.trips[0].completedAt = "2026-11-01T03:00:00Z";
    s.trips.push({ ...s.trips[0], id: "ambiguous" });
    assert.equal(matchTrips(s, "B 9821 KCE", "2026-11-01T02:00:00Z").length, 2);
  });
  it("rejects malformed timestamps instead of treating them as no-match", () => {
    assert.throws(() => matchTrips(createSeed(), "B 9821 KCE", "invalid"));
  });
});

import { applyMobileEvent } from "../src/lib/mobile-events";
const proof =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aL1kAAAAASUVORK5CYII=";
describe("Mobile event and ledger integrity", () => {
  it("rejects writes against another driver assignment", () => {
    assert.throws(() =>
      applyMobileEvent(createSeed(), "d2", {
        type: "trip.started",
        tripId: "trip-89",
      }),
    );
  });
  it("requires arrival and complete evidence before delivery", () => {
    const s = createSeed();
    const t = s.trips[0];
    const stop = t.stops[2];
    assert.throws(() =>
      applyMobileEvent(s, "d1", {
        type: "epod.submitted",
        tripId: t.id,
        stopId: stop.id,
        recipient: "Penerima",
        photo: proof,
        signature: proof,
      }),
    );
    applyMobileEvent(s, "d1", {
      type: "stop.arrived",
      tripId: t.id,
      stopId: stop.id,
    });
    assert.throws(() =>
      applyMobileEvent(s, "d1", {
        type: "epod.submitted",
        tripId: t.id,
        stopId: stop.id,
        recipient: "Penerima",
      }),
    );
  });
  it("preserves every stop proof, completes only the final delivery, creates one capped ledger entry on retries", () => {
    const s = createSeed();
    const t = s.trips[0];
    for (const [i, stop] of t.stops.entries()) {
      if (stop.status === "delivered") continue;
      applyMobileEvent(s, "d1", {
        type: "stop.arrived",
        tripId: t.id,
        stopId: stop.id,
      });
      const event = {
        type: "epod.submitted" as const,
        tripId: t.id,
        stopId: stop.id,
        recipient: `Penerima ${i}`,
        photo: proof,
        signature: proof,
      };
      applyMobileEvent(s, "d1", event);
      applyMobileEvent(s, "d1", event);
      if (i < t.stops.length - 1) assert.equal(t.status, "in_progress");
    }
    assert.equal(t.status, "completed");
    assert.equal(s.ledger.filter((l) => l.tripId === t.id).length, 1);
    assert.equal(s.ledger[0].amount, 45000);
    assert.equal(t.stops.filter((p) => p.epod).length, 3);
    assert.equal(s.vehicles[0].status, "idle");
  });
  it("does not complete a failed drop-off, and permits retry after re-arrival", () => {
    const s = createSeed();
    const t = s.trips[0];
    const stop = t.stops[2];
    applyMobileEvent(s, "d1", {
      type: "stop.arrived",
      tripId: t.id,
      stopId: stop.id,
    });
    applyMobileEvent(s, "d1", {
      type: "stop.failed",
      tripId: t.id,
      stopId: stop.id,
      reason: "Penerima tidak di tempat",
    });
    assert.equal(t.status, "in_progress");
    assert.equal(stop.status, "failed_attempt");
    assert.equal(s.ledger.length, 0);
    applyMobileEvent(s, "d1", {
      type: "stop.arrived",
      tripId: t.id,
      stopId: stop.id,
    });
    assert.equal(stop.status, "arrived");
  });
  it("deduplicates SOS retries by driver and event key", () => {
    const s = createSeed();
    const e = {
      type: "sos.sent" as const,
      tripId: "trip-89",
      key: "test-unique",
      reason: "Demo bantuan",
    };
    applyMobileEvent(s, "d1", e);
    applyMobileEvent(s, "d1", e);
    assert.equal(s.notices.filter((n) => n.kind === "sos").length, 1);
  });
});
