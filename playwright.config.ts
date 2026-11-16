import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/browser",
  workers: 1,
  timeout: 120_000,
  use: {
    actionTimeout: 15_000,
    baseURL: process.env.TEST_BASE_URL || "http://localhost:3000",
    headless: true,
    launchOptions: process.env.CHROMIUM_PATH ? {
      executablePath: process.env.CHROMIUM_PATH,
      args: ["--no-sandbox"],
    } : {},
    screenshot: "only-on-failure",
  },
});
