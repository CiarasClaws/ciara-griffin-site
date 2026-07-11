/* THE LOOM — the threads are made of language.
   Flowing lines of poetry and code weave across the void behind the name.
   Waves of magnification travel along each thread so you can read what it
   is spun from. Move the cursor near a thread and it bends away while its
   letters and numbers swell. Her brand colours, WCT's lime and magenta
   leading. Pure 2D canvas, no frameworks. */

const canvas = document.getElementById('loom');
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const ctx = canvas && canvas.getContext('2d');

const POETRY = 'MADE Future X, "Helvetica Neue", sans-serif';
const CODE = 'JetBrains Mono, monospace';

/* brand palette from the live sites; WCT lime + magenta lead */
const THREADS = [
  { y: 0.12, color: '#FF48B4', text: 'for (const thread of self) weave(identity)', font: CODE, weight: 400, size: 15, amp: 0.9, freq: 1.5, speed: 0.16, flow: 10, wave: 0.055, alpha: 0.9 },
  { y: 0.21, color: '#2E7665', text: 'text and textile come down from the same root', font: POETRY, weight: 400, size: 17, amp: 1.1, freq: 1.2, speed: 0.13, flow: 8, wave: 0.05, alpha: 0.92 },
  { y: 0.30, color: '#E33294', text: 'we create tools and then they create us', font: POETRY, weight: 500, size: 22, amp: 1.35, freq: 1.05, speed: 0.11, flow: 7, wave: 0.05, alpha: 1 },
  { y: 0.40, color: '#CBFF04', text: 'const loom = new Loom({ warp: 1, weft: 5 })', font: CODE, weight: 400, size: 19, amp: 1.15, freq: 1.35, speed: 0.15, flow: 9, wave: 0.06, alpha: 1 },
  { y: 0.50, color: '#F3EFE7', text: 'warp of one and weft of five', font: POETRY, weight: 400, size: 16, amp: 0.8, freq: 1.1, speed: 0.1, flow: 6, wave: 0.045, alpha: 0.5 },
  { y: 0.60, color: '#CBFF04', text: 'a self is a thing you can hand instructions to', font: POETRY, weight: 500, size: 21, amp: 1.3, freq: 1.0, speed: 0.12, flow: 7.5, wave: 0.05, alpha: 1 },
  { y: 0.70, color: '#1D49E5', text: 'while (becoming) { build(); repeat() }', font: CODE, weight: 400, size: 18, amp: 1.2, freq: 1.4, speed: 0.14, flow: 9, wave: 0.06, alpha: 0.95 },
  { y: 0.80, color: '#E33294', text: 'the loom remembers the shape of the hand', font: POETRY, weight: 400, size: 18, amp: 1.05, freq: 1.15, speed: 0.12, flow: 7, wave: 0.05, alpha: 0.92 },
  { y: 0.89, color: '#FF6C2F', text: 'export default function me() { return tools }', font: CODE, weight: 400, size: 15, amp: 0.9, freq: 1.55, speed: 0.17, flow: 10, wave: 0.055, alpha: 0.85 },
];

const SEP = '      ·      ';
let w = 0, h = 0, dpr = 1, sizeScale = 1;
let running = false, visible = true, ready = false;
const mouse = { x: -9999, y: -9999, tx: -9999, ty: -9999, active: false };
let t0 = null, scrollP = 0;

function resize() {
  if (!canvas) return;
  w = canvas.clientWidth || innerWidth;
  h = canvas.clientHeight || innerHeight;
  dpr = Math.min(devicePixelRatio || 1, 2);
  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  sizeScale = Math.max(0.62, Math.min(w / 1440, 1.25));
  for (const th of THREADS) measure(th);
}

function measure(th) {
  ctx.font = `${th.weight} ${th.size * sizeScale}px ${th.font}`;
  const unit = th.text + SEP;
  const chars = [];
  let uw = 0;
  for (const ch of unit) {
    const adv = ctx.measureText(ch).width + 0.5;
    chars.push({ ch, adv });
    uw += adv;
  }
  th.chars = chars;
  th.unitW = Math.max(uw, 1);
}

