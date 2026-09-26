const { spawn } = require("node:child_process");
const fs = require("node:fs/promises");
const path = require("node:path");

const source = path.resolve(process.env.HERO_VIDEO || "hero.mp4");
const outputDirectory = path.resolve("assets/hero-frames");
const ffmpeg = process.env.FFMPEG_PATH || require("ffmpeg-static");
const frameRate = 15;

async function main() {
  await fs.access(source);
  await fs.mkdir(outputDirectory, { recursive: true });

  const existingFrames = await fs.readdir(outputDirectory);
  await Promise.all(existingFrames
    .filter((filename) => /^frame_\d{4}\.webp$/.test(filename))
    .map((filename) => fs.unlink(path.join(outputDirectory, filename))));

  const outputPattern = path.join(outputDirectory, "frame_%04d.webp");
  const args = [
    "-hide_banner", "-loglevel", "error", "-y", "-i", source,
    "-an", "-vf", `fps=${frameRate},scale=1440:1440:force_original_aspect_ratio=decrease:force_divisible_by=2`,
    "-c:v", "libwebp", "-q:v", "72", "-compression_level", "4", "-start_number", "0",
    outputPattern,
  ];

  const exitCode = await new Promise((resolve, reject) => {
    const process = spawn(ffmpeg, args, { stdio: "inherit" });
    process.once("error", reject);
    process.once("close", resolve);
  });
  if (exitCode !== 0) throw new Error(`FFmpeg exited with status ${exitCode}`);

  const frames = (await fs.readdir(outputDirectory))
    .filter((filename) => /^frame_\d{4}\.webp$/.test(filename))
    .sort();
  if (!frames.length) throw new Error("FFmpeg did not produce any frames");

  await fs.writeFile(path.join(outputDirectory, "manifest.json"), JSON.stringify({
    source: path.basename(source),
    frameRate,
    frames,
  }, null, 2));
  console.log(`Extracted ${frames.length} frames at ${frameRate} fps to ${outputDirectory}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});