import { defineConfig } from "@playwright/test";
const port = process.env.KOMPO_TEST_PORT ?? "5173";
export default defineConfig({
  testDir: "./e2e",
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    channel: "chrome",
    headless: true,
  },
  webServer: {
    command: `npm run dev -- --host 127.0.0.1 --port ${port} --strictPort`,
    url: `http://127.0.0.1:${port}`,
    reuseExistingServer: !process.env.KOMPO_TEST_PORT,
  },
  reporter: "list",
});
