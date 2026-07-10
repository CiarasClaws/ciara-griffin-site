/* THE LOOM — six threads weaving in the void behind the name.
   One cream warp (hers), five brand wefts. All code-drawn. */

import * as THREE from 'three';

const canvas = document.getElementById('loom');
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

const LEN = 26;

const THREADS = [
  { color: '#F3EFE7', amp: 0.80, r: 0.044, speed: 0.20, phase: 0.0, freq: 1.5, z: 0.0,  op: 0.88 }, // warp
  { color: '#6FA08A', amp: 1.10, r: 0.028, speed: 0.27, phase: 1.1, freq: 2.1, z: 0.7,  op: 0.66 }, // retinue
  { color: '#5C7284', amp: 1.25, r: 0.028, speed: 0.24, phase: 2.3, freq: 1.8, z: -0.8, op: 0.66 }, // en
  { color: '#CBFF04', amp: 1.00, r: 0.024, speed: 0.31, phase: 3.4, freq: 2.5, z: 1.4,  op: 0.52 }, // wct
  { color: '#FF6347', amp: 1.30, r: 0.028, speed: 0.26, phase: 4.5, freq: 1.95, z: -1.5, op: 0.66 }, // sat
  { color: '#2E5BFF', amp: 1.15, r: 0.028, speed: 0.29, phase: 5.6, freq: 2.3, z: 0.35, op: 0.72 }, // attcu
];

const VERT = `
  uniform float uTime, uPhase, uAmp, uFreq, uSpeed, uLen;
  uniform vec2 uMouse;
  varying float vT;
  void main() {
    vec3 p = position;
    float t = clamp(p.x / uLen + 0.5, 0.0, 1.0);
    vT = t;
    float w = uTime * uSpeed;
    float y = sin(t * 6.2831 * uFreq + uPhase + w) * uAmp;
    y += sin(t * 6.2831 * uFreq * 0.47 + uPhase * 1.7 - w * 0.6) * uAmp * 0.38;
    float z = cos(t * 6.2831 * uFreq * 0.8 + uPhase * 2.1 + w * 0.8) * 0.9;
    float env = smoothstep(0.0, 0.14, t) * smoothstep(1.0, 0.86, t);
    y *= mix(0.22, 1.0, env);
    float d = p.x - uMouse.x;
    y += exp(-d * d * 0.32) * uMouse.y * env;
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

let renderer, scene, camera, meshes = [], clock, running = false, visible = true;
const mouse = { tx: 0, ty: 0, x: 0, y: 0 };

function makeThread(t) {
  const group = [];
  for (const [radius, op] of [[t.r, t.op], [t.r * 3.1, t.op * 0.09]]) {
    const geo = new THREE.CylinderGeometry(radius, radius, LEN, 8, 300, true);
    geo.rotateZ(Math.PI / 2);
    const mat = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
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
        uMouse: { value: new THREE.Vector2(0, 0) },
        uColor: { value: new THREE.Color(t.color) },
        uOpacity: { value: op },
      },
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.z = t.z;
    group.push(mesh);
  }
  return group;
}

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

  if (reduced) {
    setTime(3.2);
    renderer.render(scene, camera);
    return;
  }

  addEventListener('pointermove', (e) => {
    const nx = (e.clientX / innerWidth) * 2 - 1;
    const halfW = Math.tan((camera.fov * Math.PI) / 360) * camera.position.z * camera.aspect;
    mouse.tx = nx * halfW;
    mouse.ty = (0.5 - e.clientY / innerHeight) * 1.7;
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
  for (const m of meshes) {
    m.material.uniforms.uTime.value = v;
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
  camera.position.x = Math.sin(t * 0.05) * 0.4;
  camera.position.y = Math.cos(t * 0.043) * 0.28;
  camera.lookAt(0, 0, 0);
  renderer.render(scene, camera);
  requestAnimationFrame(loop);
}

function resize() {
  const w = canvas.clientWidth || innerWidth;
  const h = canvas.clientHeight || innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  if (reduced) { setTime(3.2); renderer.render(scene, camera); }
}

try { init(); } catch (e) { canvas.remove(); }
