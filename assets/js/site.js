/* THE LOOM — site engine.
   One unbroken thread runs the page; each weft restyles it in its
   brand's own idiom. Registers switch as sections cross the middle. */

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = matchMedia('(pointer: fine)').matches;
const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

/* ---------------- registers ---------------- */

const REGISTERS = {
  master:  { label: 'THE LOOM',                       thread: '#F3EFE7' },
  attcu:   { label: 'WEFT I · AND THEN THEY CREATE US', thread: '#002FA7' },
  sat:     { label: 'WEFT II · SOMETIMES AESTHETIC', thread: '#0F0F0F' },
  en:      { label: 'WEFT III · EPISTEMIC NET',   thread: '#37444E' },
  retinue: { label: 'WEFT IV · THE RETINUE',      thread: '#3D544B' },
  wct:     { label: 'WEFT V · WE CREATE TOOLS', thread: '#CBFF04' },
};
const codaLabel = 'THE SELVEDGE';
const bookLabel = 'THE PATTERN BOOK';
let currentThread = REGISTERS.master.thread;

const navState = $('#navState');
function switchRegister(name, label) {
  const reg = REGISTERS[name] || REGISTERS.master;
  document.body.dataset.register = name;
  document.body.style.setProperty('--thread', reg.thread);
  currentThread = reg.thread;
  if (navState && navState.textContent !== label) {
    navState.classList.add('is-switching');
    setTimeout(() => { navState.textContent = label; navState.classList.remove('is-switching'); }, 170);
  }
}

const regSections = $$('[data-register]');
const regIO = new IntersectionObserver((entries) => {
  for (const e of entries) {
    if (!e.isIntersecting) continue;
    const name = e.target.dataset.register;
    const label = e.target.id === 'selvedge' ? codaLabel
      : e.target.id === 'writing' ? bookLabel
      : (REGISTERS[name] ? REGISTERS[name].label : REGISTERS.master.label);
    switchRegister(name, label);
  }
}, { rootMargin: '-45% 0px -45% 0px', threshold: 0 });
regSections.forEach((s) => regIO.observe(s));

/* ---------------- entrance choreography ---------------- */

$$('.hero__line').forEach((line, li) => {
  $$('span', line).forEach((sp, i) => sp.style.setProperty('--d', `${li * 0.18 + i * 0.045}s`));
});

const REVEAL_SEL = [
  '.manifesto__note', '.manifesto__text', '.manifesto__more',
  '.weft__mark', '.weft__wordmark', '.retinue-caps', '.weft__lede',
  '.wct-cards .wct-card', '.specimen', '.sat-strip', '.weft__exit',
  '.patternbook__title', '.patternbook__lede', '.pb-row',
  '.coda__mark', '.coda__braid', '.coda__thesis', '.coda__contact',
  '.coda__surfaces',
].join(', ');

$$('.manifesto, .weft, .patternbook, .coda').forEach((section) => {
  $$(REVEAL_SEL, section).forEach((el, i) => {
    el.classList.add('reveal');
    el.style.setProperty('--d', `${Math.min(i * 0.09, 0.55)}s`);
  });
});

const revealIO = new IntersectionObserver((entries) => {
  for (const e of entries) {
    if (e.isIntersecting) { e.target.classList.add('is-in'); revealIO.unobserve(e.target); }
  }
}, { rootMargin: '0px 0px -10% 0px', threshold: 0.08 });
$$('.reveal').forEach((el) => revealIO.observe(el));

/* veil release */
function ready() {
  requestAnimationFrame(() => setTimeout(() => document.body.classList.add('is-ready'), 90));
}
Promise.race([document.fonts ? document.fonts.ready : Promise.resolve(), new Promise((r) => setTimeout(r, 1400))]).then(ready);

/* ---------------- the spine — a vertical thread of poetry and code ---------------- */

const fabric = $('.fabric');
const oldSpine = $('.spine');
if (oldSpine) oldSpine.remove();

const SPINE_STREAM = (
  'we create tools and then they create us / for (t of self) weave(t); ' +
  'text and textile share a single root / const loom = new Loom(6); ' +
  'a self is a thing you can hand instructions to / while (becoming) build(); ' +
  'warp of one and weft of five / if (frayed) repair(self); ' +
  'building your way out one system at a time / return me; 0x1801 // '
);
const SPINE_CHARS = SPINE_STREAM.replace(/\s+/g, ' ').split('');

