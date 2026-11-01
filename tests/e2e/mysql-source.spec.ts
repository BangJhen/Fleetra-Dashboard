import { expect, test } from "@playwright/test";
import type { RowDataPacket } from "mysql2/promise";
import { mysqlPool } from "../../src/lib/mysql";

test("dashboard reads a vehicle change made directly in MariaDB", async ({
  page,
}) => {
  test.skip(
    process.env.FLEETRA_DATA_BACKEND !== "mysql",
    "Requires an isolated MariaDB test database.",
  );
  const pool = mysqlPool();
  const [rows] = await pool.execute<RowDataPacket[]>(
    "SELECT model,latitude FROM vehicles WHERE external_id=?",
    ["v1"],
  );
  const [companies] = await pool.execute<RowDataPacket[]>(
    "SELECT name,address FROM companies WHERE slug='fleetra-demo'",
  );
  const [locations] = await pool.execute<RowDataPacket[]>(
    "SELECT name FROM locations WHERE location_index=0",
  );
  const original = rows[0].model as string;
  try {
    await pool.execute("UPDATE vehicles SET model=?,latitude=? WHERE external_id=?", [
      "Model verifikasi database",
      -6.91,
      "v1",
    ]);
    await pool.execute(
      "UPDATE companies SET name=?,address=? WHERE slug='fleetra-demo'",
      ["Workspace verifikasi", "Wilayah verifikasi"],
    );
    await pool.execute("UPDATE locations SET name=? WHERE location_index=0", [
      "Gudang verifikasi database",
    ]);
    await page.goto("/login");
    await page.getByRole("button", { name: "Buka dashboard demo" }).click();
    await expect(page).toHaveURL(/\/dashboard$/);
    const state = await (await page.request.get("/api/fleet")).json();
    expect(state.vehicles.find((vehicle: { id: string }) => vehicle.id === "v1").lat).toBeCloseTo(-6.91);
    await expect(page.locator(".topbar-workspace")).toHaveText(
      "Workspace verifikasi",
    );
    await expect(page.locator(".topbar-region")).toHaveText(
      "Wilayah verifikasi",
    );
    await page.goto("/dashboard/management/vehicles");
    await expect(
      page.getByRole("row").filter({ hasText: "B 9821 KCE" }),
    ).toContainText("Model verifikasi database");
    await page.reload();
    await expect(
      page.getByRole("row").filter({ hasText: "B 9821 KCE" }),
    ).toContainText("Model verifikasi database");
    await page.goto("/dashboard/dispatch/new");
    await expect(
      page.getByLabel("Gudang asal").locator("option").first(),
    ).toHaveText("Gudang verifikasi database");
  } finally {
    await pool.execute("UPDATE vehicles SET model=?,latitude=? WHERE external_id=?", [
      original,
      rows[0].latitude,
      "v1",
    ]);
    await pool.execute(
      "UPDATE companies SET name=?,address=? WHERE slug='fleetra-demo'",
      [companies[0].name, companies[0].address],
    );
    await pool.execute("UPDATE locations SET name=? WHERE location_index=0", [
      locations[0].name,
    ]);
    await pool.end();
  }
});
