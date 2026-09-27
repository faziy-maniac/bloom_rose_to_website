const canvas = document.querySelector(".hero-canvas");
const context = canvas.getContext("2d", { alpha: false });
const runway = document.querySelector(".hero-runway");
const heroStage = document.querySelector(".hero-stage");
const heroBeats = [...document.querySelectorAll("[data-beat]")];
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const frameCache = new Map();
const maxCachedFrames = 28;
let framePaths = [];
let currentFrame = -1;
let requestedFrame = 0;
let drawQueued = false;
let resizeQueued = false;
let previousBeat = -1;
let viewportWidth = 0;
let viewportHeight = 0;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function resizeCanvas() {
  const bounds = heroStage.getBoundingClientRect();
  const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
  viewportWidth = bounds.width;
  viewportHeight = bounds.height;
  canvas.width = Math.round(viewportWidth * ratio);
  canvas.height = Math.round(viewportHeight * ratio);
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  drawFrame(requestedFrame);
}

function scheduleResize() {
  if (resizeQueued) return;
  resizeQueued = true;
  requestAnimationFrame(() => {
    resizeQueued = false;
    resizeCanvas();
  });
}

function drawFrame(index) {
  if (!framePaths.length || !viewportWidth || !viewportHeight) return;
  const image = frameCache.get(index);
  if (!image?.complete || !image.naturalWidth) {
    loadFrame(index, true);
    return;
  }

  frameCache.delete(index);
  frameCache.set(index, image);
  const scale = Math.max(viewportWidth / image.naturalWidth, viewportHeight / image.naturalHeight);
  const width = image.naturalWidth * scale;
  const height = image.naturalHeight * scale;
  context.clearRect(0, 0, viewportWidth, viewportHeight);
  context.drawImage(image, (viewportWidth - width) / 2, (viewportHeight - height) / 2, width, height);
  currentFrame = index;
  heroStage.classList.add("has-frame");
}

function loadFrame(index, drawWhenReady = false) {
  if (index < 0 || index >= framePaths.length || frameCache.has(index)) return;

  const image = new Image();
  image.decoding = "async";
  image.onload = () => {
    if (drawWhenReady || index === requestedFrame) drawFrame(index);
  };
  image.src = framePaths[index];
  frameCache.set(index, image);

  while (frameCache.size > maxCachedFrames) {
    const oldest = frameCache.keys().next().value;
    if (oldest === requestedFrame) break;
    frameCache.delete(oldest);
  }
}

function scheduleDraw() {
  if (drawQueued) return;
  drawQueued = true;
  requestAnimationFrame(() => {
    drawQueued = false;
    const scrollableDistance = Math.max(1, runway.offsetHeight - window.innerHeight);
    const progress = reducedMotion.matches
      ? 0
      : clamp(-runway.getBoundingClientRect().top / scrollableDistance, 0, 1);
    const exitProgress = clamp((progress - 0.93) / 0.07, 0, 1);
    requestedFrame = Math.round(progress * (framePaths.length - 1));

    heroStage.style.setProperty("--stage-opacity", (1 - exitProgress * 0.34).toFixed(3));
    heroStage.style.setProperty("--media-scale", (1.035 + progress * 0.04).toFixed(3));
    heroStage.style.setProperty("--media-y", `${((progress - 0.5) * -20).toFixed(1)}px`);
    heroStage.style.setProperty("--glow-y", `${((progress - 0.5) * 18).toFixed(1)}px`);

    const beat = Math.min(2, Math.floor(progress * 3));
    if (beat !== previousBeat) {
      heroBeats.forEach((element, index) => element.classList.toggle("is-active", index === beat));
      previousBeat = beat;
    }

    if (requestedFrame !== currentFrame) {
      drawFrame(requestedFrame);
      for (let offset = 1; offset <= 3; offset += 1) {
        loadFrame(requestedFrame + offset);
        if (requestedFrame - offset >= 0) loadFrame(requestedFrame - offset);
      }
    }
  });
}

async function initializeHero() {
  try {
    const response = await fetch("assets/hero-frames/manifest.json");
    if (!response.ok) throw new Error("Frame manifest unavailable");
    const manifest = await response.json();
    framePaths = manifest.frames.map((frame) => `assets/hero-frames/${frame}`);
    if (!framePaths.length) throw new Error("No hero frames found");
    loadFrame(0, true);
    for (let index = 1; index < Math.min(framePaths.length, 12); index += 1) loadFrame(index);
    scheduleDraw();
  } catch (error) {
    console.error("Unable to initialize the Rosaliaaa hero sequence:", error);
  }
}

window.addEventListener("scroll", scheduleDraw, { passive: true });
window.addEventListener("resize", scheduleResize, { passive: true });
reducedMotion.addEventListener("change", scheduleDraw);
resizeCanvas();
initializeHero();

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("is-visible");
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.16 });
document.querySelectorAll(".reveal").forEach((element) => revealObserver.observe(element));