/* each glyph takes the colour of the brand ground it is passing through */
const SPINE_SECTIONS = [
  { id: '#manifesto',               color: '#F3EFE7' },
  { id: '#and-then-they-create-us', color: '#002FA7' },
  { id: '#sometimes-aesthetic',     color: '#0F0F0F' },
  { id: '#epistemic-net',           color: '#37444E' },
  { id: '#the-retinue',             color: '#2E7665' },
  { id: '#we-create-tools',         color: '#111111', accent: '#CBFF04' },
  { id: '#writing',                 color: '#F3EFE7' },
  { id: '#selvedge',                color: '#F3EFE7' },
];

let spineCanvas, sctx, spineGlyphs = [], spineHeight = 0, spineRunning = false, spineVisible = false;
const spineMouse = { x: -9999, y: -9999, active: false };

function catmull(p0, p1, p2, p3, t) {
  const t2 = t * t, t3 = t2 * t;
  return [
    0.5 * ((2 * p1[0]) + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
    0.5 * ((2 * p1[1]) + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3),
  ];
}

function buildSpine() {
  if (!fabric) return;
  if (!spineCanvas) {
    spineCanvas = document.createElement('canvas');
    spineCanvas.className = 'spine-canvas';
    spineCanvas.setAttribute('aria-hidden', 'true');
    document.body.appendChild(spineCanvas);
    sctx = spineCanvas.getContext('2d');
  }
  const W = fabric.clientWidth;
  const narrow = W < 640;
  const off = narrow ? 18 : Math.max(30, Math.min(W * 0.05, 72));
  const L = off, R = W - off, C = W / 2;
  const fabricTop = fabric.getBoundingClientRect().top + scrollY;

  const absTop = (id) => $(id).getBoundingClientRect().top + scrollY;
  const relTop = (id) => absTop(id) - fabricTop;
  const relMid = (id) => { const r = $(id).getBoundingClientRect(); return r.top + scrollY - fabricTop + r.height / 2; };

  const coda = $('#selvedge'), braidEl = $('.coda__braid');
  const braidTop = (coda.getBoundingClientRect().top + scrollY - fabricTop) + braidEl.offsetTop + 10;

  /* the thread hugs the left margin the whole descent (gentle drift only),
     so its stacked letters never cross the centred content; it converges
     to the middle just before the braid */
  const drift = narrow ? 22 : 66;
  const wp = [
    [C, -40],
    [L, relTop('#manifesto') + 150],
    [L + drift, relMid('#and-then-they-create-us')],
    [L, relMid('#sometimes-aesthetic')],
    [L + drift, relMid('#epistemic-net')],
    [L, relMid('#the-retinue')],
    [L + drift, relMid('#we-create-tools')],
    [L, relMid('#writing')],
    [L + drift * 0.5, relTop('#selvedge') + 40],
    [C, braidTop],
  ];

  const poly = [];
  for (let i = 0; i < wp.length - 1; i++) {
    const p0 = wp[Math.max(0, i - 1)], p1 = wp[i], p2 = wp[i + 1], p3 = wp[Math.min(wp.length - 1, i + 2)];
    const steps = 26;
    for (let s = 0; s < steps; s++) poly.push(catmull(p0, p1, p2, p3, s / steps));
  }
  poly.push(wp[wp.length - 1]);
  spineHeight = poly[poly.length - 1][1];

  /* resample the polyline by arc length, one glyph per STEP px */
  const STEP = narrow ? 21 : 25;
  const pts = [];
  let carry = 0;
  for (let i = 1; i < poly.length; i++) {
    const [ax, ay] = poly[i - 1], [bx, by] = poly[i];
    const seg = Math.hypot(bx - ax, by - ay) || 0.001;
    let d = carry;
    while (d < seg) { const tt = d / seg; pts.push([ax + (bx - ax) * tt, ay + (by - ay) * tt]); d += STEP; }
    carry = d - seg;
  }

  const colorAt = (yRel) => {
    const pageY = fabricTop + yRel;
    for (let k = SPINE_SECTIONS.length - 1; k >= 0; k--) {
      if (pageY >= absTop(SPINE_SECTIONS[k].id) - 2) return SPINE_SECTIONS[k];
    }
    return SPINE_SECTIONS[0];
  };

  spineGlyphs = pts.map((pt, i) => {
    const sec = colorAt(pt[1]);
    const color = (sec.accent && i % 6 === 0) ? sec.accent : sec.color;
    return { x: pt[0], pageY: fabricTop + pt[1], ch: SPINE_CHARS[i % SPINE_CHARS.length], color };
  });

  sizeSpineCanvas();
  if (reduced) drawSpineStatic();
  else if (!spineRunning) { spineVisible = true; requestAnimationFrame(drawSpine); }
}

function sizeSpineCanvas() {
  if (!spineCanvas) return;
  const dpr = Math.min(devicePixelRatio || 1, 2);
  spineCanvas.width = Math.round(innerWidth * dpr);
  spineCanvas.height = Math.round(innerHeight * dpr);
  sctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function drawSpineStatic() {
  if (!sctx) return;
  sctx.clearRect(0, 0, innerWidth, innerHeight);
  sctx.textAlign = 'center'; sctx.textBaseline = 'middle';
  for (const g of spineGlyphs) {
    const sy = g.pageY - scrollY;
    if (sy < -30 || sy > innerHeight + 30) continue;
    sctx.font = '15px "JetBrains Mono", monospace';
    sctx.fillStyle = g.color;
    sctx.globalAlpha = 0.92;
    sctx.fillText(g.ch, g.x, sy);
  }
}

function drawSpine() {
  if (!spineVisible || document.hidden) { spineRunning = false; return; }
  spineRunning = true;
  if (!sctx) { requestAnimationFrame(drawSpine); return; }
  const vw = innerWidth, vh = innerHeight;
  sctx.clearRect(0, 0, vw, vh);
  sctx.textAlign = 'center'; sctx.textBaseline = 'middle';
  const tip = scrollY + vh * 0.66;
  const time = performance.now() / 1000;
  const fabricTop = fabric.getBoundingClientRect().top + scrollY;
  const waveY = fabricTop + ((time * 150) % (spineHeight + 300));

  for (const g of spineGlyphs) {
    if (g.pageY > tip) continue;
    const sy = g.pageY - scrollY;
    if (sy < -30 || sy > vh + 30) continue;
    let sx = g.x, scale = 1;

    const dwy = g.pageY - waveY;
    scale += 0.7 * Math.exp(-(dwy * dwy) / (2 * 64 * 64));

    if (spineMouse.active) {
      const dx = sx - spineMouse.x, dy = sy - spineMouse.y;
      const d2 = dx * dx + dy * dy;
      if (d2 < 170 * 170) {
        const infl = Math.exp(-d2 / (2 * 95 * 95));
        scale += 1.7 * infl;
        const d = Math.sqrt(d2) || 1;
        sx += (dx / d) * 42 * infl;
      }
    }

    const fade = clamp((tip - g.pageY) / 70, 0, 1);
    sctx.font = `${(15 * scale).toFixed(1)}px "JetBrains Mono", monospace`;
    sctx.globalAlpha = fade * (scale > 1.1 ? 1 : 0.9);
    if (scale > 1.4) { sctx.shadowColor = g.color; sctx.shadowBlur = 8 * (scale - 1); }
    else { sctx.shadowBlur = 0; }
    sctx.fillStyle = g.color;
    sctx.fillText(g.ch, sx, sy);
  }
  requestAnimationFrame(drawSpine);
}

/* the spine loop is fed by scroll + its own rAF; keep this stub for onScroll */
function updateSpine() {}

if (fabric && !reduced) {
  addEventListener('pointermove', (e) => { spineMouse.x = e.clientX; spineMouse.y = e.clientY; spineMouse.active = true; }, { passive: true });
  document.documentElement.addEventListener('pointerleave', () => { spineMouse.active = false; });
  new IntersectionObserver((es) => {
    spineVisible = es[0].isIntersecting;
    if (spineVisible && !spineRunning) requestAnimationFrame(drawSpine);
  }, { rootMargin: '120px' }).observe(fabric);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && spineVisible && !spineRunning) requestAnimationFrame(drawSpine);
  });
  addEventListener('resize', () => { sizeSpineCanvas(); });
}

