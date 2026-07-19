/* A sparse drift of character-threads over the opening film — the site's
   digital thread ghosting across the real machine. Deliberately quiet:
   six strands, no warp block, half the hero's luminance. */

const wrap = document.querySelector('.firstmachine__filmframe');
const film = document.querySelector('.firstmachine__film');
if (wrap && film) {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canvas = document.createElement('canvas');
  canvas.className = 'firstmachine__threads';
  canvas.setAttribute('aria-hidden', 'true');
  wrap.insertBefore(canvas, film.nextSibling);
  const ctx = canvas.getContext('2d');

  /* the machine runs alone first; the digital thread arrives a few beats in */
  canvas.style.opacity = '0';
  canvas.style.transition = 'opacity 2.4s ease';
  let arrived = false;
  const arrive = (delay) => {
    if (arrived) return;
    arrived = true;
    setTimeout(() => { canvas.style.opacity = '1'; }, delay);
  };
  if (reduced) arrive(400);
  else {
    film.addEventListener('playing', () => arrive(3200), { once: true });
    setTimeout(() => arrive(1200), 5000); /* fallback if autoplay is blocked */
  }

  let W = 0, H = 0, strands = [], running = false, visible = true;
  const t0 = performance.now();

  function rnd(seed) { let x = seed; return () => { x = (x * 16807) % 2147483647; return x / 2147483647; }; }
  function digits(seed) {
    let s = '', x = seed;
    for (let i = 0; i < 240; i++) {
      x = (x * 16807) % 2147483647;
      const r = x / 2147483647;
      s += r < 0.44 ? '0' : r < 0.84 ? '1' : r < 0.9 ? '3' : r < 0.96 ? '8' : ' ';
    }
    return s;
  }
  const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

  function build() {
    const r = rnd(517);
    const n = W < 720 ? 4 : 6;
    strands = [];
    for (let i = 0; i < n; i++) {
      strands.push({
        stream: digits(31 + i * 17),
        baseY: (0.14 + 0.72 * (i / (n - 1)) + (r() - 0.5) * 0.05) * H,
        amp: H * (0.05 + r() * 0.06),
        f: 0.4 + r() * 0.3,
        ph: r() * Math.PI * 2,
        drift: 0.015 + r() * 0.02,
        flow: 9 * (0.5 + r()),
        size: (W < 720 ? 9 : 11) + r() * 2,
        lum: i === 2 ? 0.68 : 0.24 + r() * 0.18,
      });
    }
  }

  function frame(now) {
    const t = (now - t0) / 1000;
    ctx.clearRect(0, 0, W, H);
    for (const s of strands) {
      const spacing = s.size * 0.62;
      const shift = Math.floor(t * s.flow);
      ctx.font = `400 ${s.size}px "Fragment Mono", monospace`;
      for (let i = 0, x = -40; x < W + 40; x += spacing, i++) {
        const ch = s.stream[(i + shift) % s.stream.length];
        if (ch === ' ') continue;
        const y = s.baseY
          + Math.sin((x / W) * Math.PI * 2 * s.f + s.ph + t * s.drift) * s.amp
          + Math.sin((x / W) * Math.PI * 2 * s.f * 2.3 + s.ph * 1.7) * s.amp * 0.12;
        const env = smooth(-10, 80, x) * (1 - smooth(W * 0.9, W + 10, x));
        const a = s.lum * env;
        if (a < 0.02) continue;
        ctx.fillStyle = `rgba(196,213,236,${Math.min(0.75, a)})`;
        ctx.fillText(ch, x, y);
      }
    }
  }

  function loop(now) {
    if (!visible || document.hidden) { running = false; return; }
    running = true;
    frame(now);
    requestAnimationFrame(loop);
  }

  function resize() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    W = wrap.clientWidth; H = film.clientHeight;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    build();
    if (reduced) frame(t0 + 5000);
  }

  resize();
  addEventListener('resize', () => { clearTimeout(resize._t); resize._t = setTimeout(resize, 180); });
  if (!reduced) {
    new IntersectionObserver((es) => {
      visible = es[0].isIntersecting;
      if (visible && !running) requestAnimationFrame(loop);
    }).observe(canvas);
    requestAnimationFrame(loop);
  }
}
