// Strict static hosting: no SPA fallback and no assets served from the root.
// This reproduces a GitHub Pages project mounted under /kompo/.
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { resolve, extname, sep } from "node:path";
const root = resolve("dist");
await stat(resolve(root, "index.html")).catch(() => {
  throw new Error("Run npm run build before previewing GitHub Pages.");
});
const base = "/kompo/";
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".ttf": "font/ttf",
  ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8",
};
createServer(async (req, res) => {
  try {
    const path = decodeURIComponent(
      new URL(req.url, "http://localhost").pathname,
    );
    if (path === base.slice(0, -1)) {
      res.writeHead(301, { Location: base });
      res.end();
      return;
    }
    if (!path.startsWith(base)) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }
    const file = resolve(root, path.slice(base.length) || "index.html");
    if (!file.startsWith(root + sep)) {
      res.writeHead(403);
      res.end("Forbidden");
      return;
    }
    const data = await readFile(file);
    res.writeHead(200, {
      "Content-Type": types[extname(file)] ?? "application/octet-stream",
      "Cache-Control": "no-store",
    });
    res.end(data);
  } catch {
    res.writeHead(404);
    res.end("Not found");
  }
}).listen(4173, "127.0.0.1", () =>
  console.log("KOMPO Pages preview: http://127.0.0.1:4173/kompo/"),
);
