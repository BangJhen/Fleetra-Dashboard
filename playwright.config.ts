import { defineConfig } from "@playwright/test";
const port = 3101;
const baseURL = process.env.FLEETRA_TEST_URL || `http://127.0.0.1:${port}`;
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 30000,
  use: {
    baseURL,
    headless: true,
    channel: "chrome",
    viewport: { width: 1440, height: 1000 },
    screenshot: "only-on-failure",
  },
  reporter: "list",
  webServer: process.env.FLEETRA_TEST_URL
    ? undefined
    : {
        command: `npm run dev -- --hostname 127.0.0.1 --port ${port}`,
        url: baseURL,
        reuseExistingServer: false,
        env: {
          FLEETRA_TEST_SERVER: "1",
          FLEETRA_DATA_DIR: `.data/qa-${Date.now()}`,
          MOBILE_DEMO_TOKEN: "fleetra-qa-local-token",
        },
        timeout: 60000,
      },
});
