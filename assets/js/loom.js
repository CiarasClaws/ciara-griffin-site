/* THE LOOM — an ink-and-steel weave of language.
   One deep navy ground, one steel-blue hue. At the left edge the cloth
   itself: a dense warp block the threads escape from. Each thread is a
   running stream of characters — her thesis, fragments of the manifesto,
   this site's own code, binary — drifting rightward like weft unspooling.
   The wordmark is drawn into the field; threads pass over and under it.
   2D canvas, no glow, no dependency. */

const canvas = document.getElementById('loom');
const hero = document.querySelector('.hero');
const heroName = document.querySelector('.hero__name');
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

const ctx = canvas.getContext('2d', { alpha: false });

/* ---- palette: single hue, engraved ---- */
const GROUND_TOP = '#070C17';
const GROUND_BOT = '#04070F';
const CREAM = '#F3EFE7';
/* steel ramp — most strands dim, a few catch light */
function steel(l, a) {
  const r = Math.round(38 + 168 * l);
  const g = Math.round(52 + 170 * l);
  const b = Math.round(78 + 168 * l);
  return `rgba(${r},${g},${b},${a})`;
}

/* ---- what the threads say (her real material) ---- */
const BIN_LOOM = '01001100 01001111 01001111 01001101 '; /* L O O M */
const PROSE = [
  'we create tools and then they create us · ',
  'texere — to weave · ',
  'a press that cannot print the same page twice · ',
  'a net for arguments that deserve better handling than a feed gives them · ',
  'a toolshop for the systems I could not buy · ',
  'a studio with a standing quarrel against minimalism · ',
  'a practice that composes a retinue for one principal at a time · ',
];
const CODE = [
  'const warp = threads[0]; ',
  'for (const weft of ventures) weave(warp, weft); ',
  'y += Math.sin(t * 6.2831 * freq + phase) * amp; ',
  'ctx.fillText(glyph, x, y); ',
  '{ warp: 1, wefts: 5 } ',
  'smoothstep(0.0, 0.14, t); ',
  '@media (prefers-reduced-motion: reduce) ',
  'renderOrder = over ? 3 : 1; ',
];
function digits(seed) {
  let s = '', x = seed;
  for (let i = 0; i < 220; i++) {
    x = (x * 16807) % 2147483647;
    const r = x / 2147483647;
    s += r < 0.42 ? '0' : r < 0.8 ? '1' : r < 0.86 ? '3' : r < 0.92 ? '8' : ' ';
    if (r > 0.975) s += ' ';
  }
  return s;
}
function makeStream(kind, seed) {
  if (kind === 'bin') return digits(seed) + BIN_LOOM + digits(seed + 7);
  if (kind === 'code') {
    const a = CODE[(seed * 3) % CODE.length], b = CODE[(seed * 5 + 1) % CODE.length];
    return digits(seed) + a + digits(seed + 11) + b;
  }
  const p = PROSE[seed % PROSE.length];
  return digits(seed) + p + digits(seed + 3) + PROSE[0];
}

/* ---- strands ---- */
let W = 0, H = 0, dpr = 1, blockW = 0;
let strands = [], warpLines = [], fillers = [];
const mouse = { tx: -1e4, ty: -1e4, x: -1e4, y: -1e4 };
let running = false, visible = true, wovenReady = false, t0 = performance.now();

function rnd(seed) { let x = seed; return () => { x = (x * 16807) % 2147483647; return x / 2147483647; }; }