/* ---------------- coda braid ---------------- */

const braidCanvas = $('.braid');
const coda = $('#selvedge');
const BRAID_COLORS = ['#E33294', '#CBFF04', '#FF48B4', '#F3EFE7', '#1D49E5', '#2E7665'];
let braidCtx, braidW = 0, braidH = 0, lastBraidP = -1;

function sizeBraid() {
  if (!braidCanvas) return;
  const dpr = Math.min(devicePixelRatio, 2);
  braidW = braidCanvas.clientWidth; braidH = braidCanvas.clientHeight;
  braidCanvas.width = braidW * dpr; braidCanvas.height = braidH * dpr;
  braidCtx = braidCanvas.getContext('2d');
  braidCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  lastBraidP = -1;
  drawBraid(reduced ? 1 : currentBraidP());
}

function currentBraidP() {
  const r = coda.getBoundingClientRect();
  return clamp((innerHeight * 0.9 - r.top) / (innerHeight * 0.75), 0, 1);
}

function drawBraid(p) {
  if (!braidCtx || Math.abs(p - lastBraidP) < 0.004) return;
  lastBraidP = p;
  const w = braidW, h = braidH, cx = w / 2;
  braidCtx.clearRect(0, 0, w, h);
  const N = BRAID_COLORS.length;
  const steps = 110;
  const ease = (v) => 1 - Math.pow(1 - v, 2.4);
  for (let i = 0; i < N; i++) {
    braidCtx.beginPath();
    braidCtx.strokeStyle = BRAID_COLORS[i];
    braidCtx.globalAlpha = i === 3 ? 0.95 : 0.78;
    braidCtx.lineWidth = i === 3 ? 2 : 1.5;
    const x0 = cx + (i - (N - 1) / 2) * (w / (N + 1));
    for (let s = 0; s <= steps * p; s++) {
      const v = s / steps;
      const gather = ease(v);
      const amp = 30 * Math.pow(Math.sin(Math.PI * Math.min(v * 1.12, 1)), 1.4);
      const x = x0 + (cx - x0) * gather + Math.sin(v * Math.PI * 3.2 + (i * Math.PI) / 3) * amp * (1 - v * 0.55);
      const y = v * (h - 8);
      s === 0 ? braidCtx.moveTo(x, y) : braidCtx.lineTo(x, y);
    }
    braidCtx.stroke();
  }
  if (p > 0.985) {
    braidCtx.globalAlpha = 1;
    braidCtx.fillStyle = '#F3EFE7';
    braidCtx.beginPath();
    braidCtx.arc(cx, h - 8, 3.2, 0, Math.PI * 2);
    braidCtx.fill();
  }
  braidCtx.globalAlpha = 1;
}

