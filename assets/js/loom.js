/* THE LOOM — six yarns weaving through the name.
   The wordmark is a plane inside the scene; every thread's depth
   oscillates across it, so thread passes over and under the
   letterforms the way weft passes over and under warp.
   Matte fibre shading, no glow. All code-drawn. */

import * as THREE from 'three';

const canvas = document.getElementById('loom');
const hero = document.querySelector('.hero');
const heroName = document.querySelector('.hero__name');
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

const LEN = 26;

/* luminous brand hues; the warp runs as one strand among equals */
const THREADS = [
  { color: '#F3EFE7', amp: 0.80, r: 0.032, speed: 0.18, phase: 0.0,  freq: 1.5,  z: 0.10,  zAmp: 0.6,  op: 0.72 }, // warp
  { color: '#2E5BFF', amp: 1.15, r: 0.028, speed: 0.27, phase: 1.26, freq: 2.05, z: -0.16, zAmp: 0.85, op: 0.72 }, // attcu
  { color: '#FF6347', amp: 1.30, r: 0.028, speed: 0.24, phase: 2.51, freq: 1.85, z: 0.22,  zAmp: 0.9,  op: 0.66 }, // sat
  { color: '#5C7284', amp: 1.20, r: 0.028, speed: 0.22, phase: 3.77, freq: 2.2,  z: -0.26, zAmp: 0.8,  op: 0.66 }, // en
  { color: '#6FA08A', amp: 1.00, r: 0.028, speed: 0.25, phase: 5.03, freq: 1.95, z: 0.18,  zAmp: 0.88, op: 0.66 }, // retinue
  { color: '#CBFF04', amp: 0.95, r: 0.024, speed: 0.29, phase: 6.28, freq: 2.35, z: -0.1,  zAmp: 0.82, op: 0.52 }, // wct
];

const VERT = `
  uniform float uTime, uPhase, uAmp, uFreq, uSpeed, uLen, uScroll, uZBase, uZAmp;
  uniform vec2 uMouse;
  varying float vT;
  void main() {
    vec3 p = position;
    float t = clamp(p.x / uLen + 0.5, 0.0, 1.0);
    vT = t;
    float w = uTime * uSpeed;
    float y = sin(t * 6.2831 * uFreq + uPhase + w) * uAmp;
    y += sin(t * 6.2831 * uFreq * 0.47 + uPhase * 1.7 - w * 0.6) * uAmp * 0.36;
    /* the over-under: depth crosses the plane of the cloth (the name) */
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

const FRAG = `
  uniform vec3 uColor;
  uniform float uOpacity;
  varying float vT;
  void main() {
    float edge = smoothstep(0.0, 0.05, vT) * smoothstep(1.0, 0.95, vT);
    gl_FragColor = vec4(uColor, uOpacity * edge);
  }
