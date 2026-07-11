/* THE LOOM — the name is embroidered by the threads.
   Six luminous threads weave in the void; thousands of stitches ride
   them, then peel off and settle into the letterforms. The cursor
   pulls the stitching aside; lift your hand and the cloth heals;
   click and the name unravels back onto the threads and re-weaves.
   Type made of textile. All code-drawn. */

import * as THREE from 'three';

const canvas = document.getElementById('loom');
const hero = document.querySelector('.hero');
const heroName = document.querySelector('.hero__name');
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

const LEN = 26;

const THREADS = [
  { color: '#F3EFE7', amp: 0.80, r: 0.030, speed: 0.18, phase: 0.0,  freq: 1.5,  z: 0.10,  zAmp: 0.6,  op: 0.5  }, // warp
  { color: '#2E5BFF', amp: 1.15, r: 0.026, speed: 0.27, phase: 1.26, freq: 2.05, z: -0.16, zAmp: 0.85, op: 0.55 }, // attcu
  { color: '#FF6347', amp: 1.30, r: 0.026, speed: 0.24, phase: 2.51, freq: 1.85, z: 0.22,  zAmp: 0.9,  op: 0.5  }, // sat
  { color: '#5C7284', amp: 1.20, r: 0.026, speed: 0.22, phase: 3.77, freq: 2.2,  z: -0.26, zAmp: 0.8,  op: 0.5  }, // en
  { color: '#6FA08A', amp: 1.00, r: 0.026, speed: 0.25, phase: 5.03, freq: 1.95, z: 0.18,  zAmp: 0.88, op: 0.5  }, // retinue
  { color: '#CBFF04', amp: 0.95, r: 0.022, speed: 0.29, phase: 6.28, freq: 2.35, z: -0.1,  zAmp: 0.82, op: 0.4  }, // wct
];

/* shared weave maths: the tubes bend with it, the stitches ride it */
const WEAVE_GLSL = `
  vec3 weavePoint(float x, float t, float time, vec4 w1, vec2 w2) {
    /* w1 = amp, freq, phase, speed · w2 = zBase, zAmp */
    float wv = time * w1.w;
    float y = sin(t * 6.2831 * w1.y + w1.z + wv) * w1.x;
    y += sin(t * 6.2831 * w1.y * 0.47 + w1.z * 1.7 - wv * 0.6) * w1.x * 0.36;
    float env = smoothstep(0.0, 0.14, t) * smoothstep(1.0, 0.86, t);
    y *= mix(0.24, 1.0, env);
    float z = w2.x + cos(t * 6.2831 * w1.y * 0.9 + w1.z * 2.1 + wv * 0.7) * w2.y;
    return vec3(x, y, z);
  }
`;

/* ---------------- tube threads ---------------- */

const TUBE_VERT = `
  uniform float uTime, uPhase, uAmp, uFreq, uSpeed, uLen, uScroll, uZBase, uZAmp;
  uniform vec2 uMouse;
  varying float vT;
  ${''}
  void main() {
    vec3 p = position;
    float t = clamp(p.x / uLen + 0.5, 0.0, 1.0);
    vT = t;
    float w = uTime * uSpeed;
    float y = sin(t * 6.2831 * uFreq + uPhase + w) * uAmp;
    y += sin(t * 6.2831 * uFreq * 0.47 + uPhase * 1.7 - w * 0.6) * uAmp * 0.36;
    float z = uZBase + cos(t * 6.2831 * uFreq * 0.9 + uPhase * 2.1 + w * 0.7) * uZAmp;
    float env = smoothstep(0.0, 0.14, t) * smoothstep(1.0, 0.86, t);
    y *= mix(0.24, 1.0, env);
    float d = p.x - uMouse.x;
    y += exp(-d * d * 0.32) * uMouse.y * env;
    y -= uScroll * uScroll * (2.4 + uAmp) * env;
    p.y += y;
    p.z += z;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;

const TUBE_FRAG = `
  uniform vec3 uColor;
  uniform float uOpacity;
  varying float vT;
  void main() {
    float edge = smoothstep(0.0, 0.05, vT) * smoothstep(1.0, 0.95, vT);
    gl_FragColor = vec4(uColor, uOpacity * edge);
  }
