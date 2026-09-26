const canvas = document.querySelector(".hero-canvas");
const context = canvas.getContext("2d", { alpha: false });
const runway = document.querySelector(".hero-runway");
const heroStage = document.querySelector(".hero-stage");
const heroBeats = [...document.querySelectorAll("[data-beat]")];
const frameCache = new Map();
const maxCachedFrames = 28;
let framePaths = [];
let currentFrame = -1;
let requestedFrame = 0;
let drawQueued = false;
let previousBeat = -1;
let viewportWidth = 0;
let viewportHeight = 0;

function resizeCanvas() {
  const bounds = heroStage.getBoundingClientRect();
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  viewportWidth = bounds.width;
  viewportHeight = bounds.height;
  canvas.width = Math.round(viewportWidth * ratio);
  canvas.height = Math.round(viewportHeight * ratio);
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  drawFrame(requestedFrame);
}

function drawFrame(index) {
  if (!framePaths.length) return;
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
    const scrollableDistance = runway.offsetHeight - window.innerHeight;
    const progress = Math.min(1, Math.max(0, -runway.getBoundingClientRect().top / scrollableDistance));
    requestedFrame = Math.round(progress * (framePaths.length - 1));
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
    console.error("Unable to initialize the BLOOM hero sequence:", error);
  }
}

window.addEventListener("scroll", scheduleDraw, { passive: true });
window.addEventListener("resize", resizeCanvas, { passive: true });
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

const shadeButtons = [...document.querySelectorAll(".shade-dot")];
const shadeName = document.querySelector(".shade-name");
const shadeDescription = document.querySelector(".shade-description");
const productSwatch = document.querySelector(".product-swatch");
shadeButtons.forEach((button) => button.addEventListener("click", () => {
  shadeButtons.forEach((shade) => {
    const selected = shade === button;
    shade.classList.toggle("is-selected", selected);
    shade.setAttribute("aria-pressed", String(selected));
  });
  shadeName.textContent = button.dataset.name;
  shadeDescription.textContent = button.dataset.description;
  productSwatch.style.backgroundColor = getComputedStyle(button).getPropertyValue("--shade");
}));

const bagCount = document.querySelector(".bag-count");
const bagLink = document.querySelector(".bag-link");
const addButton = document.querySelector(".add-button");
const bagConfirmation = document.querySelector(".bag-confirmation");
let itemCount = 0;
addButton.addEventListener("click", () => {
  itemCount += 1;
  bagCount.textContent = String(itemCount);
  bagLink.setAttribute("aria-label", `Shopping bag, ${itemCount} ${itemCount === 1 ? "item" : "items"}`);
  bagConfirmation.textContent = `${shadeName.textContent} added to your bag.`;
});

const menuToggle = document.querySelector(".menu-toggle");
const navigation = document.querySelector(".desktop-nav");
menuToggle.addEventListener("click", () => {
  const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
  menuToggle.setAttribute("aria-expanded", String(!isOpen));
  menuToggle.setAttribute("aria-label", isOpen ? "Open navigation" : "Close navigation");
  navigation.classList.toggle("is-open", !isOpen);
});
navigation.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => {
  menuToggle.setAttribute("aria-expanded", "false");
  menuToggle.setAttribute("aria-label", "Open navigation");
  navigation.classList.remove("is-open");
}));