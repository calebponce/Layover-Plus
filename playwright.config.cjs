const { defineConfig, devices } = require("@playwright/test");

const baseURL = process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:4173";

module.exports = defineConfig({
  testDir: "./tests",
  timeout: 90_000,
  expect: {
    timeout: 20_000,
  },
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"]],
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  webServer: [
    {
      command: "node server.js",
      url: "http://127.0.0.1:3000/api/health",
      reuseExistingServer: true,
      timeout: 120_000,
      env: {
        ...process.env,
        NODE_ENV: "test",
        LAYOVERPLUS_POI_MODE: "curated",
      },
    },
    {
      command: "node ./node_modules/vite/bin/vite.js --host 127.0.0.1 --port 4173",
      url: baseURL,
      reuseExistingServer: true,
      timeout: 120_000,
      env: {
        ...process.env,
        VITE_API_PROXY_TARGET: "http://127.0.0.1:3000",
      },
    },
  ],
  projects: [
    {
      name: "api",
      testMatch: /tests\/contract\/.*\.spec\.js/,
      use: {
        baseURL: "http://127.0.0.1:3000",
      },
    },
    {
      name: "chromium",
      testMatch: /tests\/e2e\/.*\.spec\.js/,
      use: {
        ...devices["Desktop Chrome"],
      },
    },
  ],
});
