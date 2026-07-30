import { defineConfig, devices } from "@playwright/test";
import { config } from "dotenv";

import { requireDisposableTestDatabase } from "./src/test/disposable-database";

config({ path: ".env.local", quiet: true });
config({ quiet: true });

const disposableDatabaseUrl = requireDisposableTestDatabase();
process.env.DATABASE_URL = disposableDatabaseUrl;

export default defineConfig({
  testDir: "./tests",
  timeout: 30_000,
  fullyParallel: true,
  reporter: "list",
  use: {
    baseURL: "http://localhost:3100",
    trace: "on-first-retry",
  },
  webServer: {
    command: "npm run dev -- -p 3100",
    url: "http://localhost:3100",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      APP_ENV: "test",
      DATABASE_URL: disposableDatabaseUrl,
      FINSEC_AUTH_BYPASS: "true",
      NODE_ENV: "development",
    },
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
