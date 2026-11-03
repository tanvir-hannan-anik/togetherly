import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  workers: 1,
  timeout: 120_000,
  expect: { timeout: 15_000 },
  use: {
    baseURL: "http://localhost:3001",
    channel: "msedge",
    headless: true,
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  webServer: [
    {
      command: "node server/test/browser-server.js",
      url: "http://localhost:8001",
      timeout: 120_000,
    },
    {
      command: "npm run dev -- --port 3001",
      url: "http://localhost:3001",
      env: { NEXT_PUBLIC_API_URL: "http://localhost:8001" },
      timeout: 120_000,
    },
  ],
});
