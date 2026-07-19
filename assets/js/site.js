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
  '.firstmachine__caption',
  '.coda__mark', '.coda__contact',
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

/* ---------------- the spine ---------------- */
/* One thread of language runs from the loom down the whole page.
   The spine is the hero's threads continued: a stream of characters
   (binary, digits, the thesis) set along the journey path in the same
   steel-blue — light steel on ink grounds, deep steel on the brand
   whites. It reveals downward as you scroll. */

const fabric = $('.fabric');
const spine = $('.spine');
let legs = [];

const fmt = (n) => Math.round(n * 10) / 10;

/* steel on dark grounds / steel on light grounds */
const STEEL_ON_DARK = 'rgba(158,178,210,.78)';
const STEEL_ON_LIGHT = 'rgba(56,78,114,.82)';

/* the spine's stream — mostly digits, the thesis surfacing now and then */
function spineStream(chars, seed) {
  const WORDS = ' we create tools and they create us \u00b7 ';
  const TEX = ' texere \u00b7 ';
  let out = '', x = seed;
  while (out.length < chars) {
    x = (x * 16807) % 2147483647;
    const r = x / 2147483647;
    if (r > 0.992) out += TEX;
    else if (r > 0.982) out += WORDS;
    else if (r > 0.972) out += ' ';
    else out += r < 0.45 ? '0' : r < 0.86 ? '1' : r < 0.92 ? '3' : '8';
  }
  return out;
}

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
  const attcu = sec('#and-then-they-create-us');
  const sat = sec('#sometimes-aesthetic');
  const en = sec('#epistemic-net');
  const ret = sec('#the-retinue');
  const wct = sec('#we-create-tools');
  const book = sec('#writing');
  const coda = sec('#selvedge');
  const thesisEl = $('.coda__thesis');
  const thesisY = coda.top + thesisEl.offsetTop;
  const thesisW = thesisEl.offsetWidth;

  const inset = (s) => Math.min(130, (s.bot - s.top) * 0.14);

  const NS = 'http://www.w3.org/2000/svg';
  const defs = document.createElementNS(NS, 'defs');
  spine.appendChild(defs);
  let legN = 0;

  /* a leg = its path in defs + a character run along it + a scroll clip */
  function textLeg(d, y0, y1, steel, nodes = []) {
    const id = `spineleg${legN++}`;
    const path = document.createElementNS(NS, 'path');
    path.id = id;
    path.setAttribute('d', d);
    path.setAttribute('fill', 'none');
    defs.appendChild(path);

    const clip = document.createElementNS(NS, 'clipPath');
    clip.id = `${id}c`;
    clip.setAttribute('clipPathUnits', 'userSpaceOnUse');
    const rect = document.createElementNS(NS, 'rect');
    rect.setAttribute('x', 0);
    rect.setAttribute('width', W);
    rect.setAttribute('y', y0 - 70);
    rect.setAttribute('height', reduced ? (y1 - y0) + 140 : 0);
    clip.appendChild(rect);
    defs.appendChild(clip);

    const text = document.createElementNS(NS, 'text');
    text.setAttribute('clip-path', `url(#${id}c)`);
    text.setAttribute('fill', steel);
    text.setAttribute('font-family', '"Fragment Mono", monospace');
    text.setAttribute('font-size', narrow ? '8.5' : '9.5');
    text.setAttribute('letter-spacing', '1.5');
    const tp = document.createElementNS(NS, 'textPath');
    tp.setAttribute('href', `#${id}`);
    /* enough characters to cover the path */
    const len = (() => { const m = document.createElementNS(NS, 'path'); m.setAttribute('d', d); spine.appendChild(m); const l = m.getTotalLength(); m.remove(); return l; })();
    tp.textContent = spineStream(Math.ceil(len / 7) + 8, 29 + legN * 17);
    text.appendChild(tp);
    spine.appendChild(text);

    legs.push({ rect, y0, y1, span: (y1 - y0) + 140, nodes });
  }
  function addNode(x, y, fill) {
    const c = document.createElementNS(NS, 'circle');
    c.setAttribute('cx', x); c.setAttribute('cy', y); c.setAttribute('r', 2.4);
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

  /* smooth in-section run with one lateral bulge, vertical tangents both ends */
  const bulgeRun = (x, y0, y1, bx) => {
    const my = (y0 + y1) / 2, dy = y1 - y0;
    return ` C ${fmt(x)},${fmt(y0 + dy * 0.35)} ${fmt(x - bx)},${fmt(my - dy * 0.12)} ${fmt(x - bx)},${fmt(my)}`
      + ` C ${fmt(x - bx)},${fmt(my + dy * 0.12)} ${fmt(x)},${fmt(y1 - dy * 0.35)} ${fmt(x)},${fmt(y1)}`;
  };

  /* 0 — straight drop from the hero cue into the manifesto margin (ink ground) */
  {
    const x = narrow ? L : L + 4;
    const entry = man.top + Math.max(200, (man.bot - man.top) * 0.24);
    const drop = 64;
    const d = `M ${fmt(W / 2)},-30 L ${fmt(W / 2)},${drop} ${cross(W / 2, drop, x, entry)} L ${fmt(x)},${fmt(man.bot - inset(man))}`;
    textLeg(d, 0, man.bot - inset(man), STEEL_ON_DARK);
  }

  /* I — the press (light ground) */
  {
    const e = inset(attcu);
    const x = narrow ? L : R;
    const px = narrow ? L : L + 4;
    const y0 = attcu.top + e, y1 = attcu.bot - e;
    const d = `M ${fmt(px)},${fmt(man.bot - inset(man))} ${cross(px, man.bot - inset(man), x, y0)}`
      + bulgeRun(x, y0, y1, narrow ? 4 : 22);
    textLeg(d, man.bot - inset(man), y1, STEEL_ON_LIGHT);
  }

  /* II — right-angle routing, dead straight. the studio (light ground) */
  {
    const e = inset(sat);
    const x = narrow ? L : L;
    const px = narrow ? L : R;
    const y0 = sat.top + e, y1 = sat.bot - e;
    const jogY = y0 - Math.min(60, inset(attcu));
    const d = `M ${fmt(px)},${fmt(attcu.bot - inset(attcu))} L ${fmt(px)},${fmt(jogY)} L ${fmt(x)},${fmt(jogY)} L ${fmt(x)},${fmt(y1)}`;
    textLeg(d, attcu.bot - inset(attcu), y1, STEEL_ON_LIGHT);
  }

  /* III — hop node to node, the net (light ground) */
  {
    const e = inset(en);
    const x = narrow ? L : R;
    const px = narrow ? L : L;
    const y0 = en.top + e, y1 = en.bot - e;
    const offs = narrow ? [0, -7, 5, -8, 0] : [0, -26, 18, -30, 0];
    const fr = [0, 0.25, 0.5, 0.75, 1];
    let d = `M ${fmt(px)},${fmt(sat.bot - inset(sat))} ${cross(px, sat.bot - inset(sat), x + offs[0], y0)}`;
    const nodes = [];
    for (let k = 1; k < fr.length; k++) {
      const nx = x + offs[k], ny = y0 + (y1 - y0) * fr[k];
      d += ` L ${fmt(nx)},${fmt(ny)}`;
      if (k < fr.length - 1) nodes.push(addNode(nx, ny, STEEL_ON_LIGHT));
    }
    textLeg(d, sat.bot - inset(sat), y1, STEEL_ON_LIGHT, nodes);
  }

  /* IV — cross back left, one slow curve. the retinue (light ground) */
  {
    const e = inset(ret);
    const x = narrow ? L : L;
    const px = narrow ? L : R;
    const d = `M ${fmt(px)},${fmt(en.bot - inset(en))} ${cross(px, en.bot - inset(en), x, ret.top + e)}`
      + bulgeRun(x, ret.top + e, ret.bot - e, narrow ? -4 : -26);
    textLeg(d, en.bot - inset(en), ret.bot - e, STEEL_ON_LIGHT);
  }

  /* V — zigzag stitch. the toolshop (light ground) */
  {
    const e = inset(wct);
    const x = narrow ? L : R;
    const px = narrow ? L : L;
    const y0 = wct.top + e, y1 = wct.bot - e;
    const amp = narrow ? 4 : 8;
    let d = `M ${fmt(px)},${fmt(ret.bot - inset(ret))} ${cross(px, ret.bot - inset(ret), x, y0)}`;
    const step = 26;
    let k = 0;
    for (let y = y0 + step; y < y1; y += step, k++) d += ` L ${fmt(x + (k % 2 ? -amp : amp))},${fmt(y)}`;
    d += ` L ${fmt(x)},${fmt(y1)}`;
    textLeg(d, ret.bot - inset(ret), y1, STEEL_ON_LIGHT);
  }

  /* VI — into the pattern book (ink ground) */
  {
    const e = inset(book);
    const x = narrow ? L : L + 4;
    const px = narrow ? L : R;
    const y0 = book.top + e, y1 = book.bot - e;
    const d = `M ${fmt(px)},${fmt(wct.bot - inset(wct))} ${cross(px, wct.bot - inset(wct), x, y0)} L ${fmt(x)},${fmt(y1)}`;
    textLeg(d, wct.bot - inset(wct), y1, STEEL_ON_DARK);
  }

  /* VII — home: the thread descends and cascades into the sentence */
  {
    const px = narrow ? L : L + 4;
    const fanY = thesisY - Math.min(200, thesisY - book.bot + 60);  /* where the delta begins */
    const d = `M ${fmt(px)},${fmt(book.bot - inset(book))} ${cross(px, book.bot - inset(book), W / 2, fanY)}`;
    textLeg(d, book.bot - inset(book), fanY, STEEL_ON_DARK);
    /* the delta: the thread splits and pours across the width of the thesis */
    const NB = narrow ? 5 : 7;
    const spread = Math.min(thesisW * 0.92, W * 0.7);
    const endY = thesisY - 14;
    for (let k = 0; k < NB; k++) {
      const fx = W / 2 + spread * (k / (NB - 1) - 0.5);
      const bd = `M ${fmt(W / 2)},${fmt(fanY)} C ${fmt(W / 2)},${fmt(fanY + (endY - fanY) * 0.45)} ${fmt(fx)},${fmt(fanY + (endY - fanY) * 0.5)} ${fmt(fx)},${fmt(endY)}`;
      textLeg(bd, fanY, endY, STEEL_ON_DARK);
    }
  }

  if (reduced) for (const l of legs) l.nodes.forEach((n) => { n.style.opacity = .75; });
  updateSpine();
}