function build() {
  const isMobile = W < 720;
  blockW = Math.max(56, W * (isMobile ? 0.10 : 0.13));
  const r = rnd(1234);
  strands = [];
  /* strands travel in braided bundles that converge, cross and split */
  const bundles = isMobile
    ? [{ c: 0.24, m: 3 }, { c: 0.5, m: 3 }, { c: 0.76, m: 3 }]
    : [{ c: 0.2, m: 4 }, { c: 0.42, m: 4 }, { c: 0.62, m: 4 }, { c: 0.82, m: 4 }];
  let i = 0;
  for (const b of bundles) {
    const bPh = r() * Math.PI * 2;     /* the bundle travels together */
    const bF = 0.35 + r() * 0.3;
    const bright = Math.floor(r() * b.m); /* one member catches the light */
    for (let k = 0; k < b.m; k++, i++) {
      const kind = i % 5 === 2 ? 'code' : i % 7 === 4 ? 'prose' : 'bin';
      const lum = k === bright ? 0.85 + r() * 0.15 : 0.28 + r() * 0.3;
      strands.push({
        stream: makeStream(kind, 17 + i * 13),
        baseY: (b.c + (k - (b.m - 1) / 2) * 0.035 + (r() - 0.5) * 0.02) * H,
        rowY: (0.05 + 0.9 * (i / (bundles.length * b.m - 1))) * H,
        amp1: H * (isMobile ? 0.03 + r() * 0.04 : 0.045 + r() * 0.05),
        amp2: H * (isMobile ? 0.002 + r() * 0.003 : 0.002 + r() * 0.003),
        f1: bF + (r() - 0.5) * 0.2, f2: 1.6 + r() * 1.0,
        ph: bPh + (r() - 0.5) * 0.9,
        drift: 0.012 + r() * 0.015,   /* near-still at rest; the mouse does the moving */
        flow: (isMobile ? 8 : 11) * (0.5 + r()),
        size: (isMobile ? 9.5 : 11.5) + r() * 2.5,
        lum,
        exitX: blockW * (0.85 + r() * 0.6),
        zf: 0.005 + r() * 0.004, zp: r() * Math.PI * 2,
        runPh: r() * Math.PI * 2,      /* brightness travels along the strand */
      });
    }
  }
  /* warp: the vertical threads of the block */
  warpLines = [];
  const step = isMobile ? 4.5 : 5.5;
  const rw = rnd(77);
  for (let x = 3; x < blockW * 1.08; x += step * (0.8 + rw() * 0.5)) {
    warpLines.push({ x, lum: 0.08 + rw() * 0.3, a: 0.35 + rw() * 0.65 });
  }
  /* fillers: extra strands that live only in and just after the block */
  fillers = [];
  const rf = rnd(303);
  const fn = isMobile ? 8 : 14;
  for (let i = 0; i < fn; i++) {
    fillers.push({
      stream: digits(400 + i * 31),
      rowY: (0.04 + 0.92 * (i / (fn - 1)) + (rf() - 0.5) * 0.03) * H,
      size: 8 + rf() * 2,
      lum: 0.14 + rf() * 0.26,
      reach: blockW * (1.2 + rf() * 1.3),               /* fades out past this */
      flow: 6 + rf() * 6,
      ph: rf() * Math.PI * 2,
    });
  }
}

/* ---- the name, measured from the DOM so fonts/layout stay canonical ---- */
let nameSpec = null;
function measureName() {
  if (!heroName) return;
  const lines = [...heroName.querySelectorAll('.hero__line')];
  if (!lines.length) return;
  const cRect = canvas.getBoundingClientRect();
  const nRect = heroName.getBoundingClientRect();
  if (nRect.width < 10) return;
  const cs = getComputedStyle(heroName);
  nameSpec = {
    font: `${cs.fontWeight} ${parseFloat(cs.fontSize)}px ${cs.fontFamily}`,
    letterSpacing: cs.letterSpacing,
    lines: lines.map((line) => {
      const r = line.getBoundingClientRect();
      return {
        text: line.textContent,
        cx: r.left - cRect.left + r.width / 2,
        by: r.top - cRect.top + r.height * 0.82,
      };
    }),
  };
  if (!wovenReady) { wovenReady = true; hero.classList.add('hero--woven'); }
}
function drawName() {
  if (!nameSpec) return;
  ctx.save();
  ctx.font = nameSpec.font;
  if ('letterSpacing' in ctx) ctx.letterSpacing = nameSpec.letterSpacing;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = CREAM;
  for (const l of nameSpec.lines) ctx.fillText(l.text, l.cx, l.by);
  ctx.restore();
}

/* ---- drawing ---- */
function smooth(a, b, x) { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); }
function jitter(i, ph) { const v = Math.sin(i * 127.1 + ph * 311.7) * 43758.5453; return 0.82 + (v - Math.floor(v)) * 0.36; }

function pathY(s, x, t) {
  const openness = smooth(s.exitX * 0.75, s.exitX * 2.4, x);
  /* inside the block: snapped row + tight interlace zigzag */
  const zig = Math.sin(x * 0.9 + s.ph) * 2.2;
  const wov = s.rowY + zig;
  /* in the open: layered undulation */
  const free =
    s.baseY +
    Math.sin((x / W) * Math.PI * 2 * s.f1 + s.ph + t * s.drift) * s.amp1 +
    Math.sin((x / W) * Math.PI * 2 * s.f2 + s.ph * 1.7 - t * s.drift * 0.6) * s.amp2;
  let y = wov + (free - wov) * openness;
  /* cursor: a gentle push away */
  const dx = x - mouse.x, dy = y - mouse.y;
  const d2 = dx * dx + dy * dy;
  const push = Math.exp(-d2 / 24000) * 34 * openness;
  y += (dy >= 0 ? 1 : -1) * push;
  /* scroll: the field sags and lets go */
  const sc = Math.min(scrollY / Math.max(innerHeight, 1), 1);
  y += sc * sc * 90 * openness;
  return y;
}

