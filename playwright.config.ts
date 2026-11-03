import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  workers: 1,
  timeout: 120_000,
  expect: { timeout: 15_000 },
  use: {
    baseURL: "http://localhost:3010",
    channel: "msedge",
    headless: true,
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
    actionTimeout: 15_000,
  },
  webServer: [
    {
      command: "npm --prefix server run test:serve",
      url: "http://localhost:8010",
      timeout: 120_000,
    },
    {
      command: "npm run dev -- --port 3010",
      url: "http://localhost:3010",
      env: { NEXT_PUBLIC_API_URL: "http://localhost:8010", E2E_TEST: "true" },
      timeout: 120_000,
    },
  ],
});
