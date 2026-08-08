/* ===========================================================
   Scroll-driven storytelling — GSAP + ScrollTrigger
   =========================================================== */
gsap.registerPlugin(ScrollTrigger);

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- 1. scroll progress bar ---------- */
gsap.to("#progressBar", {
  width: "100%",
  ease: "none",
  scrollTrigger: { trigger: "body", start: "top top", end: "bottom bottom", scrub: 0.3 },
});

if (!reduceMotion) {
  /* ---------- 2. generic reveal-on-scroll ---------- */
  gsap.utils.toArray(".reveal").forEach((el) => {
    gsap.to(el, {
      opacity: 1,
      y: 0,
      duration: 1,
      ease: "power3.out",
      scrollTrigger: { trigger: el, start: "top 82%", toggleActions: "play none none reverse" },
    });
  });

  /* ---------- 3. hero — gentle parallax drift as you leave it ---------- */
  gsap.to(".hero-inner", {
    y: -80,
    opacity: 0.15,
    ease: "none",
    scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true },
  });

  /* ---------- 4. ambient shapes parallax ---------- */
  const drift = [
    [".flower-1", -120, 30],
    [".flower-2", 160, -40],
    [".flower-3", -90, 20],
    [".heart-1", 120, -25],
    [".heart-2", -140, 35],
  ];
  drift.forEach(([sel, y, rot]) => {
    gsap.to(sel, {
      y,
      rotation: `+=${rot}`,
      ease: "none",
      scrollTrigger: { trigger: "body", start: "top top", end: "bottom bottom", scrub: 1 },
    });
  });

  /* ---------- 5. draw the SVG paths on scroll ---------- */
  function drawPaths(container, opts = {}) {
    const paths = document.querySelectorAll(`${container} path`);
    if (!paths.length) return;
    paths.forEach((p) => {
      const len = p.getTotalLength();
      p.style.strokeDasharray = len;
      p.style.strokeDashoffset = len;
    });
    gsap.to(`${container} path`, {
      strokeDashoffset: 0,
      ease: "none",
      stagger: 0.15,
      scrollTrigger: {
        trigger: container,
        // let the ribbon scroll into view first, then draw as it passes through the middle
        start: "top 58%",
        end: opts.end || "top 12%",
        scrub: true,
      },
    });
  }
  // Turn each single stroke into a soft multi-strand "ribbon": main line + fainter echoes.
  function enrichPaths(container) {
    const svg = document.querySelector(container);
    if (!svg) return;
    // snapshot the originals first (so we don't clone the clones)
    const originals = Array.from(svg.querySelectorAll("path"));
    originals.forEach((p) => {
      [-7, 7].forEach((offset, i) => {
        const echo = p.cloneNode();
        echo.setAttribute("transform", `translate(0, ${offset})`);
        echo.setAttribute("stroke-width", "1.6");
        echo.style.opacity = i === 0 ? "0.38" : "0.28";
        echo.classList.add("strand-echo");
        p.parentNode.insertBefore(echo, p); // echoes sit behind the main line
      });
    });
  }
  [
    '[data-chapter="1"] .paths',
    '[data-chapter="4"] .paths.diverge',
    '[data-chapter="7"] .paths.merge',
  ].forEach(enrichPaths);

  drawPaths('[data-chapter="1"] .paths'); // ribbon meeting in the middle
  drawPaths('[data-chapter="4"] .paths.diverge'); // ribbons splitting apart

  /* ---------- 6. converge scene — draw both, then the shared line + dot + heart ---------- */
  const mergeSel = '[data-chapter="7"] .paths.merge';
  const mergePaths = document.querySelectorAll(`${mergeSel} path`);
  mergePaths.forEach((p) => {
    const len = p.getTotalLength();
    p.style.strokeDasharray = len;
    p.style.strokeDashoffset = len;
  });
  const mergeTl = gsap.timeline({
    scrollTrigger: { trigger: mergeSel, start: "top 58%", end: "bottom 42%", scrub: true },
  });
  mergeTl
    .to(`${mergeSel} .path-groom, ${mergeSel} .path-bride`, { strokeDashoffset: 0, ease: "none" })
    .to(`${mergeSel} .path-together`, { strokeDashoffset: 0, ease: "none" })
    .to(`${mergeSel} .merge-dot`, { attr: { r: 12 }, ease: "back.out(2)" });

  gsap.from(".heart-seal svg", {
    scale: 0,
    rotation: -30,
    ease: "back.out(1.7)",
    scrollTrigger: { trigger: ".heart-seal", start: "top 80%", toggleActions: "play none none reverse" },
  });

  /* ---------- 7. LinkedIn "liked your post" notification pops in ---------- */
  gsap.from(".li-toast", {
    y: 24, opacity: 0, scale: 0.85, duration: 0.6, ease: "back.out(2)",
    scrollTrigger: { trigger: ".li-toast", start: "top 88%", toggleActions: "play none none reverse" },
  });
  gsap.fromTo(".li-toast-ic", { scale: 0 }, {
    scale: 1, duration: 0.5, delay: 0.35, ease: "back.out(2.6)",
    scrollTrigger: { trigger: ".li-toast", start: "top 88%", toggleActions: "play none none reverse" },
  });
  // a tiny spark catches fire on the toast's corner right after the like lands
  const sparkTl = gsap.timeline({
    scrollTrigger: { trigger: ".li-toast", start: "top 88%", toggleActions: "play none none reverse" },
  });
  sparkTl
    .set(".li-spark", { opacity: 1 }, 0.6)
    .fromTo(".ls-flame", { scale: 0, transformOrigin: "50% 100%" },
      { scale: 1, duration: 0.5, ease: "back.out(3)" }, 0.6)
    .to(".ls-flame", {
      scaleY: 1.14, scaleX: 0.92, rotation: 3, transformOrigin: "50% 100%",
      duration: 0.32, yoyo: true, repeat: -1, ease: "sine.inOut",
    });
  // ...and little embers keep drifting up off it (visible only once the spark is lit)
  document.querySelectorAll(".li-spark i").forEach((p, i) => {
    gsap.fromTo(p, { x: 0, y: 0, opacity: 0.9 }, {
      x: [-9, 7, 2][i], y: -26 - i * 6, opacity: 0,
      duration: 1.1 + i * 0.25, delay: i * 0.4,
      repeat: -1, repeatDelay: 0.5, ease: "power1.out",
    });
  });

  /* ---------- 8. Instagram DM — typing indicator, then each message ---------- */
  (function igDM() {
    const body = document.querySelector(".ig-body");
    if (!body) return;
    const nodes = Array.from(body.children); // typing, msg, typing, msg, ...
    const tl = gsap.timeline({
      scrollTrigger: { trigger: ".ig-dm", start: "top 68%", toggleActions: "play none none none" },
    });
    for (let i = 0; i < nodes.length; i += 2) {
      const typing = nodes[i];
      const msg = nodes[i + 1];
      if (!msg) break;
      // longer messages "take longer to type"
      const dwell = 1.2 + Math.min(msg.textContent.length / 22, 1.6);
      tl.set(typing, { display: "flex" })
        .fromTo(typing, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.3, ease: "power2.out" })
        .to({}, { duration: dwell })
        .set(typing, { display: "none" })
        .set(msg, { display: "block" })
        .fromTo(msg, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" })
        .to({}, { duration: 0.8 }); // beat after the message lands
    }
  })();

  /* ---------- 9. dim the "silence" chapter background ---------- */
  gsap.to("body", {
    backgroundColor: "#EFE6DA",
    ease: "none",
    scrollTrigger: { trigger: '[data-chapter="4"]', start: "top center", end: "bottom center", scrub: true, toggleActions: "play reverse play reverse" },
  });

  /* ---------- 10. Ken Burns — photos slowly zoom as they scroll through ---------- */
  gsap.utils.toArray(".g-item img, .photo-slot > img, .finale-photo img").forEach((img) => {
    gsap.fromTo(
      img,
      { scale: 1.16 },
      {
        scale: 1,
        ease: "none",
        scrollTrigger: { trigger: img.closest("figure"), start: "top bottom", end: "bottom top", scrub: true },
      }
    );
  });

  /* ---------- 11. gentle depth parallax on each chapter's content ---------- */
  gsap.utils.toArray(".chapter .chapter-body").forEach((body) => {
    gsap.fromTo(
      body,
      { y: 34 },
      {
        y: -34,
        ease: "none",
        scrollTrigger: { trigger: body.closest(".scene"), start: "top bottom", end: "bottom top", scrub: 1 },
      }
    );
  });

  /* ---------- 12. eyebrow / lead lines drift in from the side on scroll ---------- */
  gsap.utils.toArray(".gallery h2, .proposal .eyebrow, .finale .eyebrow").forEach((el) => {
    gsap.fromTo(
      el,
      { letterSpacing: "0.02em", scale: 0.96 },
      {
        letterSpacing: "0.12em",
        scale: 1,
        ease: "none",
        scrollTrigger: { trigger: el, start: "top 90%", end: "top 40%", scrub: 1 },
      }
    );
  });

  /* ---------- 13. inter-chapter dividers — each its own motion ---------- */
  // line + heart draw open
  gsap.utils.toArray(".d-line").forEach((d) => {
    gsap
      .timeline({ scrollTrigger: { trigger: d, start: "top 85%", end: "bottom 55%", scrub: true } })
      .fromTo(d.querySelectorAll(".dl-line"), { width: 0 }, { width: 80, ease: "none" }, 0)
      .fromTo(d.querySelector(".dl-heart"), { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, ease: "back.out(2)" }, 0.15);
  });
  // flowers rotate at different rates
  gsap.utils.toArray(".d-leaves").forEach((d) => {
    d.querySelectorAll(".dv-flower").forEach((leaf, i) => {
      gsap.fromTo(leaf, { rotation: -60 + i * 20 }, {
        rotation: 60 + i * 20, ease: "none",
        scrollTrigger: { trigger: d, start: "top bottom", end: "bottom top", scrub: true },
      });
    });
  });
  // heart blooms open
  gsap.utils.toArray(".d-bloom .db-heart").forEach((h) => {
    gsap.fromTo(h, { scale: 0.2, rotation: -25, opacity: 0.2 }, {
      scale: 1, rotation: 0, opacity: 1, ease: "none",
      scrollTrigger: { trigger: h, start: "top 90%", end: "top 45%", scrub: true },
    });
  });
  // star spins
  gsap.utils.toArray(".d-spin .ds-star").forEach((s) => {
    gsap.fromTo(s, { rotation: 0 }, {
      rotation: 360, ease: "none",
      scrollTrigger: { trigger: s.closest(".divider"), start: "top bottom", end: "bottom top", scrub: true },
    });
  });
  // dots rise in sequence
  gsap.utils.toArray(".d-dots").forEach((d) => {
    gsap.fromTo(d.querySelectorAll("span"), { y: 18, opacity: 0 }, {
      y: 0, opacity: 1, stagger: 0.15, ease: "power2.out",
      scrollTrigger: { trigger: d, start: "top 85%", toggleActions: "play none none reverse" },
    });
  });
  // wave draws itself
  gsap.utils.toArray(".dw-path").forEach((p) => {
    const len = p.getTotalLength();
    p.style.strokeDasharray = len;
    p.style.strokeDashoffset = len;
    gsap.to(p, {
      strokeDashoffset: 0, ease: "none",
      scrollTrigger: { trigger: p.closest(".divider"), start: "top 85%", end: "bottom 55%", scrub: true },
    });
  });
}

/* ---------- proposal video: play while it's in view ---------- */
const proposalVideo = document.querySelector(".proposal-video");
if (proposalVideo) {
  if (reduceMotion) {
    proposalVideo.controls = true; // let the user start it themselves
  } else {
    // Start it once it first comes into view, then let it keep looping — never pause.
    ScrollTrigger.create({
      trigger: ".proposal-media",
      start: "top 90%",
      once: true,
      onEnter: () => proposalVideo.play().catch(() => {}),
    });
  }
}

/* ---------- refresh once fonts/layout settle ---------- */
window.addEventListener("load", () => ScrollTrigger.refresh());
