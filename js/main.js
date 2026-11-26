// Small enhancements on top of a page that already works without JavaScript.

const root = document.documentElement;

// Header: a solid background once the page has scrolled.
const header = document.querySelector("[data-site-header]");
if (header) {
  const update = () => header.toggleAttribute("data-scrolled", window.scrollY > 40);
  update();
  window.addEventListener("scroll", update, { passive: true });
}

// Footer: the current year.
for (const el of document.querySelectorAll("[data-year]")) {
  el.textContent = String(new Date().getFullYear());
}

// Contact form: open the visitor's email app with the message filled in.
const form = document.querySelector("#contact-form");
if (form) {
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const name = String(data.get("name") ?? "").trim();
    const email = String(data.get("email") ?? "").trim();
    const message = String(data.get("message") ?? "").trim();
    const subject = encodeURIComponent(`Hello from ${name}`);
    const body = encodeURIComponent(`${message}\n\nFrom: ${name}\nEmail: ${email}`);
    window.location.href = `${form.getAttribute("action")}?subject=${subject}&body=${body}`;
  });
}

// Motion: a custom cursor, magnetic elements and the hero's orbiting tags.
// Only with a mouse (fine pointer) and when the visitor hasn't asked for reduced motion.
const finePointer = window.matchMedia("(pointer: fine)");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

if (finePointer.matches && !reduceMotion.matches) startMotion();

function startMotion() {
  const pointer = { x: -100, y: -100, seen: false };
  window.addEventListener(
    "pointermove",
    (event) => {
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      pointer.seen = true;
    },
    { passive: true },
  );

  // Custom cursor: a dot on the pointer and a ring that follows it.
  const dot = makeCursorPart("cursor-dot");
  const ring = makeCursorPart("cursor-ring");
  const ringAt = { x: pointer.x, y: pointer.y };
  root.classList.add("has-custom-cursor");

  // Elements marked data-magnetic="strength" (and data-radius="px") drift towards the pointer.
  const magnets = [...document.querySelectorAll("[data-magnetic]")].map((el) => ({
    el,
    strength: Number(el.dataset.magnetic) || 0.4,
    radius: Number(el.dataset.radius) || 160,
    x: 0,
    y: 0,
  }));

  // Tags around the hero button are pulled in when the pointer comes close.
  const orbitCentre = document.querySelector(".hero-cta");
  const tags = [...document.querySelectorAll(".orbit-tag")].map((el) => {
    const style = getComputedStyle(el);
    const scale = Number(style.getPropertyValue("--orbit-scale")) || 1;
    return {
      el,
      baseX: Number(style.getPropertyValue("--x")) * scale,
      baseY: Number(style.getPropertyValue("--y")) * scale,
      x: 0,
      y: 0,
    };
  });

  let frame = 0;
  const tick = () => {
    if (pointer.seen) {
      dot.style.translate = `${pointer.x - 4}px ${pointer.y - 4}px`;
      ringAt.x += (pointer.x - ringAt.x) * 0.11;
      ringAt.y += (pointer.y - ringAt.y) * 0.11;
      ring.style.translate = `${ringAt.x - 20}px ${ringAt.y - 20}px`;
    }

    for (const m of magnets) {
      const rect = m.el.getBoundingClientRect();
      // The element's resting centre (its current offset taken back out).
      const dx = pointer.x - (rect.left + rect.width / 2 - m.x);
      const dy = pointer.y - (rect.top + rect.height / 2 - m.y);
      const distance = Math.hypot(dx, dy);
      const pull = distance < m.radius ? m.strength * (1 - distance / m.radius) : 0;
      m.x += (dx * pull - m.x) * 0.1;
      m.y += (dy * pull - m.y) * 0.1;
      m.el.style.transform = `translate(${m.x.toFixed(2)}px, ${m.y.toFixed(2)}px)`;
    }

    if (orbitCentre && tags.length) {
      const rect = orbitCentre.getBoundingClientRect();
      const dx = pointer.x - (rect.left + rect.width / 2);
      const dy = pointer.y - (rect.top + rect.height / 2);
      const distance = Math.hypot(dx, dy);
      const pull = distance < 300 ? Math.pow(1 - distance / 300, 1.6) * 1.1 : 0;
      for (const t of tags) {
        const targetX = (dx * 0.3 - t.baseX) * pull;
        const targetY = (dy * 0.3 - t.baseY) * pull;
        t.x += (targetX - t.x) * 0.07;
        t.y += (targetY - t.y) * 0.07;
        t.el.style.transform = `translate(${t.x.toFixed(2)}px, ${t.y.toFixed(2)}px)`;
      }
    }

    frame = requestAnimationFrame(tick);
  };
  frame = requestAnimationFrame(tick);

  // If the visitor turns on "reduce motion" while the page is open, stop and tidy up.
  reduceMotion.addEventListener("change", () => {
    if (!reduceMotion.matches) return;
    cancelAnimationFrame(frame);
    root.classList.remove("has-custom-cursor");
    dot.remove();
    ring.remove();
    for (const { el } of [...magnets, ...tags]) el.style.removeProperty("transform");
  });
}

function makeCursorPart(className) {
  const el = document.createElement("div");
  el.className = className;
  el.setAttribute("aria-hidden", "true");
  document.body.append(el);
  return el;
}