/* ---------------- scroll pump ---------------- */

let ticking = false;
function onScroll() {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(() => {
    updateSpine();
    if (!reduced) drawBraid(currentBraidP());
    ticking = false;
  });
}
addEventListener('scroll', onScroll, { passive: true });

/* ---------------- the shuttle (cursor) ---------------- */

if (finePointer && !reduced) {
  const shuttle = $('.shuttle');
  const trail = document.createElement('canvas');
  trail.id = 'trail';
  document.body.appendChild(trail);
  const tctx = trail.getContext('2d');
  let pts = [];
  let sx = -100, sy = -100, txp = -100, typ = -100, seen = false;
  let lastMove = 0, trailCleared = false;

  function sizeTrail() {
    const dpr = Math.min(devicePixelRatio, 2);
    trail.width = innerWidth * dpr;
    trail.height = innerHeight * dpr;
    tctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  sizeTrail();
  addEventListener('resize', sizeTrail);

  addEventListener('pointermove', (e) => {
    txp = e.clientX; typ = e.clientY;
    lastMove = performance.now();
    if (!seen) { seen = true; sx = txp; sy = typ; }
    shuttle.style.opacity = 1;
  }, { passive: true });
  document.documentElement.addEventListener('pointerleave', () => {
    shuttle.style.opacity = 0; pts = [];
  });

  (function shuttleLoop() {
    requestAnimationFrame(shuttleLoop);
    /* idle: nothing has moved for a while and the trail is gone */
    if (seen && performance.now() - lastMove > 900) {
      if (!trailCleared) {
        tctx.clearRect(0, 0, innerWidth, innerHeight);
        pts = [];
        trailCleared = true;
      }
      return;
    }
    trailCleared = false;
    sx += (txp - sx) * 0.24;
    sy += (typ - sy) * 0.24;
    shuttle.style.transform = `translate(${sx - 3.5}px, ${sy - 3.5}px)`;
    if (seen) {
      pts.push({ x: sx, y: sy });
      if (pts.length > 26) pts.shift();
    }
    tctx.clearRect(0, 0, innerWidth, innerHeight);
    if (pts.length > 2) {
      for (let i = 1; i < pts.length; i++) {
        tctx.beginPath();
        tctx.moveTo(pts[i - 1].x, pts[i - 1].y);
        tctx.lineTo(pts[i].x, pts[i].y);
        tctx.strokeStyle = currentThread;
        tctx.globalAlpha = (i / pts.length) * 0.4;
        tctx.lineWidth = 1;
        tctx.stroke();
      }
      tctx.globalAlpha = 1;
    }
  })();
}

/* ---------------- epistemic net ---------------- */

const enSection = $('.weft--en');
const enCanvas = $('.en-net');
if (enSection && enCanvas) {
  let ectx, ew = 0, eh = 0, nodes = [], pulses = [], enRunning = false, enVisible = false;
  const pointer = { x: -9999, y: -9999 };
  let lastPulse = 0;

  function sizeEn() {
    const dpr = Math.min(devicePixelRatio, 2);
    const pw = ew, ph = eh;
    ew = enSection.clientWidth; eh = enSection.clientHeight;
    enCanvas.width = ew * dpr; enCanvas.height = eh * dpr;
    ectx = enCanvas.getContext('2d');
    ectx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (nodes.length && pw && ph) {
      /* keep the constellation, rescale it */
      for (const n of nodes) { n.x *= ew / pw; n.y *= eh / ph; }
      return;
    }
    const count = clamp(Math.round((ew * eh) / 26000), 26, 64);
    nodes = Array.from({ length: count }, () => ({
      x: Math.random() * ew, y: Math.random() * eh,
      vx: (Math.random() - 0.5) * 0.16, vy: (Math.random() - 0.5) * 0.16,
    }));
  }

  function drawEn(t) {
    ectx.clearRect(0, 0, ew, eh);
    const R = 130;
    for (const n of nodes) {
      if (!reduced) {
        n.x += n.vx; n.y += n.vy;
        if (n.x < 0 || n.x > ew) n.vx *= -1;
        if (n.y < 0 || n.y > eh) n.vy *= -1;
      }
    }
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i], b = nodes[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        const d2 = dx * dx + dy * dy;
        if (d2 > R * R) continue;
        const d = Math.sqrt(d2);
        const pm = Math.min(
          Math.hypot((a.x + b.x) / 2 - pointer.x, (a.y + b.y) / 2 - pointer.y), 400);
        const wake = 1 - pm / 400;
        ectx.beginPath();
        ectx.moveTo(a.x, a.y); ectx.lineTo(b.x, b.y);
        ectx.strokeStyle = '#37444E';
        ectx.globalAlpha = (1 - d / R) * (0.1 + wake * 0.3);
        ectx.lineWidth = 1;
        ectx.stroke();
      }
    }
    for (const n of nodes) {
      const pd = Math.hypot(n.x - pointer.x, n.y - pointer.y);
      const wake = 1 - Math.min(pd, 320) / 320;
      ectx.beginPath();
      ectx.arc(n.x, n.y, 1.7 + wake * 1.4, 0, Math.PI * 2);
      ectx.fillStyle = '#37444E';
      ectx.globalAlpha = 0.35 + wake * 0.5;
      ectx.fill();
    }
    /* signal pulses along near edges */
    if (!reduced && t - lastPulse > 1700 && nodes.length > 4) {
      const a = nodes[(Math.random() * nodes.length) | 0];
      let best = null, bd = 1e9;
      for (const b of nodes) {
        if (b === a) continue;
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d < bd && d < R) { bd = d; best = b; }
      }
      if (best) { pulses.push({ a, b: best, t0: t }); lastPulse = t; }
    }
    pulses = pulses.filter((p) => t - p.t0 < 900);
    for (const p of pulses) {
      const v = (t - p.t0) / 900;
      const x = p.a.x + (p.b.x - p.a.x) * v;
      const y = p.a.y + (p.b.y - p.a.y) * v;
      ectx.beginPath();
      ectx.arc(x, y, 2.2, 0, Math.PI * 2);
      ectx.fillStyle = '#989F97';
      ectx.globalAlpha = 1 - v;
      ectx.fill();
    }
    ectx.globalAlpha = 1;
  }

  function enLoop(t) {
    if (!enVisible || document.hidden) { enRunning = false; return; }
    enRunning = true;
    drawEn(t || 0);
    if (reduced) { enRunning = false; return; }
    requestAnimationFrame(enLoop);
  }

  enSection.addEventListener('pointermove', (e) => {
    const r = enSection.getBoundingClientRect();
    pointer.x = e.clientX - r.left; pointer.y = e.clientY - r.top;
  }, { passive: true });
  enSection.addEventListener('pointerleave', () => { pointer.x = -9999; pointer.y = -9999; });

  new IntersectionObserver((es) => {
    enVisible = es[0].isIntersecting;
    if (enVisible) {
      if (!ew) sizeEn();
      if (!enRunning) requestAnimationFrame(enLoop);
    }
  }, { rootMargin: '160px' }).observe(enSection);

  addEventListener('resize', () => { if (ew) { sizeEn(); if (reduced) drawEn(0); } });
}