function drawStrandPass(s, t, wantFront) {
  const spacing = s.size * (W < 720 ? 0.58 : 0.62);
  const total = Math.ceil((W + 160) / spacing);
  const shift = Math.floor(t * s.flow);
  ctx.font = `400 ${s.size}px "Fragment Mono", monospace`;
  for (let i = 0; i < total; i++) {
    const x = i * spacing - 80;
    if (x < -20 || x > W + 20) continue;
    const z = Math.cos(x * s.zf + s.zp + t * 0.12);
    const front = z >= 0;
    if (front !== wantFront) continue;
    const ci = (i + shift) % s.stream.length;
    const ch = s.stream[ci];
    if (ch === ' ') continue;
    const y = pathY(s, x, t);
    /* interlace shading inside the block; edge fade both ends */
    const weaveShade = x < s.exitX * 1.4 ? 0.7 + 0.3 * Math.abs(Math.sin(x * 0.45 + s.ph)) : 1;
    const run = 0.74 + 0.26 * Math.sin(x * 0.0028 + s.runPh + t * 0.1); /* light travels the strand */
    const env = smooth(-10, 60, x) * (1 - smooth(W * 0.92, W + 10, x));
    let a = s.lum * env * weaveShade * run * jitter(i, s.ph);
    if (x < s.exitX * 1.5) a = Math.max(a, 0.16 * env);  /* the block never goes hollow */
    if (!front) a *= 0.5; /* behind the cloth of the name */
    if (a < 0.015) continue;
    ctx.fillStyle = steel(Math.min(1, s.lum * 1.15 + 0.08), Math.min(0.95, a + 0.08));
    ctx.fillText(ch, x, y);
  }
}

function frame(now) {
  const t = (now - t0) / 1000;
  /* ground */
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, GROUND_TOP);
  g.addColorStop(1, GROUND_BOT);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  /* warp block */
  /* a faint textile panel behind the block, then the warp lines */
  const pg = ctx.createLinearGradient(0, 0, blockW * 1.35, 0);
  pg.addColorStop(0, 'rgba(96,120,160,0.085)');
  pg.addColorStop(0.75, 'rgba(96,120,160,0.03)');
  pg.addColorStop(1, 'rgba(96,120,160,0)');
  ctx.fillStyle = pg;
  ctx.fillRect(0, 0, blockW * 1.35, H);
  for (const w of warpLines) {
    const fray = 1 - (w.x / (blockW * 1.1)) ** 2 * 0.45;
    ctx.fillStyle = steel(w.lum + 0.22, 0.42 * w.a * fray);
    ctx.fillRect(w.x, 0, 1, H);
  }
  /* block-only fillers */
  for (const f of fillers) {
    const spacing = f.size * 0.6;
    ctx.font = `400 ${f.size}px "Fragment Mono", monospace`;
    const shift = Math.floor(t * f.flow);
    for (let x = 2, i = 0; x < f.reach + 40; x += spacing, i++) {
      const fade = 1 - smooth(f.reach * 0.55, f.reach, x);
      if (fade <= 0.02) break;
      const ch = f.stream[(i + shift) % f.stream.length];
      if (ch === ' ') continue;
      const shade = 0.45 + 0.55 * Math.abs(Math.sin(x * 0.5 + f.ph));
      ctx.fillStyle = steel(f.lum + 0.22, (f.lum + 0.1) * fade * shade * 2.3);
      ctx.fillText(ch, x, f.rowY + Math.sin(x * 0.9 + f.ph) * 2);
    }
  }

  /* threads behind the name → the name → threads in front */
  for (const s of strands) drawStrandPass(s, t, false);
  drawName();
  for (const s of strands) drawStrandPass(s, t, true);

  /* quiet vignette */
  const v = ctx.createRadialGradient(W * 0.5, H * 0.46, H * 0.32, W * 0.5, H * 0.55, H * 0.95);
  v.addColorStop(0, 'rgba(3,5,10,0)');
  v.addColorStop(1, 'rgba(3,5,10,0.42)');
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, W, H);
}

function loop(now) {
  if (!visible || document.hidden) { running = false; return; }
  running = true;
  mouse.x += (mouse.tx - mouse.x) * 0.07;
  mouse.y += (mouse.ty - mouse.y) * 0.07;
  frame(now);
  requestAnimationFrame(loop);
}

function resize() {
  dpr = Math.min(devicePixelRatio || 1, 2);
  W = canvas.clientWidth || innerWidth;
  H = canvas.clientHeight || innerHeight;
  canvas.width = Math.round(W * dpr);
  canvas.height = Math.round(H * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  build();
  measureName();
  if (reduced) frame(t0 + 7000);
}

function init() {
  resize();
  addEventListener('resize', () => { clearTimeout(init._rt); init._rt = setTimeout(resize, 160); });

  const fontsReady = document.fonts ? document.fonts.ready : Promise.resolve();
  fontsReady.then(() => requestAnimationFrame(() => {
    measureName();
    if (reduced) frame(t0 + 7000);
  }));

  if (reduced) { frame(t0 + 7000); return; }

  addEventListener('pointermove', (e) => {
    const r = canvas.getBoundingClientRect();
    mouse.tx = e.clientX - r.left;
    mouse.ty = e.clientY - r.top;
  }, { passive: true });

  new IntersectionObserver((entries) => {
    visible = entries[0].isIntersecting;
    if (visible && !running) requestAnimationFrame(loop);
  }).observe(canvas);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && visible && !running) requestAnimationFrame(loop);
  });
  requestAnimationFrame(loop);
}

try { init(); } catch (e) { canvas.remove(); }