let fabricTop = 0;
function updateSpine() {
  if (!legs.length) return;
  const codaEl = $('.coda');
  if (reduced) { if (codaEl) codaEl.classList.add('is-sewn'); return; }
  fabricTop = fabric.getBoundingClientRect().top + scrollY;
  const tip = scrollY + innerHeight * 0.62 - fabricTop;
  let lastP = 0;
  for (const l of legs) {
    const p = clamp((tip - l.y0) / (l.y1 - l.y0), 0, 1);
    lastP = p;
    l.rect.setAttribute('height', (l.span * p).toFixed(1));
    for (const n of l.nodes) n.style.opacity = tip > +n.dataset.y ? .75 : 0;
  }
  /* the delta legs finish last; when they near the sentence, sew it */
  if (lastP > 0.72 && codaEl && !codaEl.classList.contains('is-sewn')) codaEl.classList.add('is-sewn');
}

/* ---------------- the first machine: film plays only in view ---------------- */

const film = $('.firstmachine__film');
if (film && !reduced) {
  new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting) film.play().catch(() => {});
      else film.pause();
    }
  }, { threshold: 0.35 }).observe(film);
}

/* ---------------- scroll pump ---------------- */

let ticking = false;
function onScroll() {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(() => {
    updateSpine();
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
    const count = clamp(Math.round((ew * eh) / 52000), 14, 30);
    nodes = Array.from({ length: count }, () => ({
      x: Math.random() * ew, y: Math.random() * eh,
      vx: (Math.random() - 0.5) * 0.16, vy: (Math.random() - 0.5) * 0.16,
    }));
  }

  /* the codex: a two-page spread constructed by the Van de Graaf canon —
     page frames, the canon's diagonals, and each page's text block — drawn
     as faint rule-work behind the net. The section reads as a book being
     diagrammed, which is the EN register exactly. */
  function drawCodex() {
    const ph = Math.min(eh * 0.62, 760);           /* page height */
    const pw = ph * 0.667;                          /* page width, 2:3 */
    const top = (eh - ph) / 2;
    const cx = ew / 2;
    const ink = '#37444E';
    ectx.lineWidth = 1;
    for (const side of [-1, 1]) {
      const x0 = side < 0 ? cx - pw : cx;           /* page rect */
      ectx.strokeStyle = ink;
      ectx.globalAlpha = 0.10;
      ectx.strokeRect(x0, top, pw, ph);
      /* canon diagonals: page diagonal + spread diagonal */
      ectx.globalAlpha = 0.07;
      ectx.beginPath();
      if (side < 0) {
        ectx.moveTo(x0, top + ph); ectx.lineTo(x0 + pw, top);          /* page diagonal */
        ectx.moveTo(cx + pw, top + ph); ectx.lineTo(x0, top);          /* spread diagonal */
      } else {
        ectx.moveTo(x0 + pw, top + ph); ectx.lineTo(x0, top);
        ectx.moveTo(cx - pw, top + ph); ectx.lineTo(x0 + pw, top);
      }
      ectx.stroke();
      /* the canon's text block: margins 2/9 head+outer feel, 1/9 inner */
      const iw = pw * 2 / 3, ih = ph * 2 / 3;
      const inX = side < 0 ? x0 + pw / 9 : x0 + pw - pw / 9 - iw;
      ectx.globalAlpha = 0.12;
      ectx.strokeRect(side < 0 ? x0 + pw - pw * 2 / 9 - iw + iw : inX, 0, 0, 0); /* noop guard */
      ectx.strokeRect(inX + (side < 0 ? pw * 2 / 9 - pw / 9 : -(pw * 2 / 9 - pw / 9)), top + ph / 9, iw, ih);
      /* baseline rules inside the text block */
      ectx.globalAlpha = 0.045;
      const bx = inX + (side < 0 ? pw * 2 / 9 - pw / 9 : -(pw * 2 / 9 - pw / 9));
      ectx.beginPath();
      for (let k = 1; k < 9; k++) {
        const y = top + ph / 9 + (ih * k) / 9;
        ectx.moveTo(bx, y); ectx.lineTo(bx + iw, y);
      }
      ectx.stroke();
    }
    /* the spine of the book */
    ectx.globalAlpha = 0.12;
    ectx.beginPath(); ectx.moveTo(cx, top); ectx.lineTo(cx, top + ph); ectx.stroke();
    ectx.globalAlpha = 1;
  }

  function drawEn(t) {
    ectx.clearRect(0, 0, ew, eh);
    drawCodex();
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
        ectx.globalAlpha = (1 - d / R) * (0.04 + wake * 0.3);
        ectx.lineWidth = 1;
        ectx.stroke();
      }
    }
    for (const n of nodes) {
      const pd = Math.hypot(n.x - pointer.x, n.y - pointer.y);
      const wake = 1 - Math.min(pd, 320) / 320;
      ectx.beginPath();
      ectx.arc(n.x, n.y, 1.4 + wake * 1.5, 0, Math.PI * 2);
      ectx.fillStyle = '#37444E';
      ectx.globalAlpha = 0.12 + wake * 0.6;
      ectx.fill();
    }
    /* signal pulses along near edges */
    if (!reduced && t - lastPulse > 2600 && nodes.length > 4) {
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
      ectx.fillStyle = '#37444E';
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
}
let rsTimer;
addEventListener('resize', () => { clearTimeout(rsTimer); rsTimer = setTimeout(buildAll, 220); });
addEventListener('load', buildAll);
if (document.fonts) document.fonts.ready.then(buildAll);
buildAll();
