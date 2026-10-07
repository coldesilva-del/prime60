import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.E2E_BASE_URL ?? "http://localhost:3000";

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    // Full suite on Chromium: iPhone 13 viewport, touch and user agent, then desktop.
    { name: "iphone-13", use: { ...devices["iPhone 13"], browserName: "chromium" } },
    { name: "desktop-chrome", use: { ...devices["Desktop Chrome"] } },
    // Public pages and accessibility in the other engines (npx playwright install webkit firefox).
    { name: "iphone-webkit", use: { ...devices["iPhone 13"] }, testMatch: /(public|a11y).spec.ts/ },
    { name: "desktop-firefox", use: { ...devices["Desktop Firefox"] }, testMatch: /(public|a11y).spec.ts/ },
  ],
});
