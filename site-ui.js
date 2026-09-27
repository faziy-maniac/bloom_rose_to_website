const menuToggle = document.querySelector(".menu-toggle");
const navigation = document.querySelector(".desktop-nav");

if (menuToggle && navigation) {
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
}

const paperDialog = document.querySelector("#paper-dialog");
if (paperDialog) {
  let isClosing = false;
  let shopDestination = "";

  const closePaper = () => {
    if (!paperDialog.open || isClosing) return;
    isClosing = true;
    paperDialog.classList.remove("is-visible");
  };

  document.querySelectorAll("[data-paper-open]").forEach((link) => link.addEventListener("click", (event) => {
    const selectedContent = paperDialog.querySelector(`[data-paper-content="${link.dataset.paperOpen}"]`);
    if (!selectedContent) return;
    event.preventDefault();
    paperDialog.querySelectorAll("[data-paper-content]").forEach((content) => {
      content.hidden = content !== selectedContent;
    });
    if (!paperDialog.open) {
      isClosing = false;
      paperDialog.showModal();
      paperDialog.getBoundingClientRect();
      paperDialog.classList.add("is-visible");
    }
    paperDialog.querySelector(".paper-sheet").scrollTop = 0;
  }));

  paperDialog.addEventListener("click", (event) => {
    if (event.target.closest("[data-paper-close]")) {
      closePaper();
      return;
    }
    const shopLink = event.target.closest("[data-paper-shop]");
    if (shopLink) {
      event.preventDefault();
      shopDestination = shopLink.href;
      closePaper();
      return;
    }
    if (event.target === paperDialog) closePaper();
  });

  paperDialog.addEventListener("cancel", (event) => {
    event.preventDefault();
    closePaper();
  });

  paperDialog.addEventListener("transitionend", (event) => {
    if (event.target === paperDialog && event.propertyName === "opacity" && isClosing) {
      const destination = shopDestination;
      shopDestination = "";
      paperDialog.close();
      if (destination) window.location.assign(destination);
    }
  });

  paperDialog.addEventListener("close", () => {
    isClosing = false;
  });
}