function drawThread(th, time) {
  const H = h;
  const size = th.size * sizeScale;
  const baseY = th.y * H + scrollP * scrollP * 120 * (0.4 + th.y);
  ctx.font = `${th.weight} ${size}px ${th.font}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const scroll = ((time * th.flow * sizeScale) % th.unitW + th.unitW) % th.unitW;
  const wavePos = ((time * th.wave + th.y * 3.1) % 1) * (w + th.unitW) - th.unitW * 0.5;
  const waveSig = w * 0.10 + 40;

  const copies = Math.ceil((w + th.unitW) / th.unitW) + 1;
  const mr = 150, mr2 = mr * mr;

  for (let cpy = 0; cpy < copies; cpy++) {
    let x = -scroll + cpy * th.unitW;
    for (let i = 0; i < th.chars.length; i++) {
      const g = th.chars[i];
      const cx = x + g.adv / 2;
      x += g.adv;
      if (g.ch === ' ') continue;
      if (cx < -30 || cx > w + 30) continue;

      const ph = cx * (th.freq / 200) + th.speed * time * 6.2831;
      let py = baseY + Math.sin(ph) * (th.amp * size);
      const slope = Math.cos(ph) * (th.amp * size) * (th.freq / 200);

      const dwx = cx - wavePos;
      let scale = 1 + 1.15 * Math.exp(-(dwx * dwx) / (2 * waveSig * waveSig));

      let px = cx;
      if (mouse.active) {
        const mdx = px - mouse.x, mdy = py - mouse.y;
        const md2 = mdx * mdx + mdy * mdy;
        if (md2 < mr2 * 4) {
          const infl = Math.exp(-md2 / (2 * mr2));
          scale += 1.5 * infl;
          const md = Math.sqrt(md2) || 1;
          const push = 46 * infl;
          px += (mdx / md) * push;
          py += (mdy / md) * push;
        }
      }

      const big = scale > 1.06;
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(Math.atan(slope) * 0.5);
      ctx.scale(scale, scale);
      ctx.globalAlpha = Math.min(1, th.alpha * (big ? 1 : 0.82));
      if (scale > 1.35) {
        ctx.shadowColor = th.color;
        ctx.shadowBlur = 10 * (scale - 1);
      }
      ctx.fillStyle = th.color;
      ctx.fillText(g.ch, 0, 0);
      ctx.restore();
    }
  }
}

function frame(now) {
  if (!visible || document.hidden) { running = false; return; }
  running = true;
  if (t0 === null) t0 = now;
  const time = (now - t0) / 1000;
  mouse.x += (mouse.tx - mouse.x) * 0.2;
  mouse.y += (mouse.ty - mouse.y) * 0.2;
  scrollP = Math.min(scrollY / Math.max(innerHeight, 1), 1);
  ctx.clearRect(0, 0, w, h);
  for (const th of THREADS) drawThread(th, time);
  requestAnimationFrame(frame);
}

function staticFrame() {
  ctx.clearRect(0, 0, w, h);
  for (const th of THREADS) drawThread(th, th.y * 6);
}

function whenFontsReady() {
  const need = ['16px "MADE Future X"', '16px "JetBrains Mono"'];
  const load = document.fonts
    ? Promise.all(need.map((f) => document.fonts.load(f).catch(() => {}))).then(() => document.fonts.ready)
    : Promise.resolve();
  load.then(() => {
    ready = true;
    resize();
    if (reduced) staticFrame();
    else if (!running) requestAnimationFrame(frame);
  });
}

if (canvas && ctx) {
  resize();
  addEventListener('resize', () => { resize(); if (reduced && ready) staticFrame(); });

  if (!reduced) {
    addEventListener('pointermove', (e) => {
      const r = canvas.getBoundingClientRect();
      mouse.tx = e.clientX - r.left;
      mouse.ty = e.clientY - r.top;
      if (!mouse.active) { mouse.x = mouse.tx; mouse.y = mouse.ty; }
      mouse.active = true;
    }, { passive: true });
    addEventListener('pointerleave', () => { mouse.active = false; });

    new IntersectionObserver((es) => {
      visible = es[0].isIntersecting;
      if (visible && ready && !running) requestAnimationFrame(frame);
    }).observe(canvas);
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && visible && ready && !running) requestAnimationFrame(frame);
    });
  }

  whenFontsReady();
}
