import { defineConfig } from "@playwright/test";
const port = process.env.KOMPO_PAGES_PORT ?? "4173";
export default defineConfig({
  testDir: "./e2e-pages",
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    channel: process.env.CI ? undefined : "chrome",
    headless: true,
  },
  webServer: {
    command: "npm run preview:pages",
    url: `http://127.0.0.1:${port}/kompo/`,
    reuseExistingServer: false,
  },
  reporter: "list",
});
