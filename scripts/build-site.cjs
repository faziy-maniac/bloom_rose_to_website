const fs = require("node:fs");
const path = require("node:path");

const projectRoot = path.resolve(__dirname, "..");
const outputDirectory = path.join(projectRoot, "dist");
const siteFiles = ["index.html", "styles.css", "app.js", "images", "assets/hero-frames"];

fs.rmSync(outputDirectory, { recursive: true, force: true });
fs.mkdirSync(outputDirectory, { recursive: true });

for (const file of siteFiles) {
  fs.cpSync(path.join(projectRoot, file), path.join(outputDirectory, file), { recursive: true });
}

console.log(`Prepared static site in ${outputDirectory}`);