`;

let renderer, scene, camera, meshes = [], textMesh = null, textTex = null;
let clock, running = false, visible = true, wovenReady = false;
const mouse = { tx: 0, ty: 0, x: 0, y: 0 };

function makeThread(t) {
  const group = [];
  /* luminous core + a soft halo around it */
  for (const [radius, op, order] of [[t.r * 3.1, t.op * 0.09, 2], [t.r, t.op, 3]]) {
    const geo = new THREE.CylinderGeometry(radius, radius, LEN, 8, 340, true);
    geo.rotateZ(Math.PI / 2);
    const mat = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      transparent: true,
      depthWrite: false,
      depthTest: true,
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

/* ---- the name, woven into the scene ---- */

function worldPerPixel() {
  const h = canvas.clientHeight || innerHeight;
  return (2 * Math.tan((camera.fov * Math.PI) / 360) * camera.position.z) / h;
}

function buildTextPlane() {
  if (!heroName) return;
  const lines = [...heroName.querySelectorAll('.hero__line')];
  if (!lines.length) return;
  const nameRect = heroName.getBoundingClientRect();
  const canvasRect = canvas.getBoundingClientRect();
  if (nameRect.width < 10) return;

  const cs = getComputedStyle(heroName);
  const dpr = Math.min(devicePixelRatio, 2);
  const pad = 20;
  const tex = document.createElement('canvas');
  tex.width = Math.ceil((nameRect.width + pad * 2) * dpr);
  tex.height = Math.ceil((nameRect.height + pad * 2) * dpr);
  const ctx = tex.getContext('2d');
  ctx.scale(dpr, dpr);
  ctx.fillStyle = '#F3EFE7';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.font = `${cs.fontWeight} ${parseFloat(cs.fontSize)}px Mireille, Georgia, serif`;
  if ('letterSpacing' in ctx) ctx.letterSpacing = cs.letterSpacing;

  for (const line of lines) {
    const r = line.getBoundingClientRect();
    /* draw each DOM line exactly where it sits, baseline ~82% of line box */
    const cx = r.left - nameRect.left + pad + r.width / 2;
    const by = r.top - nameRect.top + pad + r.height * 0.82;
    ctx.fillText(line.textContent, cx, by);
  }

  const texture = new THREE.CanvasTexture(tex);
  texture.anisotropy = 4;
  texture.colorSpace = THREE.SRGBColorSpace;

  const wpp = worldPerPixel();
  const w = tex.width / dpr * wpp;
  const h = tex.height / dpr * wpp;
  const cxPx = nameRect.left + nameRect.width / 2 - (canvasRect.left + canvasRect.width / 2);
  const cyPx = nameRect.top + nameRect.height / 2 - (canvasRect.top + canvasRect.height / 2);

  if (textMesh) {
    scene.remove(textMesh);
    textMesh.geometry.dispose();
    textMesh.material.dispose();
    if (textTex) textTex.dispose();
  }
  textTex = texture;
  const mat = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    alphaTest: 0.32,
    depthWrite: true,
    depthTest: true,
    toneMapped: false,
  });
  textMesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
  textMesh.position.set(cxPx * wpp, -cyPx * wpp, 0);
  textMesh.renderOrder = 1;
  scene.add(textMesh);

  if (!wovenReady) {
    wovenReady = true;
    hero.classList.add('hero--woven');
  }
}

/* ---- scene ---- */

function init() {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  camera.position.set(0, 0, 15);
  for (const t of THREADS) for (const m of makeThread(t)) { scene.add(m); meshes.push(m); }
  clock = new THREE.Clock();
  resize();
  addEventListener('resize', resize);

  const fontsReady = document.fonts ? document.fonts.ready : Promise.resolve();
  fontsReady.then(() => {
    /* fonts are in: weave the name into the cloth */
    requestAnimationFrame(() => {
      buildTextPlane();
      if (reduced) { setTime(3.2); renderer.render(scene, camera); }
    });
  });

  if (reduced) {
    setTime(3.2);
    renderer.render(scene, camera);
    return;
  }

  addEventListener('pointermove', (e) => {
    const nx = (e.clientX / innerWidth) * 2 - 1;
    const halfW = Math.tan((camera.fov * Math.PI) / 360) * camera.position.z * camera.aspect;
    mouse.tx = nx * halfW;
    mouse.ty = (0.5 - e.clientY / innerHeight) * 1.4;
  }, { passive: true });

  new IntersectionObserver((entries) => {
    visible = entries[0].isIntersecting;
    if (visible && !running) loop();
  }).observe(canvas);

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && visible && !running) loop();
  });

  loop();
}

function setTime(v) {
  const sc = Math.min(scrollY / Math.max(innerHeight, 1), 1);
  for (const m of meshes) {
    m.material.uniforms.uTime.value = v;
    m.material.uniforms.uScroll.value = sc;
    m.material.uniforms.uMouse.value.set(mouse.x, mouse.y);
  }
}

function loop() {
  if (!visible || document.hidden) { running = false; return; }
  running = true;
  mouse.x += (mouse.tx - mouse.x) * 0.06;
  mouse.y += (mouse.ty - mouse.y) * 0.06;
  const t = clock.getElapsedTime();
  setTime(t);
  camera.position.x = Math.sin(t * 0.05) * 0.32;
  camera.position.y = Math.cos(t * 0.043) * 0.22;
  camera.lookAt(0, 0, 0);
  renderer.render(scene, camera);
  requestAnimationFrame(loop);
}

let textRebuildTimer;
function resize() {
  const w = canvas.clientWidth || innerWidth;
  const h = canvas.clientHeight || innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  clearTimeout(textRebuildTimer);
  textRebuildTimer = setTimeout(() => {
    if (wovenReady) buildTextPlane();
    if (reduced) { setTime(3.2); renderer.render(scene, camera); }
  }, 180);
}

try { init(); } catch (e) { canvas.remove(); }
