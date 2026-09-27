import { createReadStream, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(fileURLToPath(new URL(".", import.meta.url)));
const root = resolve(projectRoot, "dist");
const host = process.env.HOST || "127.0.0.1";
const port = Number(process.env.PORT || 4173);
const contentTypes = new Map([
  [".css", "text/css; charset=utf-8"],
  [".html", "text/html; charset=utf-8"],
  [".jpeg", "image/jpeg"],
  [".jpg", "image/jpeg"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".mp4", "video/mp4"],
  [".webp", "image/webp"],
  [".woff2", "font/woff2"],
  [".svg", "image/svg+xml"],
]);

const server = createServer((request, response) => {
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(request.url, `http://${host}`).pathname);
  } catch {
    response.writeHead(400).end("Bad request");
    return;
  }

  let filePath = resolve(root, `.${pathname === "/" ? "/index.html" : pathname}`);
  if (filePath !== root && !filePath.startsWith(`${root}${sep}`)) {
    response.writeHead(403).end("Forbidden");
    return;
  }

  try {
    let stats;
    try {
      stats = statSync(filePath);
      if (stats.isDirectory()) {
        filePath = resolve(filePath, "index.html");
        stats = statSync(filePath);
      }
    } catch {
      // Check in public/ directory fallback
      const publicPath = resolve(root, "public", `.${pathname === "/" ? "/index.html" : pathname}`);
      stats = statSync(publicPath);
      filePath = publicPath;
    }
    if (!stats.isFile()) throw new Error("Not a file");
    response.writeHead(200, {
      "Content-Length": stats.size,
      "Content-Type": contentTypes.get(extname(filePath).toLowerCase()) || "application/octet-stream",
      "X-Content-Type-Options": "nosniff",
    });
    if (request.method === "HEAD") response.end();
    else createReadStream(filePath).pipe(response);
  } catch {
    response.writeHead(404).end("Not found");
  }
});

server.listen(port, host, () => {
  console.log(`Rosaliaaa preview: http://${host}:${port}`);
});