`;

/* ---------------- stitches ---------------- */

const STITCH_VERT = `
  attribute vec2 aTarget;
  attribute float aSpawnT;
  attribute vec4 aWeave1;
  attribute vec2 aWeave2;
  attribute float aDelay;
  attribute float aSeed;
  attribute float aAngle;
  attribute float aGlyph;
  attribute float aSize;
  attribute vec3 aColor;
  uniform float uTime, uProgress, uScroll, uLen, uPxPerWorld;
  uniform vec2 uMouseW;
  varying vec3 vColor;
  varying float vAngle;
  varying float vFade;
  varying float vGlyph;
  ${WEAVE_GLSL}
  void main() {
    /* where this fragment of matter rides on its home thread right now */
    float x0 = (aSpawnT - 0.5) * uLen;
    vec3 home = weavePoint(x0, aSpawnT, uTime, aWeave1, aWeave2);
    vec3 target = vec3(aTarget, 0.0);

    float p = clamp((uProgress - aDelay) / 0.42, 0.0, 1.0);
    p = p * p * (3.0 - 2.0 * p);

    /* peel off the thread along a small arc, then settle */
    vec3 arc = mix(home, target, 0.5);
    arc.y += 0.5 + aSeed * 0.8;
    arc.z += 0.4;
    vec3 pos = mix(mix(home, arc, p), mix(arc, target, p), p);

    /* settled cloth breathes very slightly */
    pos.x += sin(uTime * 1.7 + aSeed * 43.0) * 0.004 * p;
    pos.y += cos(uTime * 1.4 + aSeed * 31.0) * 0.004 * p;

    /* the cursor pulls the matter aside; it heals when you leave */
    vec2 dm = pos.xy - uMouseW;
    float dd = length(dm);
    float push = exp(-dd * dd * 2.6) * 0.55 * p;
    pos.xy += (dd > 0.0001 ? dm / dd : vec2(0.0)) * push;
    pos.z += push * 0.7;

    /* scrolling pulls the whole cloth down through the fabric */
    pos.y -= uScroll * uScroll * 2.4;

    vColor = aColor;
    vAngle = aAngle + push * 1.6;
    vFade = mix(0.6, 1.0, p);
    vGlyph = aGlyph;
    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = uPxPerWorld * aSize;
  }
`;

/* each point samples one cell of the matter atlas:
   tiny letters, code characters, and stitch dashes */
const STITCH_FRAG = `
  uniform sampler2D uAtlas;
  varying vec3 vColor;
  varying float vAngle;
  varying float vFade;
  varying float vGlyph;
  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float c = cos(vAngle), s = sin(vAngle);
    vec2 r = vec2(uv.x * c - uv.y * s, uv.x * s + uv.y * c) + 0.5;
    if (r.x < 0.02 || r.x > 0.98 || r.y < 0.02 || r.y > 0.98) discard;
    vec2 cell = vec2(mod(vGlyph, 8.0), floor(vGlyph / 8.0));
    vec2 auv = (cell + vec2(r.x, 1.0 - r.y)) / vec2(8.0, 4.0);
    float a = texture2D(uAtlas, auv).a;
    if (a < 0.04) discard;
    gl_FragColor = vec4(vColor, a * vFade);
  }
