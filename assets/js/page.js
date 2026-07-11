/* Subpage engine: shuttle cursor, reveals, and the margin thread.
   The loom's grammar, travelling with you into the inner rooms. */

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = matchMedia('(pointer: fine)').matches;
const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

const threadColor = document.body.dataset.thread || '#F3EFE7';
document.body.style.setProperty('--thread', threadColor);

/* ---------------- reveals ---------------- */

const REVEAL_SEL = [
  '.page__mark', '.book__title', '.book__lede', '.about__title',
  '.about__body p', '.about__facts div', '.draft__title', '.draft__stitch',
  '.draft__standfirst', '.draft__body > *', '.draft__note', '.draft__knot',
  '.patternbook__rows .pb-row', '.page__foot',
].join(', ');

$$(REVEAL_SEL).forEach((el, i) => {
  el.classList.add('reveal');
  el.style.setProperty('--d', `${Math.min(i * 0.05, 0.4)}s`);
});
const revealIO = new IntersectionObserver((entries) => {
  for (const e of entries) {
    if (e.isIntersecting) { e.target.classList.add('is-in'); revealIO.unobserve(e.target); }
  }
}, { rootMargin: '0px 0px -6% 0px', threshold: 0.05 });
$$('.reveal').forEach((el) => {
  const r = el.getBoundingClientRect();
  /* anything already in view or above reveals immediately */
  if (r.top < innerHeight * 0.9) el.classList.add('is-in');
  else revealIO.observe(el);
});

/* ---------------- margin thread (not on drafts: they have a selvedge) ---------------- */

const page = $('.page');
if (page && !page.classList.contains('page--draft')) {
  const NS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('class', 'spine');
  svg.setAttribute('aria-hidden', 'true');
  page.style.position = 'relative';
  page.appendChild(svg);
  let path, len;

  function build() {
    const W = page.clientWidth;
    const H = page.scrollHeight;
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.setAttribute('width', W);
    svg.setAttribute('height', H);
    svg.innerHTML = '';
    const x = W < 640 ? 14 : Math.max(26, Math.min(W * 0.045, 64));
    const d = `M ${W / 2},-30 L ${W / 2},64 C ${W / 2},${64 + 90} ${x},${140} ${x},${230} L ${x},${H - 120}`;
    path = document.createElementNS(NS, 'path');
    path.setAttribute('d', d);
    path.setAttribute('stroke', threadColor === '#F3EFE7' ? 'rgba(243,239,231,.5)' : threadColor);
    path.setAttribute('stroke-width', 1.5);
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke-linecap', 'round');
    svg.appendChild(path);
    len = path.getTotalLength();
    path.setAttribute('stroke-dasharray', len);
    path.setAttribute('stroke-dashoffset', reduced ? 0 : len);
    update();
  }
  function update() {
    if (reduced || !path) return;
    const top = page.getBoundingClientRect().top + scrollY;
    const tip = scrollY + innerHeight * 0.7 - top;
    const p = clamp(tip / (page.scrollHeight - 60), 0, 1);
    path.setAttribute('stroke-dashoffset', (len * (1 - p)).toFixed(1));
  }
  let ticking = false;
  addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { update(); ticking = false; });
  }, { passive: true });
  let rs;
  addEventListener('resize', () => { clearTimeout(rs); rs = setTimeout(build, 200); });
  addEventListener('load', build);
  if (document.fonts) document.fonts.ready.then(build);
  build();
}

/* ---------------- shuttle ---------------- */

if (finePointer && !reduced) {
  const shuttle = $('.shuttle');
  if (shuttle) {
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
          tctx.strokeStyle = threadColor;
          tctx.globalAlpha = (i / pts.length) * 0.4;
          tctx.lineWidth = 1;
          tctx.stroke();
        }
        tctx.globalAlpha = 1;
      }
    })();
  }
}
