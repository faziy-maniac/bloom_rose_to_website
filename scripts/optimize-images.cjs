const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const imageDirectory = path.resolve(__dirname, "..", "images");
const ffmpeg = process.env.FFMPEG_PATH || require("ffmpeg-static");
const sources = fs.readdirSync(imageDirectory).filter((name) => /\.(jpeg\.jpg|jpg|jpeg)$/i.test(name));

for (const source of sources) {
  for (const size of [640, 1280, 1800]) {
    const suffix = size === 1800 ? ".webp" : `-${size}.webp`;
    const output = path.join(imageDirectory, source.replace(/\.(jpeg\.jpg|jpg|jpeg)$/i, suffix));
    const result = spawnSync(ffmpeg, [
      "-hide_banner", "-loglevel", "error", "-y", "-i", path.join(imageDirectory, source),
      "-vf", `scale=${size}:${size}:force_original_aspect_ratio=decrease:force_divisible_by=2`,
      "-frames:v", "1", "-c:v", "libwebp", "-q:v", "80", "-compression_level", "4", output,
    ], { stdio: "inherit" });
    if (result.error) throw result.error;
    if (result.status !== 0) throw new Error(`Image conversion failed: ${source} at ${size}px`);
    console.log(`${source} -> ${path.basename(output)}`);
  }
}

if (!sources.length) console.log("No source JPEGs found in images/.");
