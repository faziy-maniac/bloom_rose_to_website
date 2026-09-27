const fs = require("node:fs");
const path = require("node:path");
const esbuild = require("esbuild");

const projectRoot = path.resolve(__dirname, "..");
const outputDirectory = path.join(projectRoot, "dist");
const siteFiles = [
  "index.html",
  "styles.css",
  "app.js",
  "site-ui.js",
  "images",
  "assets",
  "shop",
];

fs.rmSync(outputDirectory, { recursive: true, force: true });
fs.mkdirSync(outputDirectory, { recursive: true });

for (const file of siteFiles) {
  const src = path.join(projectRoot, file);
  if (fs.existsSync(src)) {
    const allowedExtensions = new Set([".webp", ".jpg", ".jpeg", ".png"]);
    const options = file === "images"
      ? { recursive: true, filter: (source) => source === src || allowedExtensions.has(path.extname(source).toLowerCase()) }
      : { recursive: true };
    fs.cpSync(src, path.join(outputDirectory, file), options);
  }
}

esbuild.buildSync({
  entryPoints: [path.join(projectRoot, "store-ui.js")],
  bundle: true,
  format: "esm",
  platform: "browser",
  target: ["es2020"],
  outfile: path.join(outputDirectory, "store-ui.js"),
});

console.log(`Prepared Rosaliaaa static site in ${outputDirectory}`);