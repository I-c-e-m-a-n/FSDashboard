import { existsSync } from "node:fs";
import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  workers: 2,
  reporter: "list",
  use: {
    baseURL:
      process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:4173/FSDashboard/",
    launchOptions:
      process.env.CI ||
      (!process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH &&
        !existsSync("/usr/bin/chromium"))
        ? {}
        : {
            executablePath:
              process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ||
              "/usr/bin/chromium",
            args: ["--no-sandbox"],
          },
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "desktop",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 1100 },
      },
    },
    {
      name: "mobile",
      use: { ...devices["iPhone 13"], defaultBrowserType: "chromium" },
    },
  ],
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: "npm run preview -- --port 4173",
        url: "http://127.0.0.1:4173/FSDashboard/",
        reuseExistingServer: !process.env.CI,
      },
});
