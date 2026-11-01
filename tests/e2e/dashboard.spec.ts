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
  await expect(page.locator('.leaflet-map[data-basemap-ready="true"]')).toBeVisible({ timeout: 20000 });
  await expect(page.locator(".map-legend, .map-region-label, .map-layer-button")).toHaveCount(0);
  await expect(page.locator(".leaflet-tile-pane")).toHaveCSS("filter", "none");
  await expect(page.locator('.leaflet-control-attribution a').filter({ hasText: /^Leaflet$/ })).toHaveCount(0);
  const sources = page.locator(".map-source-control");
  if (await sources.getAttribute("open") === null) await sources.locator("summary").click();
  await expect(sources.getByRole("link", { name: "© OpenStreetMap contributors", exact: true })).toBeVisible();
  // Allow Leaflet's zoom transition to settle before capturing the visual artifact.
  await page.waitForTimeout(1000);
  await page.screenshot({
    path: "docs/screenshots/live-tracking-desktop.png",
    fullPage: true,
  });
});
test("multi-stop dispatch persists through refresh and rejects duplicate allocation", async ({
  page,
}) => {
  await page.getByRole("navigation", { name: "Navigasi utama" }).getByRole("link", { name: "Penugasan" }).click();
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
test("ETLE example cases show credible trip evidence and remain reviewable", async ({ page }) => {
  await page.getByRole("link", { name: "Rekonsiliasi ETLE", exact: true }).click();
  const example = page.locator(".etle-cases tbody tr").filter({ hasText: "BDG ETLE 2026 001" });
  await expect(example).toBeVisible();
  expect(await page.locator(".etle-cases tbody tr").count()).toBeGreaterThanOrEqual(3);
  await expect(example).toContainText("B 9821 KCE");
  await expect(example).toContainText("Jalan Pasirkaliki, Bandung");
  await expect(example).toContainText("1 kandidat perjalanan");
  await page.screenshot({ path: "docs/screenshots/etle-desktop.png", fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(example.getByText("Kandidat ditemukan")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
  await page.screenshot({ path: "docs/screenshots/etle-mobile.png", fullPage: true });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await example.getByRole("link", { name: "BDG ETLE 2026 001", exact: true }).click();
  await expect(page.getByText("Contoh simulasi FLEETRA")).toBeVisible();
  await expect(page.locator(".etle-candidate")).toContainText("TRIP-2026-089");
  await page.getByRole("button", { name: "Konfirmasi internal" }).click();
  await expect(page.getByText("Dikonfirmasi internal", { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByText("Dikonfirmasi internal", { exact: true })).toBeVisible();
});
test("finance, health, management, notifications and logout are reachable", async ({
  page,
}) => {
  for (const [link, title] of [
    ["Keselamatan armada", "Keselamatan armada"],
    ["Ekuitas RTO", "Ekuitas RTO"],
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
  await page.getByRole("link", { name: "Buka profil", exact: true }).click();
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
  await expect(page.locator('.leaflet-map[data-basemap-ready="true"]')).toBeVisible({ timeout: 20000 });
  await expect(page.locator(".map-legend, .map-region-label, .map-layer-button")).toHaveCount(0);
  await expect(page.locator(".leaflet-tile-pane")).toHaveCSS("filter", "none");
  await expect(page.locator('.leaflet-control-attribution a').filter({ hasText: /^Leaflet$/ })).toHaveCount(0);
  const sources = page.locator(".map-source-control");
  if (await sources.getAttribute("open") === null) await sources.locator("summary").click();
  await expect(sources.getByRole("link", { name: "© OpenStreetMap contributors", exact: true })).toBeVisible();
  await page.screenshot({
    path: "docs/screenshots/live-tracking-mobile.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Buka navigasi" }).click();
  await page.getByRole("navigation", { name: "Navigasi utama" }).getByRole("link", { name: "Penugasan" }).click();
  await expect(
    page.getByRole("heading", { name: "Penugasan", exact: true }),
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
    page.getByRole("button", { name: "Lihat bukti ePOD" }),
  ).toHaveCount(3);
  await page.getByRole("button", { name: "Lihat bukti ePOD" }).first().click();
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

  await expect(page.locator(".form-error")).toContainText("urutan manual");
  await expect(page.getByText("Urutan manual", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Coba lagi OSRM", exact: true }).click();
  await expect(page.locator(".form-error")).toContainText("urutan manual");
});

test("master vehicles and drivers support create edit archive restore and refresh persistence", async ({
  page,
}) => {
  for (const kind of ["drivers", "vehicles"]) {
    await page.goto(`/dashboard/management/${kind}`);
    const vehicle = kind === "vehicles";
    if (vehicle) {
      await page.setViewportSize({ width: 390, height: 844 });
      await expect(page.locator(".management-list-toolbar")).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
      await page.screenshot({ path: "docs/screenshots/fleet-management-toolbar-mobile.png", fullPage: true });
      await page.setViewportSize({ width: 1440, height: 1000 });
    }
    const initial = vehicle ? "D 9876 QA" : `QA Driver ${Date.now()}`;
    const edited = vehicle ? "D 9876 QA" : initial + " Edited";
    await page
      .getByRole("button", {
        name: vehicle ? "Tambah armada" : "Tambah pengemudi",
        exact: true,
      })
      .click();
    if (vehicle) {
      await page.getByLabel("Plat kendaraan", { exact: true }).fill(initial);
      await page
        .getByLabel("Model kendaraan", { exact: true })
        .fill("Honda Vario QA");
      await page.getByLabel("Jenis kendaraan", { exact: true }).selectOption("motorcycle");
    } else {
      await page.getByLabel("Nama pengemudi", { exact: true }).fill(initial);
      await page
        .getByLabel("Skor keselamatan simulasi", { exact: true })
        .fill("94");
    }
    await page
      .getByRole("button", { name: "Simpan data", exact: true })
      .click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    const search = page.getByRole("textbox", {
      name: vehicle ? "Cari kendaraan" : "Cari nama pengemudi",
      exact: true,
    });
    await search.fill(initial);
    let row = page.getByRole("row").filter({ hasText: initial });
    await expect(row).toHaveCount(1);
    if (vehicle) {
      await expect(row).toContainText("Sepeda motor");
      await expect(row.locator(".vehicle-art-motorcycle")).toHaveCount(1);
    }
    await row.getByRole("button", { name: "Ubah", exact: true }).click();
    if (vehicle) {
      await expect(page.getByLabel("Jenis kendaraan", { exact: true })).toHaveValue("motorcycle");
      await page.getByLabel("Jenis kendaraan", { exact: true }).selectOption("truck");
    }
    await page
      .getByLabel(vehicle ? "Model kendaraan" : "Nama pengemudi", {
        exact: true,
      })
      .fill(vehicle ? "Isuzu Elf QA Updated" : edited);
    await page
      .getByRole("button", { name: "Simpan data", exact: true })
      .click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await page.reload();
    await search.fill(edited);
    row = page.getByRole("row").filter({ hasText: edited });
    await expect(row).toHaveCount(1);
    if (vehicle) {
      await expect(row).toContainText("Isuzu Elf QA Updated");
      await expect(row).toContainText("Truk");
      await expect(row.locator(".vehicle-art-truck")).toHaveCount(1);
    }
    await row.getByRole("button", { name: "Arsipkan", exact: true }).click();
    await page
      .getByRole("button", { name: "Arsipkan data", exact: true })
      .click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(row).toHaveCount(0);
    await page
      .getByRole("button", { name: "Lihat arsip", exact: true })
      .click();
    await search.fill(edited);
    row = page.getByRole("row").filter({ hasText: edited });
    await expect(row).toHaveCount(1);
    await page.reload();
    await page
      .getByRole("button", { name: "Lihat arsip", exact: true })
      .click();
    await search.fill(edited);
    row = page.getByRole("row").filter({ hasText: edited });
    await row.getByRole("button", { name: "Pulihkan", exact: true }).click();
    await page
      .getByRole("button", { name: "Pulihkan data", exact: true })
      .click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await page
      .getByRole("button", { name: "Lihat data aktif", exact: true })
      .click();
    await search.fill(edited);
    await expect(page.getByRole("row").filter({ hasText: edited })).toHaveCount(
      1,
    );
  }
});

test("safety overview and detail charts preserve inspections and technical history after refresh", async ({
  page,
}) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.goto("/dashboard/safety");
  await page.waitForLoadState("networkidle");
  await expect(
    page.getByRole("heading", {
      name: "Distribusi indeks kondisi",
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.locator(".safety-chart")).toHaveCount(2);
  await expect(page.locator(".health-callout")).toHaveCount(0);
  const workingList = page.locator(".safety-working-list");
  await expect(workingList.locator("tbody tr")).toHaveCount(8);
  const firstPlate = await workingList.locator("tbody tr").first().locator("td strong").first().textContent();
  await workingList.getByRole("button", { name: "Berikutnya", exact: true }).click();
  await expect(workingList.locator("tbody tr").first().locator("td strong").first()).not.toHaveText(firstPlate!);
  await page.getByRole("textbox", { name: "Cari armada", exact: true }).fill(firstPlate!.trim().split(/\s+/).slice(0, 3).join(" "));
  await expect(workingList.getByText("Halaman 1 dari 1", { exact: true })).toBeVisible();
  await page.getByRole("textbox", { name: "Cari armada", exact: true }).fill("");
  await expect(page.locator(".safety-recent-history")).not.toHaveAttribute("open");
  await page.locator(".safety-recent-history summary").click();
  await expect(page.getByRole("heading", { name: "Pembaruan kondisi terbaru", exact: true })).toBeVisible();
  await page.locator(".safety-recent-history summary").click();
  await page.evaluate(() => { (document.activeElement as HTMLElement)?.blur(); window.scrollTo(0, 0); });
  await page.screenshot({
    path: "docs/screenshots/safety-overview-desktop.png", fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: "docs/screenshots/safety-overview-mobile.png", fullPage: true });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.getByRole("tab", { name: "Keselamatan pengemudi" }).click();
  await expect(
    page.getByRole("heading", {
      name: "Distribusi skor keselamatan",
      exact: true,
    }),
  ).toBeVisible();
  await expect(workingList.locator("tbody tr")).toHaveCount(8);
  await workingList.getByRole("button", { name: "Berikutnya", exact: true }).click();
  await expect(workingList.locator("tbody tr").first().locator("td").first()).toHaveText("9");
  await page.evaluate(() => { (document.activeElement as HTMLElement)?.blur(); window.scrollTo(0, 0); });
  await page.screenshot({ path: "docs/screenshots/safety-drivers-overview-desktop.png", fullPage: true });
  for (const kind of ["vehicles", "drivers"]) {
    await page.goto(
      `/dashboard/safety/${kind}/${kind === "vehicles" ? "v121" : "d1"}`,
    );
    await page.waitForLoadState("networkidle");
    await expect(page.locator(".safety-chart")).toHaveCount(2);
    await expect(
      page.getByRole("heading", {
        name:
          kind === "vehicles"
            ? "Informasi teknis kendaraan"
            : "Informasi teknis keselamatan",
        exact: true,
      }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Catat pemeriksaan", exact: true })
      .click();
    if (kind === "vehicles") {
      await page.getByLabel("Indeks kondisi", { exact: true }).fill("65");
      await page
        .getByLabel("Estimasi kampas rem persen", { exact: true })
        .fill("25");
      await page.getByLabel("Bahan bakar persen", { exact: true }).fill("55");
      const odo = page.getByLabel("Odometer km", { exact: true });
      await odo.fill(String(Number(await odo.inputValue()) + 10));
    } else {
      await page.getByLabel("Skor keselamatan", { exact: true }).fill("96");
    }
    const note = `Pemeriksaan QA ${kind} tersimpan`;
    await page.getByLabel("Catatan dan tindak lanjut").fill(note);
    await page
      .getByRole("button", { name: "Simpan pemeriksaan", exact: true })
      .click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(page.getByText(note, { exact: true })).toBeVisible();
    await page.reload();
    await expect(page.getByText(note, { exact: true })).toBeVisible();
    await page.waitForLoadState("networkidle");
    await page.getByLabel("Rentang waktu").selectOption("7");
    await expect(page.getByText(note, { exact: true })).toBeVisible();
    await page.screenshot({
      path: `docs/screenshots/safety-${kind}-desktop.png`,
      fullPage: true,
    });
    await page.setViewportSize({ width: 390, height: 844 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBeTruthy();
    await page.screenshot({
      path: `docs/screenshots/safety-${kind}-mobile.png`,
      fullPage: true,
    });
    await page.setViewportSize({ width: 1440, height: 1000 });
  }
  expect(pageErrors).toEqual([]);
});

test("profile replaces settings and edits persist across reload and login", async ({
  page,
}) => {
  await expect(
    page.getByRole("link", { name: "Pengaturan", exact: true }),
  ).toHaveCount(0);
  await page.goto("/dashboard/settings");
  await expect(page).toHaveURL(/\/dashboard\/profile$/);
  await expect(
    page.getByRole("heading", { name: "Profil", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Edit profil", exact: true }).click();
  await page.getByLabel("Nama lengkap", { exact: true }).fill("Nadia Pratama");
  await page
    .getByLabel("Email kontak", { exact: true })
    .fill("nadia@example.com");
  await page.getByLabel("Nomor telepon", { exact: true }).fill("+628123456789");
  await page
    .getByRole("button", { name: "Simpan profil", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.locator(".topbar-account-copy strong")).toHaveText(
    "Nadia Pratama",
  );
  await expect(page.locator(".profile-button strong")).toHaveText(
    "Nadia Pratama",
  );
  await expect(page.locator(".profile-button small")).toHaveText(
    "nadia@example.com",
  );
  await page.reload();
  await expect(page.locator(".settings-profile h3")).toHaveText(
    "Nadia Pratama",
  );
  await expect(page.getByText("+628123456789", { exact: true })).toBeVisible();
  await page.waitForLoadState("networkidle");
  await page.screenshot({
    path: "docs/screenshots/profile-desktop.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Edit profil", exact: true }).click();
  await page.getByLabel("Nama lengkap", { exact: true }).fill("Discarded");
  await page.getByRole("button", { name: "Batal", exact: true }).click();
  await expect(page.locator(".settings-profile h3")).toHaveText(
    "Nadia Pratama",
  );
  await page
    .getByRole("button", { name: "Keluar dari akun", exact: true })
    .click();
  await expect(page).toHaveURL(/\/login$/);
  await page
    .getByRole("button", { name: "Buka dashboard demo", exact: true })
    .click();
  await page.getByRole("link", { name: "Buka profil", exact: true }).click();
  await expect(page.locator(".settings-profile h3")).toHaveText(
    "Nadia Pratama",
  );
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
  await page.screenshot({
    path: "docs/screenshots/profile-mobile.png",
    fullPage: true,
  });
});

test("registration supports validation, private profiles, logout and credential login", async ({
  page,
  playwright,
}) => {
  const origin = new URL(page.url()).origin;
  await page.request.delete("/api/auth", { headers: { Origin: origin } });
  await page.goto("/login");
  await expect(page.locator(".auth-illustration img")).toBeVisible();
  await expect
    .poll(() =>
      page
        .locator(".auth-illustration img")
        .evaluate(
          (img: HTMLImageElement) => img.complete && img.naturalWidth > 0,
        ),
    )
    .toBeTruthy();
  await page.screenshot({
    path: "docs/screenshots/login-desktop.png",
    fullPage: true,
  });
  await page
    .getByRole("link", { name: "Daftar sekarang", exact: true })
    .click();
  await expect(page).toHaveURL(/\/register$/);
  await expect(
    page.getByRole("heading", { name: "Buat akun FLEETRA", exact: true }),
  ).toBeVisible();
  const email = `operator-${Date.now()}@example.com`;
  const password = "FleetraRegister2026!";
  await page.getByLabel("Nama lengkap", { exact: true }).fill("Raka Operator");
  await page.getByLabel("Email operator", { exact: true }).fill(email);
  await page.getByLabel("Kata sandi", { exact: true }).fill(password);
  await page
    .getByLabel("Konfirmasi kata sandi", { exact: true })
    .fill("DifferentPassword123!");
  await page.getByRole("button", { name: "Daftar akun", exact: true }).click();
  await expect(page.locator(".form-error")).toContainText(
    "Konfirmasi kata sandi tidak cocok",
  );
  await page
    .getByLabel("Konfirmasi kata sandi", { exact: true })
    .fill(password);
  await page.waitForLoadState("networkidle");
  await page.screenshot({
    path: "docs/screenshots/register-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
  await page.screenshot({
    path: "docs/screenshots/register-mobile.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.getByRole("button", { name: "Daftar akun", exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.locator(".topbar-account-copy strong")).toHaveText(
    "Raka Operator",
  );
  await expect(page.locator(".topbar-account-copy small")).toHaveText(
    "Akun operator",
  );
  const state = await (await page.request.get("/api/fleet")).json();
  expect(state.operatorProfile.email).toBe(email);
  expect(JSON.stringify(state)).not.toContain("passwordHash");
  await page.getByRole("link", { name: "Buka profil", exact: true }).click();
  await page.getByRole("button", { name: "Edit profil", exact: true }).click();
  await page.getByLabel("Nama lengkap", { exact: true }).fill("Raka Updated");
  await page
    .getByLabel("Email kontak", { exact: true })
    .fill("contact-raka@example.com");
  await page
    .getByRole("button", { name: "Simpan profil", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.reload();
  await expect(page.locator(".settings-profile h3")).toHaveText("Raka Updated");
  const other = await playwright.request.newContext({ baseURL: origin });
  const duplicate = await other.post("/api/register", {
    headers: { Origin: origin },
    data: {
      name: "Duplicate",
      email: email.toUpperCase(),
      password,
      confirmPassword: password,
    },
  });
  expect(duplicate.status()).toBe(400);
  expect((await duplicate.json()).error).toContain("sudah terdaftar");
  const invalid = await other.post("/api/register", {
    headers: { Origin: origin },
    data: {
      name: "Bad",
      email: "bad@example.com",
      password: "short",
      confirmPassword: "short",
    },
  });
  expect(invalid.status()).toBe(400);
  const noOrigin = await other.post("/api/register", { data: { name: "Bad" } });
  expect(noOrigin.status()).toBe(403);
  await other.post("/api/auth", {
    headers: { Origin: origin },
    data: { demo: true },
  });
  const demo = await (await other.get("/api/fleet")).json();
  expect(demo.operatorProfile.name).not.toBe("Raka Updated");
  await other.dispose();
  await page
    .getByRole("button", { name: "Keluar dari akun", exact: true })
    .click();
  await page.getByLabel("Email operator", { exact: true }).fill(email);
  await page
    .getByLabel("Kata sandi", { exact: true })
    .fill("WrongPassword2026!");
  await page
    .getByRole("button", { name: "Masuk ke workspace", exact: true })
    .click();
  await expect(page.locator(".form-error")).toContainText(
    "Email atau kata sandi tidak sesuai",
  );
  await page.getByLabel("Kata sandi", { exact: true }).fill(password);
  await page
    .getByRole("button", { name: "Masuk ke workspace", exact: true })
    .click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.locator(".topbar-account-copy strong")).toHaveText(
    "Raka Updated",
  );
  await page.getByRole("link", { name: "Buka profil", exact: true }).click();
  await expect(
    page.getByText("contact-raka@example.com", { exact: true }).first(),
  ).toBeVisible();
});


test("planner automatically optimizes initial, changed, added and removed stops with matching numbering", async ({ page }) => {
  const requests: number[][] = [];
  await page.route("**/api/optimize", async route => {
    const { stops } = route.request().postDataJSON() as { stops: number[] };
    requests.push(stops);
    const order = [stops[0], ...stops.slice(1, -1).reverse(), stops.at(-1)!];
    await new Promise(resolve => setTimeout(resolve, 700));
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({
      order, distance: stops.length * 3, duration: stops.length * 8, source: "OSRM",
      route: order.map(n => [-6.9 + n * .001, 107.6 + n * .001]),
    }) });
  });
  await page.goto("/dashboard/dispatch/new");
  await expect(page.locator(".planner-map .leaflet-map")).toBeVisible();
  await expect(page.locator(".planner-map .osrm-route")).toHaveCount(0);
  const ready = page.getByRole("status").filter({ hasText: "Rute diperbarui otomatis" });
  await expect(ready).toBeVisible();
  await expect(page.locator(".planner-map .osrm-route")).toBeVisible();
  expect(requests).toEqual([[0, 1, 2, 3]]);
  const connectorGap = await page.locator(".stop-field").first().evaluate(el => {
    const row = el.getBoundingClientRect();
    const lineBottom = parseFloat(getComputedStyle(el, "::after").bottom);
    const nextCircle = el.nextElementSibling!.querySelector(".stop-index")!.getBoundingClientRect();
    return Math.abs(row.bottom - lineBottom - nextCircle.top);
  });
  expect(connectorGap).toBeLessThanOrEqual(1);
  const order = () => page.locator(".stop-field select").evaluateAll(elements => elements.map(e => Number((e as HTMLSelectElement).value)));
  expect(await order()).toEqual([0, 2, 1, 3]);
  await page.getByLabel("Tujuan 1", { exact: true }).selectOption("4");
  await expect(page.locator(".planner-map .osrm-route")).toHaveCount(0);
  await expect(ready).toBeVisible();
  await expect(page.locator(".planner-map .osrm-route")).toBeVisible();
  expect(requests.at(-1)).toEqual([0, 4, 1, 3]);
  expect(await order()).toEqual([0, 1, 4, 3]);
  await page.getByRole("button", { name: "Tambah tujuan", exact: true }).click();
  await expect(ready).toBeVisible();
  expect(requests.at(-1)).toEqual([0, 1, 4, 3, 2]);
  await expect(page.locator(".stop-index")).toHaveText(["1", "2", "3", "4", "5"]);
  await page.getByRole("button", { name: "Hapus tujuan 3", exact: true }).click();
  await expect(ready).toBeVisible();
  expect(requests.at(-1)).toEqual([0, 3, 4, 2]);
  expect(await order()).toEqual([0, 4, 3, 2]);
  await expect(page.locator(".stop-index")).toHaveText(["1", "2", "3", "4"]);
  await expect(page.locator(".route-estimates")).toContainText("12.0 km");
  await page.getByLabel("Kendaraan", { exact: true }).selectOption({ index: 1 });
  await page.getByLabel("Pengemudi", { exact: true }).selectOption({ index: 1 });
  await page.getByRole("button", { name: "Tinjau penugasan", exact: true }).click();
  const names = await page.locator(".stop-field select").evaluateAll(elements => elements.map(e => (e as HTMLSelectElement).selectedOptions[0].textContent));
  await expect(page.locator(".review-stops li")).toHaveText(names as string[]);
  await page.getByRole("button", { name: "Simpan penugasan", exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard\/dispatch\/[a-f0-9-]+/);
  await expect(page.locator(".trip-map .osrm-route")).toBeVisible();
  const tripId = page.url().split("/").at(-1);
  const state = await (await page.request.get("/api/fleet")).json();
  const savedTrip = state.trips.find((trip: { id: string }) => trip.id === tripId);
  const geometry = [0, 4, 3, 2].map(n => [-6.9 + n * .001, 107.6 + n * .001]);
  expect(savedTrip.route).toEqual(geometry);
  expect(savedTrip.routeSource).toBe("OSRM");
  await page.reload();
  await expect(page.locator(".trip-map .osrm-route")).toBeVisible();
  const reloaded = await (await page.request.get("/api/fleet")).json();
  expect(reloaded.trips.find((trip: { id: string }) => trip.id === tripId).route).toEqual(geometry);
});

test("planner ignores older optimization when stops change during a request", async ({ page }) => {
  let calls = 0;
  await page.route("**/api/optimize", async route => {
    const index = ++calls;
    const { stops } = route.request().postDataJSON();
    if (index === 1) await new Promise(resolve => setTimeout(resolve, 1200));
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({
      order: stops, distance: index === 1 ? 1 : 99, duration: 20, source: "OSRM",
      route: stops.map((n: number) => [-6.9 + n * .001, 107.6 + n * .001]),
    }) });
  });
  await page.goto("/dashboard/dispatch/new");
  await expect.poll(() => calls).toBe(1);
  await page.getByLabel("Gudang asal", { exact: true }).selectOption("4");
  await expect(page.locator(".route-estimates")).toContainText("99.0 km");
  await page.waitForTimeout(1300);
  await expect(page.locator(".route-estimates")).toContainText("99.0 km");
  await expect(page.getByLabel("Gudang asal", { exact: true })).toHaveValue("4");
});
