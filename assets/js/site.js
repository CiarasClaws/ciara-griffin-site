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
  retinue: { label: 'WEFT I · THE RETINUE',      thread: '#3D544B' },
  en:      { label: 'WEFT II · EPISTEMIC NET',   thread: '#37444E' },
  wct:     { label: 'WEFT III · WE CREATE TOOLS', thread: '#CBFF04' },
  sat:     { label: 'WEFT IV · SOMETIMES AESTHETIC', thread: '#0F0F0F' },
  attcu:   { label: 'WEFT V · AND THEN THEY CREATE US', thread: '#002FA7' },
};
const codaLabel = 'THE SELVEDGE';
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
  '.manifesto__note', '.manifesto__text',
  '.weft__mark', '.weft__wordmark', '.retinue-caps', '.weft__lede',
  '.wct-cards .wct-card', '.specimen', '.sat-strip', '.weft__exit',
  '.coda__mark', '.coda__braid', '.coda__thesis', '.coda__contact',
  '.coda__surfaces',
].join(', ');

$$('.manifesto, .weft, .coda').forEach((section) => {
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

/* ---------------- the spine ---------------- */

const fabric = $('.fabric');
const spine = $('.spine');
let legs = [];

const fmt = (n) => Math.round(n * 10) / 10;

function buildSpine() {
  if (!fabric || !spine) return;
  spine.innerHTML = '';
  legs = [];

  const W = fabric.clientWidth;
  const H = fabric.scrollHeight;
  spine.setAttribute('viewBox', `0 0 ${W} ${H}`);
  spine.setAttribute('width', W);
  spine.setAttribute('height', H);

  const narrow = W < 640;
  const off = narrow ? 14 : Math.max(26, Math.min(W * 0.045, 64));
  const L = off, R = W - off;

  const sec = (id) => {
    const el = $(id);
    return { top: el.offsetTop, bot: el.offsetTop + el.offsetHeight, el };
  };
  const man = sec('#manifesto');
  const ret = sec('#the-retinue');
  const en = sec('#epistemic-net');
  const wct = sec('#we-create-tools');
  const sat = sec('#sometimes-aesthetic');
  const attcu = sec('#and-then-they-create-us');
  const coda = sec('#selvedge');
  const braidEl = $('.coda__braid');
  const braidY = coda.top + braidEl.offsetTop + 8;

  const inset = (s) => Math.min(130, (s.bot - s.top) * 0.14);

  const NS = 'http://www.w3.org/2000/svg';
  const defs = document.createElementNS(NS, 'defs');
  spine.appendChild(defs);
  let gradN = 0;
  /* the thread dips into the next section's dye as it crosses the seam */
  function dyeGradient(from, to, y1, y2, fromOp = 1, toOp = 1) {
    const g = document.createElementNS(NS, 'linearGradient');
    g.id = `dye${gradN++}`;
    g.setAttribute('gradientUnits', 'userSpaceOnUse');
    g.setAttribute('x1', 0); g.setAttribute('x2', 0);
    g.setAttribute('y1', y1); g.setAttribute('y2', y2);
    for (const [off, col, op] of [[0, from, fromOp], [1, to, toOp]]) {
      const s = document.createElementNS(NS, 'stop');
      s.setAttribute('offset', off);
      s.setAttribute('stop-color', col);
      s.setAttribute('stop-opacity', op);
      g.appendChild(s);
    }
    defs.appendChild(g);
    return `url(#${g.id})`;
  }
  function addPath(d, stroke, width, extra = {}) {
    const p = document.createElementNS(NS, 'path');
    p.setAttribute('d', d);
    p.setAttribute('stroke', stroke);
    p.setAttribute('stroke-width', width);
    if (extra.opacity) p.setAttribute('opacity', extra.opacity);
    if (extra.transform) p.setAttribute('transform', extra.transform);
    spine.appendChild(p);
    return p;
  }
  function addNode(x, y, fill) {
    const c = document.createElementNS(NS, 'circle');
    c.setAttribute('cx', x); c.setAttribute('cy', y); c.setAttribute('r', 2.6);
    c.setAttribute('fill', fill);
    c.dataset.y = y;
    c.style.opacity = 0;
    c.style.transition = 'opacity .5s ease';
    spine.appendChild(c);
    return c;
  }
  const cross = (x0, y0, x1, y1) => {
    const g = (y1 - y0) * 0.55;
    return `C ${fmt(x0)},${fmt(y0 + g)} ${fmt(x1)},${fmt(y1 - g)} ${fmt(x1)},${fmt(y1)}`;
  };
  function leg(paths, y0, y1, nodes = []) { legs.push({ paths, y0, y1, nodes }); }

  /* smooth in-section run with one lateral bulge, vertical tangents both ends */
  const bulgeRun = (x, y0, y1, bx) => {
    const my = (y0 + y1) / 2, dy = y1 - y0;
    return ` C ${fmt(x)},${fmt(y0 + dy * 0.35)} ${fmt(x - bx)},${fmt(my - dy * 0.12)} ${fmt(x - bx)},${fmt(my)}`
      + ` C ${fmt(x - bx)},${fmt(my + dy * 0.12)} ${fmt(x)},${fmt(y1 - dy * 0.35)} ${fmt(x)},${fmt(y1)}`;
  };

  /* 0 — straight drop from the hero cue, then into the manifesto margin, cream */
  {
    const x = narrow ? L : L + 4;
    const entry = man.top + Math.max(200, (man.bot - man.top) * 0.24);
    const drop = 64;
    const d = `M ${fmt(W / 2)},-30 L ${fmt(W / 2)},${drop} ${cross(W / 2, drop, x, entry)} L ${fmt(x)},${fmt(man.bot - inset(man))}`;
    leg([addPath(d, 'rgba(243,239,231,.55)', 1.5)], 0, man.bot - inset(man));
  }

  /* I — cross to the right, one slow curve. the retinue */
  {
    const e = inset(ret);
    const x = narrow ? L : R;
    const px = narrow ? L : L + 4;
    const d = `M ${fmt(px)},${fmt(man.bot - inset(man))} ${cross(px, man.bot - inset(man), x, ret.top + e)}`
      + bulgeRun(x, ret.top + e, ret.bot - e, narrow ? 4 : 26);
    const dye = dyeGradient('#F3EFE7', '#3D544B', man.bot - inset(man), ret.top + e, .55, .8);
    leg([addPath(d, dye, 1.5)], man.bot - inset(man), ret.bot - e);
  }

  /* II — hop node to node, the net */
  {
    const e = inset(en);
    const x = narrow ? L : L;
    const px = narrow ? L : R;
    const y0 = en.top + e, y1 = en.bot - e;
    const offs = narrow ? [0, 7, -5, 8, 0] : [0, 26, -18, 30, 0];
    const fr = [0, 0.25, 0.5, 0.75, 1];
    let d = `M ${fmt(px)},${fmt(ret.bot - inset(ret))} ${cross(px, ret.bot - inset(ret), x + offs[0], y0)}`;
    const nodes = [];
    for (let k = 1; k < fr.length; k++) {
      const nx = x + offs[k], ny = y0 + (y1 - y0) * fr[k];
      d += ` L ${fmt(nx)},${fmt(ny)}`;
      if (k < fr.length - 1) nodes.push(addNode(nx, ny, '#37444E'));
    }
    const dye = dyeGradient('#3D544B', '#37444E', ret.bot - inset(ret), y0, .8, .8);
    leg([addPath(d, dye, 1.5)], ret.bot - inset(ret), y1, nodes);
  }

  /* III — zigzag stitch, lime over black. the toolshop */
  {
    const e = inset(wct);
    const x = narrow ? L : R;
    const px = narrow ? L : L;
    const y0 = wct.top + e, y1 = wct.bot - e;
    const amp = narrow ? 4 : 8;
    let d = `M ${fmt(px)},${fmt(en.bot - inset(en))} ${cross(px, en.bot - inset(en), x, y0)}`;
    const step = 26;
    let k = 0;
    for (let y = y0 + step; y < y1; y += step, k++) d += ` L ${fmt(x + (k % 2 ? -amp : amp))},${fmt(y)}`;
    d += ` L ${fmt(x)},${fmt(y1)}`;
    const under = addPath(d, dyeGradient('#37444E', '#000', en.bot - inset(en), y0, .85, .9), 3);
    const over = addPath(d, dyeGradient('#37444E', '#CBFF04', en.bot - inset(en), y0, 0, 1), 1.5);
    leg([under, over], en.bot - inset(en), y1);
  }

  /* IV — right-angle mono routing, dead straight. the studio */
  {
    const e = inset(sat);
    const x = narrow ? L : L;
    const px = narrow ? L : R;
    const y0 = sat.top + e, y1 = sat.bot - e;
    const jogY = y0 - Math.min(60, inset(wct));
    let d = `M ${fmt(px)},${fmt(wct.bot - inset(wct))} L ${fmt(px)},${fmt(jogY)} L ${fmt(x)},${fmt(jogY)} L ${fmt(x)},${fmt(y1)}`;
    const dye = dyeGradient('#CBFF04', '#0F0F0F', wct.bot - inset(wct), y0, .9, .85);
    leg([addPath(d, dye, 1.5)], wct.bot - inset(wct), y1);
  }

  /* V — IKB with a misregistered pink ghost. the press */
  {
    const e = inset(attcu);
    const x = narrow ? L : R;
    const px = narrow ? L : L;
    const y0 = attcu.top + e, y1 = attcu.bot - e;
    const d = `M ${fmt(px)},${fmt(sat.bot - inset(sat))} ${cross(px, sat.bot - inset(sat), x, y0)}`
      + bulgeRun(x, y0, y1, narrow ? 4 : 22);
    const ghost = addPath(d, dyeGradient('#FF48B4', '#FF48B4', sat.bot - inset(sat), y0, 0, .65), 1.5, { transform: 'translate(2.5,-2)' });
    const ink = addPath(d, dyeGradient('#0F0F0F', '#002FA7', sat.bot - inset(sat), y0, .85, .9), 1.5);
    leg([ghost, ink], sat.bot - inset(sat), y1);
  }

  /* VI — home, into the braid */
  {
    const px = narrow ? L : R;
    const d = `M ${fmt(px)},${fmt(attcu.bot - inset(attcu))} ${cross(px, attcu.bot - inset(attcu), W / 2, braidY)}`;
    const dye = dyeGradient('#002FA7', '#F3EFE7', attcu.bot - inset(attcu), coda.top + 60, .9, .6);
    leg([addPath(d, dye, 1.5)], attcu.bot - inset(attcu), braidY);
  }

  for (const l of legs) {
    for (const p of l.paths) {
      const len = p.getTotalLength();
      p.dataset.len = len;
      p.setAttribute('stroke-dasharray', len);
      p.setAttribute('stroke-dashoffset', reduced ? 0 : len);
    }
    if (reduced) l.nodes.forEach((n) => { n.style.opacity = .75; });
  }
  updateSpine();
}

let fabricTop = 0;
function updateSpine() {
  if (reduced || !legs.length) return;
  fabricTop = fabric.getBoundingClientRect().top + scrollY;
  const tip = scrollY + innerHeight * 0.62 - fabricTop;
  for (const l of legs) {
    const p = clamp((tip - l.y0) / (l.y1 - l.y0), 0, 1);
    for (const path of l.paths) {
      path.setAttribute('stroke-dashoffset', (path.dataset.len * (1 - p)).toFixed(1));
    }
    for (const n of l.nodes) n.style.opacity = tip > +n.dataset.y ? .75 : 0;
  }
}

/* ---------------- coda braid ---------------- */

const braidCanvas = $('.braid');
const coda = $('#selvedge');
const BRAID_COLORS = ['#6FA08A', '#5C7284', '#CBFF04', '#F3EFE7', '#FF6347', '#2E5BFF'];
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
