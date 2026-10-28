import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig({
  // No client-side URL routes: relative assets support both Pages repository
  // subpaths and root/custom-domain hosting without knowing the repo name.
  base: "./",
  plugins: [react()],
});
