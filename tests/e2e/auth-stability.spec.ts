import { expect, test } from "@playwright/test";

test("login navigates once and the new session survives a page reload", async ({ page }) => {
  let loginDocuments = 0;
  page.on("request", (request) => {
    if (request.isNavigationRequest() && new URL(request.url()).pathname === "/login") {
      loginDocuments += 1;
    }
  });

  await page.goto("/login");
  await page.getByRole("button", { name: "Buka dashboard demo" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole("heading", { name: "Dashboard", exact: false })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("heading", { name: "Dashboard", exact: false })).toBeVisible();
  await page.waitForTimeout(1200);
  expect(loginDocuments).toBeLessThanOrEqual(2);
});
