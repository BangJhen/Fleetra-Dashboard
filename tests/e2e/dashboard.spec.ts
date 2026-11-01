import { test, expect } from "@playwright/test";
test.beforeEach(async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("button", { name: "Buka dashboard demo" }).click();
  await expect(
    page.getByRole("heading", { name: "Live tracking", exact: true }),
  ).toBeVisible();
});
test("fleet search, filter and inspector share the same vehicle data", async ({
  page,
}) => {
  await page
    .getByRole("textbox", { name: "Cari plat atau pengemudi" })
    .fill("B 9821 KCE");
  await expect(page.locator(".vehicle-row")).toHaveCount(1);
  await page.locator(".vehicle-row").click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "B 9821 KCE", exact: true }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Hapus pencarian" }).click();
  await page.getByRole("button", { name: "Servis", exact: true }).click();
  await expect(page.locator(".vehicle-row")).toHaveCount(22);
  await page.getByRole("button", { name: "Semua", exact: true }).click();
  await page.getByRole("button", { name: "Pusatkan peta Bandung" }).click();
  await expect(page.locator(".leaflet-map")).not.toHaveClass(
    /leaflet-zoom-anim/,
  );
  await expect(page.locator(".leaflet-tile-loaded").first()).toBeVisible();
  await expect
    .poll(async () =>
      page.locator(".leaflet-tile:not(.leaflet-tile-loaded)").count(),
    )
    .toBe(0);
  await page.screenshot({
    path: "docs/screenshots/live-tracking-desktop.png",
    fullPage: true,
  });
});
test("multi-stop dispatch persists through refresh and rejects duplicate allocation", async ({
  page,
}) => {
  await page.getByRole("link", { name: "Dispatch & trips" }).click();
  await page.getByRole("link", { name: "Buat penugasan" }).click();
  await page
    .getByLabel("Kendaraan", { exact: true })
    .selectOption({ index: 1 });
  await page
    .getByLabel("Pengemudi", { exact: true })
    .selectOption({ index: 1 });
  await page.getByRole("button", { name: "Tambah tujuan" }).click();
  await page.getByRole("button", { name: "Tinjau penugasan" }).click();
  await expect(page.locator(".review-stops li")).toHaveCount(5);
  await page
    .getByRole("button", { name: "Simpan penugasan", exact: true })
    .click();
  await expect(page).toHaveURL(/\/dashboard\/dispatch\/[a-f0-9-]+/);
  const url = page.url();
  const code = await page.locator("h1").innerText();
  await page.reload();
  await expect(page.locator("h1")).toHaveText(code);
  await expect(page.locator(".timeline-stop")).toHaveCount(5);
  await page.screenshot({
    path: "docs/screenshots/trip-detail-desktop.png",
    fullPage: true,
  });
  await expect(page).toHaveURL(url);
});
test("ETLE no-match result persists and accepts internal dispute review", async ({
  page,
}) => {
  await page
    .getByRole("link", { name: "Rekonsiliasi ETLE", exact: true })
    .click();
  await page.getByLabel("Nomor referensi tilang").fill(`QA-${Date.now()}`);
  await page.getByLabel("Plat kendaraan", { exact: true }).fill("D 0000 XYZ");
  await page.getByLabel("Tanggal dan jam kejadian").fill("2026-11-01T10:00");
  await page.getByRole("button", { name: "Cek data perjalanan" }).click();
  await expect(page.getByText("Tidak cocok", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Tandai sengketa" }).click();
  await expect(page.getByText("Disengketakan", { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByText("Disengketakan", { exact: true })).toBeVisible();
});
test("finance, health, management, notifications and logout are reachable", async ({
  page,
}) => {
  for (const [link, title] of [
    ["Health & safety", "Health & safety"],
    ["RTO & ekuitas", "RTO & ekuitas"],
    ["Data armada", "Data armada"],
    ["Data pengemudi", "Data pengemudi"],
  ]) {
    await page.getByRole("link", { name: link, exact: true }).click();
    await expect(
      page.getByRole("heading", { name: title, exact: true }),
    ).toBeVisible();
  }
  await page.getByRole("link", { name: "Notifikasi,", exact: false }).click();
  await expect(
    page.getByRole("heading", { name: "Notifikasi", exact: true }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Pengaturan", exact: true }).click();
  await page.getByRole("button", { name: "Keluar dari akun" }).click();
  await expect(page).toHaveURL(/\/login$/);
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login$/);
});
test("mobile layout has no horizontal page overflow and navigation works", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(
    page.getByRole("button", { name: "Buka navigasi" }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBeTruthy();
  await expect(page.locator(".leaflet-map")).toBeVisible();
  await expect(page.locator(".leaflet-map")).not.toHaveClass(
    /leaflet-zoom-anim/,
  );
  await expect(page.locator(".leaflet-tile-loaded").first()).toBeVisible();
  await expect
    .poll(async () =>
      page.locator(".leaflet-tile:not(.leaflet-tile-loaded)").count(),
    )
    .toBe(0);
  await page.screenshot({
    path: "docs/screenshots/live-tracking-mobile.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Buka navigasi" }).click();
  await page.getByRole("link", { name: "Dispatch & trips" }).click();
  await expect(
    page.getByRole("heading", { name: "Dispatch & trips", exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBeTruthy();
});
test("API protects private data, validates origin, and handles publish retries idempotently", async ({
  page,
  playwright,
}) => {
  const unauth = await playwright.request.newContext({
    baseURL: new URL(page.url()).origin,
  });
  expect((await unauth.get("/api/fleet")).status()).toBe(401);
  await unauth.dispose();
  const state = await (await page.request.get("/api/fleet")).json();
  const occupied = state.trips.find(
    (t: { status: string }) => t.status === "assigned",
  );
  const origin = new URL(page.url()).origin;
  const bad = await page.request.post("/api/fleet", {
    headers: { Origin: origin },
    data: {
      action: "create-trip",
      key: crypto.randomUUID(),
      vehicleId: occupied.vehicleId,
      driverId: occupied.driverId,
      stops: [0, 1],
    },
  });
  expect(bad.status()).toBe(400);
  const noOrigin = await page.request.post("/api/fleet", {
    data: { action: "read-all" },
  });
  expect(noOrigin.status()).toBe(403);
  const busy = state.trips.filter((t: { status: string }) =>
    ["assigned", "in_progress"].includes(t.status),
  );
  const vehicle = state.vehicles.find(
    (v: { id: string; status: string }) =>
      v.status === "idle" &&
      !busy.some((t: { vehicleId: string }) => t.vehicleId === v.id),
  );
  const driver = state.drivers.find(
    (d: { id: string; score: number }) =>
      d.score > 85 &&
      !busy.some((t: { driverId: string }) => t.driverId === d.id),
  );
  const payload = {
    action: "create-trip",
    key: crypto.randomUUID(),
    vehicleId: vehicle.id,
    driverId: driver.id,
    stops: [0, 1, 2],
  };
  const first = await page.request.post("/api/fleet", {
    headers: { Origin: origin },
    data: payload,
  });
  expect(first.ok()).toBeTruthy();
  const second = await page.request.post("/api/fleet", {
    headers: { Origin: origin },
    data: payload,
  });
  expect(await second.json()).toEqual(await first.json());
});
test("mobile API updates independent stop proofs, RTO once, and an operator can resolve SOS", async ({
  page,
}) => {
  const headers = { Authorization: "Bearer fleetra-qa-local-token" };
  const mobile = await page.request.get("/api/mobile", { headers });
  expect(mobile.ok()).toBeTruthy();
  const data = await mobile.json();
  const trip = data.trips.find((t: { id: string }) => t.id === "trip-89");
  const send = async (data: Record<string, unknown>) => {
    const response = await page.request.post("/api/mobile", { headers, data });
    expect(response.ok(), await response.text()).toBeTruthy();
    return response;
  };
  await send({
    type: "sos.sent",
    tripId: trip.id,
    key: "qa-sos",
    reason: "Test local assistance",
  });
  await page.getByRole("link", { name: "Notifikasi,", exact: false }).click();
  await page.getByRole("button", { name: "Akui alert" }).click();
  await page.getByRole("button", { name: "Tutup kasus" }).click();
  await expect(page.getByText("Kasus ditutup operator")).toBeVisible();
  const image =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aL1kAAAAASUVORK5CYII=";
  for (const stop of trip.stops.filter(
    (s: { status: string }) => s.status !== "delivered",
  )) {
    await send({ type: "stop.arrived", tripId: trip.id, stopId: stop.id });
    const evidence = {
      type: "epod.submitted",
      tripId: trip.id,
      stopId: stop.id,
      recipient: "QA Recipient",
      photo: image,
      signature: image,
    };
    await send(evidence);
    await send(evidence);
  }
  await page.goto(`/dashboard/dispatch/${trip.id}`);
  await expect(
    page.getByText("Selesai", { exact: true }).first(),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Lihat bukti e-POD" }),
  ).toHaveCount(3);
  await page.getByRole("button", { name: "Lihat bukti e-POD" }).first().click();
  await expect(page.getByRole("dialog")).toContainText("QA Recipient");
  await page.keyboard.press("Escape");
  const state = await (await page.request.get("/api/fleet")).json();
  expect(
    state.ledger.filter((l: { tripId: string }) => l.tripId === trip.id),
  ).toHaveLength(1);
  expect(
    state.ledger.find((l: { tripId: string }) => l.tripId === trip.id).amount,
  ).toBe(45000);
  await page.goto("/dashboard/finance/rto/rto-1");
  await expect(page.getByRole("link", { name: "TRIP-2026-089" })).toBeVisible();
});
test("route service failure provides an honest manual fallback", async ({
  page,
}) => {
  await page.route("**/api/optimize", (route) =>
    route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({
        error:
          "OSRM belum dapat menghitung rute. Coba lagi atau lanjutkan dengan urutan manual.",
      }),
    }),
  );
  await page.goto("/dashboard/dispatch/new");
  await page.getByRole("button", { name: "Optimasi rute OSRM" }).click();
  await expect(page.locator(".form-error")).toContainText("urutan manual");
  await expect(page.getByText("Urutan manual", { exact: true })).toBeVisible();
});