/* ---------------- SAT strip: drag with momentum ---------------- */

const strip = $('.sat-strip');
const track = $('.sat-strip__track');
if (strip && track && finePointer && !matchMedia('(pointer: coarse)').matches) {
  let x = 0, vx = 0, dragging = false, startX = 0, lastX = 0, lastT = 0, raf = null;
  const bounds = () => Math.min(0, strip.clientWidth - track.scrollWidth);

  function apply() { track.style.transform = `translateX(${x}px)`; }

  /* keyboard access to the strip */
  strip.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    x = clamp(x + (e.key === 'ArrowLeft' ? 160 : -160), bounds(), 0);
    apply();
  });
  addEventListener('resize', () => { x = clamp(x, bounds(), 0); apply(); });
  function momentum() {
    if (dragging) return;
    vx *= 0.93;
    x = clamp(x + vx, bounds(), 0);
    apply();
    if (Math.abs(vx) > 0.3) raf = requestAnimationFrame(momentum);
  }

  strip.addEventListener('pointerdown', (e) => {
    dragging = true;
    startX = e.clientX - x; lastX = e.clientX; lastT = performance.now();
    vx = 0;
    if (raf) cancelAnimationFrame(raf);
    strip.classList.add('is-grabbing');
    strip.setPointerCapture(e.pointerId);
  });
  strip.addEventListener('pointermove', (e) => {
    /* drag chip follows always */
    const r = strip.getBoundingClientRect();
    cursorChip.style.left = `${e.clientX - r.left}px`;
    cursorChip.style.top = `${e.clientY - r.top}px`;
    if (!dragging) return;
    const nx = e.clientX - startX;
    x = clamp(nx, bounds(), 0);
    const now = performance.now();
    vx = ((e.clientX - lastX) / Math.max(now - lastT, 1)) * 14;
    lastX = e.clientX; lastT = now;
    apply();
  });
  const release = () => {
    if (!dragging) return;
    dragging = false;
    strip.classList.remove('is-grabbing');
    momentum();
  };
  strip.addEventListener('pointerup', release);
  strip.addEventListener('pointercancel', release);

  const cursorChip = $('.sat-cursor');
  strip.addEventListener('pointerenter', () => strip.classList.add('has-cursor'));
  strip.addEventListener('pointerleave', () => { strip.classList.remove('has-cursor'); release(); });
}

