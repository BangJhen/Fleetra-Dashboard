import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { calculateRoadRoute, validateRouteGeometry } from "../src/lib/road-route";

describe("Saved road route geometry", () => {
  it("keeps valid geometry unchanged and permits manual trips without geometry", () => {
    const geometry = [[-6.9, 107.6], [-6.91, 107.61]];
    assert.deepEqual(validateRouteGeometry(geometry), geometry);
    assert.equal(validateRouteGeometry(undefined), undefined);
  });
  it("rejects incomplete, out of range and oversized geometry before persistence", () => {
    for (const geometry of [[], [[-6, 107]], [[91, 0], [0, 0]], [[0, 181], [0, 0]], [[0, NaN], [0, 0]], [["-6", 107], [0, 0]], Array(50001).fill([0, 0])]) {
      assert.throws(() => validateRouteGeometry(geometry), /Geometri rute/);
    }
  });
  it("reconstructs legacy road geometry in saved stop order and converts OSRM longitude latitude", async context => {
    context.mock.method(globalThis, "fetch", async (input: string) => {
      const url = new URL(input);
      assert.equal(url.pathname, "/route/v1/driving/107.6,-6.9;107.61,-6.91");
      return new Response(JSON.stringify({ code: "Ok", routes: [{ geometry: { coordinates: [[107.6, -6.9], [107.605, -6.905], [107.61, -6.91]] } }] }), { status: 200 });
    });
    assert.deepEqual(await calculateRoadRoute([{ lat: -6.9, lng: 107.6 }, { lat: -6.91, lng: 107.61 }]), [[-6.9, 107.6], [-6.905, 107.605], [-6.91, 107.61]]);
  });
});
