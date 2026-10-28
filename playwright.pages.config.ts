import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./e2e-pages",
  use: {
    baseURL: "http://127.0.0.1:4173",
    channel: process.env.CI ? undefined : "chrome",
    headless: true,
  },
  webServer: {
    command: "npm run preview:pages",
    url: "http://127.0.0.1:4173/kompo/",
    reuseExistingServer: false,
  },
  reporter: "list",
});