/* ---------------- ATTCU: misregistration + impression ---------------- */

const riso = $('.riso');
function jitterRiso() {
  if (!riso) return;
  const sx = Math.random() > 0.5 ? 1 : -1;
  const sy = Math.random() > 0.5 ? 1 : -1;
  riso.style.setProperty('--riso-x', `${(1.6 + Math.random() * 2.2) * sx}px`);
  riso.style.setProperty('--riso-y', `${(1 + Math.random() * 2) * sy}px`);
}
if (!reduced) {
  jitterRiso();
  riso && riso.closest('h2').addEventListener('pointerenter', jitterRiso);
}

const impression = $('#impression');
if (impression) {
  let n = 1;
  try {
    n = (parseInt(localStorage.getItem('cg-impression'), 10) || 0) + 1;
    localStorage.setItem('cg-impression', n);
  } catch (e) { /* private mode */ }
  impression.textContent = `IMPRESSION Nº ${String(n).padStart(6, '0')}`;
}

/* ---------------- build + rebuild ---------------- */

function buildAll() {
  buildSpine();
  sizeBraid();
}
let rsTimer;
addEventListener('resize', () => { clearTimeout(rsTimer); rsTimer = setTimeout(buildAll, 220); });
addEventListener('load', buildAll);
if (document.fonts) document.fonts.ready.then(buildAll);
buildAll();
