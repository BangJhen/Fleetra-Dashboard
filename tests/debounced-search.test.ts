import { describe, it } from "node:test";
import assert from "node:assert/strict";

describe("Search debouncing and trigger integrity", () => {
  it("delays query execution until the debounce window expires", async () => {
    let triggered = 0;
    let queryValue = "";
    const delay = 50;

    let timer: NodeJS.Timeout | null = null;
    const triggerSearch = (q: string) => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        triggered++;
        queryValue = q;
      }, delay);
    };

    // User types quickly: "B", "B ", "B 9", "B 98", "B 9821 KCE"
    triggerSearch("B");
    triggerSearch("B ");
    triggerSearch("B 9");
    triggerSearch("B 98");
    triggerSearch("B 9821 KCE");

    // Before delay expires: query has not run
    assert.equal(triggered, 0);

    // Wait past the debounce delay
    await new Promise((resolve) => setTimeout(resolve, delay + 25));

    // Exactly 1 query was executed with the final value
    assert.equal(triggered, 1);
    assert.equal(queryValue, "B 9821 KCE");
  });

  it("bypasses debounce window immediately on Enter key", () => {
    let triggered = 0;
    let queryValue = "";
    const delay = 500;

    let timer: NodeJS.Timeout | null = null;
    const triggerSearch = (q: string) => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        triggered++;
        queryValue = q;
      }, delay);
    };

    const handleEnter = (q: string) => {
      if (timer) clearTimeout(timer);
      triggered++;
      queryValue = q;
    };

    triggerSearch("Hino Bus");
    assert.equal(triggered, 0);

    // Press Enter immediately
    handleEnter("Hino Bus");
    assert.equal(triggered, 1);
    assert.equal(queryValue, "Hino Bus");
  });

  it("instantly clears query and cancels pending debounced search", async () => {
    let triggered = 0;
    let queryValue = "initial";
    const delay = 50;

    let timer: NodeJS.Timeout | null = null;
    const triggerSearch = (q: string) => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        triggered++;
        queryValue = q;
      }, delay);
    };

    const clear = () => {
      if (timer) clearTimeout(timer);
      queryValue = "";
    };

    triggerSearch("test query");
    clear();

    await new Promise((resolve) => setTimeout(resolve, delay + 25));

    assert.equal(queryValue, "");
    assert.equal(triggered, 0);
  });
});