// Live Natural Atmospheric Petal Drift & Ambient Light Aura
function initShopNaturalEffect() {
  const canvas = document.querySelector("#shop-petals-canvas");
  const shopPage = document.querySelector(".shop-page");
  if (!canvas || !shopPage) return;

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReducedMotion) return;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  let width = 0;
  let height = 0;
  let dpr = 1;
  let mouse = { x: -1000, y: -1000, active: false };
  let targetMouse = { x: -1000, y: -1000 };
  let animationId = null;
  let isVisible = true;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    width = rect.width || window.innerWidth;
    height = rect.height || window.innerHeight;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
  }

  const PARTICLE_COUNT = Math.min(Math.floor(window.innerWidth / 38), 36);
  const particles = [];

  const PALETTES = [
    { type: "petal", c1: "rgba(228, 155, 163, ", c2: "rgba(164, 76, 88, " },
    { type: "petal", c1: "rgba(238, 182, 176, ", c2: "rgba(186, 92, 102, " },
    { type: "petal", c1: "rgba(214, 130, 142, ", c2: "rgba(138, 52, 64, " },
    { type: "spore", color: "rgba(245, 215, 170, " },
    { type: "spore", color: "rgba(232, 188, 142, " },
  ];

  function createParticle(initialY) {
    const isPetal = Math.random() < 0.72;
    const palette = isPetal
      ? PALETTES[Math.floor(Math.random() * 3)]
      : PALETTES[3 + Math.floor(Math.random() * 2)];

    return {
      type: isPetal ? "petal" : "spore",
      x: Math.random() * (width || window.innerWidth),
      y: initialY !== undefined ? initialY : Math.random() * (height || window.innerHeight),
      size: isPetal ? 7 + Math.random() * 9 : 1.5 + Math.random() * 2.2,
      speedY: isPetal ? 0.35 + Math.random() * 0.55 : 0.2 + Math.random() * 0.35,
      speedX: (Math.random() - 0.45) * 0.3,
      sway: 0.8 + Math.random() * 1.4,
      wobble: Math.random() * Math.PI * 2,
      wobbleSpeed: 0.012 + Math.random() * 0.018,
      angle: Math.random() * Math.PI * 2,
      angularVelocity: (Math.random() - 0.5) * 0.015,
      flip: Math.random() * Math.PI * 2,
      flipSpeed: 0.015 + Math.random() * 0.02,
      alpha: isPetal ? 0.24 + Math.random() * 0.36 : 0.35 + Math.random() * 0.45,
      palette,
      pulse: Math.random() * Math.PI * 2,
    };
  }

  resize();
  window.addEventListener("resize", resize, { passive: true });

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    particles.push(createParticle());
  }

  window.addEventListener("pointermove", (e) => {
    targetMouse.x = e.clientX;
    targetMouse.y = e.clientY;
    mouse.active = true;

    const rect = shopPage.getBoundingClientRect();
    const xPct = ((e.clientX - rect.left) / rect.width) * 100;
    const yPct = ((e.clientY - rect.top) / rect.height) * 100;
    shopPage.style.setProperty("--mouse-x", `${xPct.toFixed(1)}%`);
    shopPage.style.setProperty("--mouse-y", `${yPct.toFixed(1)}%`);
  }, { passive: true });

  window.addEventListener("pointerleave", () => {
    mouse.active = false;
  }, { passive: true });

  const observer = new IntersectionObserver(([entry]) => {
    isVisible = entry.isIntersecting;
    if (isVisible && !animationId) {
      lastTime = performance.now();
      animationId = requestAnimationFrame(render);
    }
  }, { threshold: 0.05 });
  observer.observe(shopPage);

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
      }
    } else if (isVisible && !animationId) {
      lastTime = performance.now();
      animationId = requestAnimationFrame(render);
    }
  });

  let lastTime = performance.now();

  function render(time) {
    if (!isVisible) {
      animationId = null;
      return;
    }

    const dt = Math.min((time - lastTime) / 16.667, 2.5);
    lastTime = time;

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    if (mouse.active) {
      mouse.x += (targetMouse.x - mouse.x) * 0.1;
      mouse.y += (targetMouse.y - mouse.y) * 0.1;
    }

    const breeze = Math.sin(time * 0.00045) * 0.35 + 0.15;

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];

      p.wobble += p.wobbleSpeed * dt;
      p.flip += p.flipSpeed * dt;
      p.angle += p.angularVelocity * dt;
      p.pulse += 0.02 * dt;

      p.y += p.speedY * dt;
      p.x += (p.speedX + breeze + Math.sin(p.wobble) * p.sway * 0.5) * dt;

      if (mouse.active) {
        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const distSq = dx * dx + dy * dy;
        const maxDist = 130;
        if (distSq < maxDist * maxDist && distSq > 1) {
          const dist = Math.sqrt(distSq);
          const force = (1 - dist / maxDist) * 0.8;
          p.x += (dx / dist) * force * dt * 2;
          p.y += (dy / dist) * force * dt * 2;
        }
      }

      if (p.y > height + 25) {
        p.y = -25;
        p.x = Math.random() * width;
      } else if (p.x < -30) {
        p.x = width + 20;
      } else if (p.x > width + 30) {
        p.x = -20;
      }

      if (p.type === "petal") {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);
        const flipScale = Math.cos(p.flip);
        ctx.scale(1, Math.abs(flipScale) > 0.08 ? flipScale : 0.08);

        const grad = ctx.createLinearGradient(0, -p.size, 0, p.size);
        grad.addColorStop(0, p.palette.c1 + p.alpha + ")");
        grad.addColorStop(1, p.palette.c2 + (p.alpha * 0.8) + ")");
        ctx.fillStyle = grad;

        ctx.beginPath();
        ctx.moveTo(0, -p.size);
        ctx.bezierCurveTo(p.size * 0.85, -p.size * 0.5, p.size * 0.8, p.size * 0.7, 0, p.size);
        ctx.bezierCurveTo(-p.size * 0.8, p.size * 0.7, -p.size * 0.85, -p.size * 0.5, 0, -p.size);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      } else {
        ctx.save();
        ctx.translate(p.x, p.y);
        const currentAlpha = p.alpha * (0.65 + 0.35 * Math.sin(p.pulse));
        const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, p.size * 2);
        grad.addColorStop(0, p.palette.color + currentAlpha + ")");
        grad.addColorStop(0.5, p.palette.color + (currentAlpha * 0.35) + ")");
        grad.addColorStop(1, p.palette.color + "0)");
        ctx.fillStyle = grad;

        ctx.beginPath();
        ctx.arc(0, 0, p.size * 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    ctx.restore();
    animationId = requestAnimationFrame(render);
  }

  animationId = requestAnimationFrame(render);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initShopNaturalEffect);
} else {
  initShopNaturalEffect();
}