`;

/* the matter atlas: her name's letters, code, and stitches */
function buildAtlas() {
  const CELL = 128;
  const atlas = document.createElement('canvas');
  atlas.width = CELL * 8;
  atlas.height = CELL * 4;
  const ctx = atlas.getContext('2d');
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const letters = ['c', 'i', 'a', 'r', 'g', 'f', 'n', 'e', 't', 'o'];
  const code = ['{', '}', '<', '>', '/', '=', ';', '*', '#', ':', '[', ']', '&', '+', '$'];
  const cells = [];
  for (const ch of letters) cells.push({ ch, font: `italic 520 ${CELL * 0.72}px Fraunces, Georgia, serif` });
  for (const ch of code) cells.push({ ch, font: `400 ${CELL * 0.6}px "Fragment Mono", monospace` });
  const glyphCount = cells.length;
  cells.forEach((cell, i) => {
    const cx = (i % 8) * CELL + CELL / 2;
    const cy = Math.floor(i / 8) * CELL + CELL / 2;
    ctx.font = cell.font;
    ctx.fillText(cell.ch, cx, cy + CELL * 0.02);
  });
  /* stitch dashes fill the remaining cells */
  const stitchStart = glyphCount;
  for (let i = glyphCount; i < 32; i++) {
    const cx = (i % 8) * CELL + CELL / 2;
    const cy = Math.floor(i / 8) * CELL + CELL / 2;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = CELL * 0.13;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-CELL * (0.2 + (i % 3) * 0.05), 0);
    ctx.lineTo(CELL * (0.2 + (i % 3) * 0.05), 0);
    ctx.stroke();
    ctx.restore();
  }
  const tex = new THREE.CanvasTexture(atlas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.generateMipmaps = false;
  tex.minFilter = THREE.LinearFilter;
  return { tex, letterRange: [0, letters.length], codeRange: [letters.length, glyphCount], stitchRange: [stitchStart, 32] };
}

let renderer, scene, camera, clock;
let tubeMeshes = [], stitches = null, stitchMat = null, atlasData = null;
let running = false, visible = true, wovenReady = false;
let progress = reduced ? 1 : 0, progressTarget = 0, progressSpeed = 0.45;
const mouse = { tx: 0, ty: 0, x: 0, y: 0, wx: 99, wy: 99, twx: 99, twy: 99 };

function makeTube(t) {
  const group = [];
  for (const [radius, op, order] of [[t.r * 3.1, t.op * 0.09, 2], [t.r, t.op, 3]]) {
    const geo = new THREE.CylinderGeometry(radius, radius, LEN, 8, 340, true);
    geo.rotateZ(Math.PI / 2);
    const mat = new THREE.ShaderMaterial({
      vertexShader: TUBE_VERT,
      fragmentShader: TUBE_FRAG,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uPhase: { value: t.phase },
        uAmp: { value: t.amp },
        uFreq: { value: t.freq },
        uSpeed: { value: t.speed },
        uLen: { value: LEN },
        uScroll: { value: 0 },
        uZBase: { value: t.z },
        uZAmp: { value: t.zAmp },
        uMouse: { value: new THREE.Vector2(0, 0) },
        uColor: { value: new THREE.Color(t.color) },
        uOpacity: { value: op },
      },
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.renderOrder = order;
    mesh.frustumCulled = false;
    group.push(mesh);
  }
  return group;
}

/* ---- sample the name into stitch targets ---- */

function worldPerPixel() {
  const h = canvas.clientHeight || innerHeight;
  return (2 * Math.tan((camera.fov * Math.PI) / 360) * camera.position.z) / h;
}

function buildStitches() {
  if (!heroName) return;
  const lines = [...heroName.querySelectorAll('.hero__line')];
  if (!lines.length) return;
  const nameRect = heroName.getBoundingClientRect();
  const canvasRect = canvas.getBoundingClientRect();
  if (nameRect.width < 10) return;

  const cs = getComputedStyle(heroName);
  const off = document.createElement('canvas');
  off.width = Math.ceil(nameRect.width);
  off.height = Math.ceil(nameRect.height);
  const ctx = off.getContext('2d', { willReadFrequently: true });
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.font = `${cs.fontWeight} ${parseFloat(cs.fontSize)}px Fraunces, Georgia, serif`;
  if ('letterSpacing' in ctx) ctx.letterSpacing = cs.letterSpacing;
  for (const line of lines) {
    const r = line.getBoundingClientRect();
    ctx.fillText(line.textContent, r.left - nameRect.left + r.width / 2, r.top - nameRect.top + r.height * 0.82);
  }
  const img = ctx.getImageData(0, 0, off.width, off.height).data;

  /* adaptive grid: fewer, larger fragments so each one reads as a character */
  const budget = innerWidth < 700 ? 8000 : 19000;
  let step = 2;
  let count = 0;
  const counted = (st) => {
    let n = 0;
    for (let y = 0; y < off.height; y += st) {
      for (let x = 0; x < off.width; x += st) {
        if (img[(y * off.width + x) * 4 + 3] > 120) n++;
      }
    }
    return n;
  };
  count = counted(step);
  while (count > budget && step < 7) { step += 0.5; count = counted(Math.round(step)); }
  step = Math.round(step);

  const wpp = worldPerPixel();
  const cxPx = nameRect.left + nameRect.width / 2 - (canvasRect.left + canvasRect.width / 2);
  const cyPx = nameRect.top + nameRect.height / 2 - (canvasRect.top + canvasRect.height / 2);

  if (!atlasData) atlasData = buildAtlas();

  const targets = [], weave1 = [], weave2 = [], spawnT = [], delays = [], seeds = [], angles = [], colors = [], glyphs = [], sizes = [];
  const creamCol = new THREE.Color('#F3EFE7');
  const pick = (range) => range[0] + Math.floor(Math.random() * (range[1] - range[0]));
  for (let y = 0; y < off.height; y += step) {
    for (let x = 0; x < off.width; x += step) {
      if (img[(y * off.width + x) * 4 + 3] <= 120) continue;
      const jx = x + (Math.random() - 0.5) * step;
      const jy = y + (Math.random() - 0.5) * step;
      const wx = (jx - off.width / 2 + cxPx) * wpp;
      const wy = -(jy - off.height / 2 + cyPx) * wpp;
      targets.push(wx, wy);
      const ti = (Math.random() * THREADS.length) | 0;
      const t = THREADS[ti];
      weave1.push(t.amp, t.freq, t.phase, t.speed);
      weave2.push(t.z, t.zAmp);
      spawnT.push(0.08 + Math.random() * 0.84);
      /* the name weaves in left to right, with loose ends trailing */
      delays.push((jx / off.width) * 0.5 + Math.random() * 0.12);
      const seed = Math.random();
      seeds.push(seed);

      /* what is she made of: letters, code, and stitches */
      const kind = Math.random();
      let glyph, angle, size;
      if (kind < 0.26) {
        glyph = pick(atlasData.stitchRange);
        angle = -0.85 + Math.random() * 0.55;
        size = 0.028 + seed * 0.008;
      } else if (kind < 0.6) {
        glyph = pick(atlasData.letterRange);
        angle = (Math.random() - 0.5) * 0.3;
        size = 0.034 + seed * 0.010;
      } else {
        glyph = pick(atlasData.codeRange);
        angle = (Math.random() - 0.5) * 0.26;
        size = 0.032 + seed * 0.010;
      }
      /* a few feature glyphs, big enough to read on camera */
      if (seed > 0.978) size = 0.10 + (seed - 0.978) * 1.8;
      glyphs.push(glyph);
      angles.push(angle);
      sizes.push(size);

      /* tweed: mostly cream; code keeps its thread's dye more often */
      const dyed = kind >= 0.62 ? Math.random() < 0.22 : Math.random() < 0.1;
      const c = dyed ? new THREE.Color(t.color) : creamCol;
      colors.push(c.r, c.g, c.b);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(targets.length / 2 * 3), 3));
  geo.setAttribute('aTarget', new THREE.BufferAttribute(new Float32Array(targets), 2));
  geo.setAttribute('aWeave1', new THREE.BufferAttribute(new Float32Array(weave1), 4));
  geo.setAttribute('aWeave2', new THREE.BufferAttribute(new Float32Array(weave2), 2));
  geo.setAttribute('aSpawnT', new THREE.BufferAttribute(new Float32Array(spawnT), 1));
  geo.setAttribute('aDelay', new THREE.BufferAttribute(new Float32Array(delays), 1));
  geo.setAttribute('aSeed', new THREE.BufferAttribute(new Float32Array(seeds), 1));
  geo.setAttribute('aAngle', new THREE.BufferAttribute(new Float32Array(angles), 1));
  geo.setAttribute('aGlyph', new THREE.BufferAttribute(new Float32Array(glyphs), 1));
  geo.setAttribute('aSize', new THREE.BufferAttribute(new Float32Array(sizes), 1));
  geo.setAttribute('aColor', new THREE.BufferAttribute(new Float32Array(colors), 3));

  if (!stitchMat) {
    stitchMat = new THREE.ShaderMaterial({
      vertexShader: STITCH_VERT,
      fragmentShader: STITCH_FRAG,
      transparent: true,
      depthWrite: false,
      blending: THREE.NormalBlending,
      uniforms: {
        uTime: { value: 0 },
        uProgress: { value: reduced ? 1 : 0 },
        uScroll: { value: 0 },
        uLen: { value: LEN },
        uPxPerWorld: { value: 1 },
        uMouseW: { value: new THREE.Vector2(99, 99) },
        uAtlas: { value: atlasData.tex },
      },
    });
  }
  if (stitches) {
    scene.remove(stitches);
    stitches.geometry.dispose();
  }
  stitches = new THREE.Points(geo, stitchMat);
  stitches.renderOrder = 4;
  stitches.frustumCulled = false;
  scene.add(stitches);
  stitchMat.uniforms.uPxPerWorld.value = (canvas.clientHeight || innerHeight)
    / (2 * Math.tan((camera.fov * Math.PI) / 360) * camera.position.z)
    * Math.min(devicePixelRatio, 2);

  if (!wovenReady) {
    wovenReady = true;
    hero.classList.add('hero--woven');
    if (!reduced) { progressTarget = 1; progressSpeed = 0.4; }
  }
}

/* ---------------- scene ---------------- */

function init() {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  camera.position.set(0, 0, 15);
  for (const t of THREADS) for (const m of makeTube(t)) { scene.add(m); tubeMeshes.push(m); }
  clock = new THREE.Clock();
  resize();
  addEventListener('resize', resize);

  const fontsReady = document.fonts ? document.fonts.ready : Promise.resolve();
  fontsReady.then(() => requestAnimationFrame(() => {
    buildStitches();
    if (reduced) { setUniforms(3.2); renderer.render(scene, camera); }
  }));

  if (reduced) {
    setUniforms(3.2);
    renderer.render(scene, camera);
    return;
  }

  addEventListener('pointermove', (e) => {
    const nx = (e.clientX / innerWidth) * 2 - 1;
    const halfW = Math.tan((camera.fov * Math.PI) / 360) * camera.position.z * camera.aspect;
    const halfH = Math.tan((camera.fov * Math.PI) / 360) * camera.position.z;
    mouse.tx = nx * halfW;
    mouse.ty = (0.5 - e.clientY / innerHeight) * 1.4;
    const r = canvas.getBoundingClientRect();
    mouse.twx = ((e.clientX - r.left) / r.width * 2 - 1) * halfW;
    mouse.twy = -((e.clientY - r.top) / r.height * 2 - 1) * halfH;
  }, { passive: true });

  /* click: unravel the name back onto the threads, then re-weave */
  hero.addEventListener('click', (e) => {
    if (e.target.closest('a')) return;
    if (!wovenReady) return;
    progressTarget = 0;
    progressSpeed = 1.6;
  });

  new IntersectionObserver((entries) => {
    visible = entries[0].isIntersecting;
    if (visible && !running) loop();
  }).observe(canvas);

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && visible && !running) loop();
  });

  loop();
}

function setUniforms(v) {
  const sc = Math.min(scrollY / Math.max(innerHeight, 1), 1);
  for (const m of tubeMeshes) {
    m.material.uniforms.uTime.value = v;
    m.material.uniforms.uScroll.value = sc;
    m.material.uniforms.uMouse.value.set(mouse.x, mouse.y);
  }
  if (stitchMat) {
    stitchMat.uniforms.uTime.value = v;
    stitchMat.uniforms.uScroll.value = sc;
    stitchMat.uniforms.uProgress.value = progress;
    stitchMat.uniforms.uMouseW.value.set(mouse.wx, mouse.wy);
  }
}

function loop() {
  if (!visible || document.hidden) { running = false; return; }
  running = true;
  const dt = Math.min(clock.getDelta(), 0.05);
  mouse.x += (mouse.tx - mouse.x) * 0.06;
  mouse.y += (mouse.ty - mouse.y) * 0.06;
  mouse.wx += (mouse.twx - mouse.wx) * 0.14;
  mouse.wy += (mouse.twy - mouse.wy) * 0.14;

  /* progress state machine: unravel fast, re-weave slow */
  if (progress < progressTarget) progress = Math.min(progressTarget, progress + dt * progressSpeed);
  else if (progress > progressTarget) progress = Math.max(progressTarget, progress - dt * progressSpeed);
  if (progressTarget === 0 && progress === 0 && wovenReady) {
    progressTarget = 1;
    progressSpeed = 0.4;
  }

  const t = clock.elapsedTime;
  setUniforms(t);
  camera.position.x = Math.sin(t * 0.05) * 0.32;
  camera.position.y = Math.cos(t * 0.043) * 0.22;
  camera.lookAt(0, 0, 0);
  renderer.render(scene, camera);
  requestAnimationFrame(loop);
}

let rebuildTimer;
function resize() {
  const w = canvas.clientWidth || innerWidth;
  const h = canvas.clientHeight || innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  clearTimeout(rebuildTimer);
  rebuildTimer = setTimeout(() => {
    if (wovenReady) buildStitches();
    if (reduced) { setUniforms(3.2); renderer.render(scene, camera); }
  }, 200);
}

try { init(); } catch (e) { canvas.remove(); }
