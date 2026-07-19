// ============================================================================
//  controls.js — Cinematic camera paths + orbit controls + screenshot mode
// ============================================================================

import * as THREE from './lib/three/three.module.js';

// --------------------------------------------------------------------------
//  Camera path definitions
//    Each path is a function (t) -> { pos: vec3, target: vec3 }
//    where t in [0, 1) loops.
// --------------------------------------------------------------------------
export const CAMERA_PATHS = {
  orbit: {
    label: 'Orbit',
    fn: (t) => {
      const a = t * Math.PI * 2;
      const r = 18.0;
      const y = 4.0 + Math.sin(t * Math.PI * 2) * 1.5;
      return {
        pos: new THREE.Vector3(Math.cos(a) * r, y, Math.sin(a) * r),
        target: new THREE.Vector3(0, 0, 0),
      };
    },
  },
  dive: {
    label: 'Dive',
    fn: (t) => {
      // Approach from r=35 down to r=4 near photon sphere, then back out
      const phase = (Math.sin(t * Math.PI * 2) + 1) * 0.5; // 0..1..0
      const r = 35.0 - phase * 31.0;
      const a = t * Math.PI * 2 * 0.8;
      return {
        pos: new THREE.Vector3(Math.cos(a) * r, 6.0 - phase * 3.0, Math.sin(a) * r),
        target: new THREE.Vector3(0, 0, 0),
      };
    },
  },
  edgeon: {
    label: 'Edge-on',
    fn: (t) => {
      const a = t * Math.PI * 2;
      const r = 22.0;
      // Camera in the disk plane (y ≈ 0)
      return {
        pos: new THREE.Vector3(Math.cos(a) * r, 0.8, Math.sin(a) * r),
        target: new THREE.Vector3(0, 0, 0),
      };
    },
  },
  polar: {
    label: 'Polar',
    fn: (t) => {
      const a = t * Math.PI * 2;
      const r = 16.0;
      // Camera high above pole, sweeping around azimuth slowly
      return {
        pos: new THREE.Vector3(Math.cos(a) * r * 0.3, r, Math.sin(a) * r * 0.3),
        target: new THREE.Vector3(0, 0, 0),
      };
    },
  },
};

export const CAMERA_PATH_ORDER = ['orbit', 'dive', 'edgeon', 'polar'];

// --------------------------------------------------------------------------
//  OrbitControls (manual implementation — mouse drag + wheel)
//    Replaces THREE.OrbitControls so we have full control over camera basis.
// --------------------------------------------------------------------------
export class OrbitController {
  constructor(domElement) {
    this.dom = domElement;
    this.enabled = true;

    // Spherical coords (theta = azimuth, phi = polar from +Y)
    this.theta = 0.0;
    this.phi = Math.PI * 0.35;     // looking slightly down
    this.radius = 20.0;

    // Target offset (pan)
    this.target = new THREE.Vector3(0, 0, 0);

    // Damping
    this.dampingFactor = 0.12;
    this.targetTheta = this.theta;
    this.targetPhi = this.phi;
    this.targetRadius = this.radius;

    // Sensitivities
    this.rotateSpeed = 0.005;
    this.zoomSpeed = 0.1;

    // State
    this.isDragging = false;
    this.button = 0;
    this.lastX = 0;
    this.lastY = 0;

    // Bounds
    this.minRadius = 2.0;
    this.maxRadius = 80.0;
    this.minPhi = 0.05;
    this.maxPhi = Math.PI - 0.05;

    this._bindEvents();
  }

  _bindEvents() {
    this.dom.addEventListener('pointerdown', this._onDown.bind(this));
    window.addEventListener('pointermove', this._onMove.bind(this));
    window.addEventListener('pointerup', this._onUp.bind(this));
    this.dom.addEventListener('wheel', this._onWheel.bind(this), { passive: false });
    this.dom.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  _onDown(e) {
    if (!this.enabled) return;
    this.isDragging = true;
    this.button = e.button;
    this.lastX = e.clientX;
    this.lastY = e.clientY;
  }
  _onMove(e) {
    if (!this.enabled || !this.isDragging) return;
    const dx = e.clientX - this.lastX;
    const dy = e.clientY - this.lastY;
    this.lastX = e.clientX;
    this.lastY = e.clientY;

    if (this.button === 0) {
      // Rotate
      this.targetTheta -= dx * this.rotateSpeed;
      this.targetPhi -= dy * this.rotateSpeed;
      this.targetPhi = Math.max(this.minPhi, Math.min(this.maxPhi, this.targetPhi));
    } else if (this.button === 2) {
      // Pan (move target in camera plane)
      const panScale = this.radius * 0.0015;
      const right = new THREE.Vector3(
        Math.cos(this.theta), 0, -Math.sin(this.theta)
      );
      const up = new THREE.Vector3(0, 1, 0);
      this.target.addScaledVector(right, -dx * panScale);
      this.target.addScaledVector(up,    dy * panScale);
    }
  }
  _onUp() {
    this.isDragging = false;
  }
  _onWheel(e) {
    if (!this.enabled) return;
    e.preventDefault();
    const delta = Math.sign(e.deltaY) * this.zoomSpeed;
    this.targetRadius *= (1.0 + delta);
    this.targetRadius = Math.max(this.minRadius, Math.min(this.maxRadius, this.targetRadius));
  }

  // Sets position directly (used by cinematic paths)
  setFromPosition(pos, target) {
    const offset = pos.clone().sub(target);
    this.target.copy(target);
    this.radius = offset.length();
    this.targetRadius = this.radius;
    this.targetTheta = Math.atan2(offset.x, offset.z);
    this.targetPhi = Math.acos(offset.y / Math.max(this.radius, 0.0001));
    this.theta = this.targetTheta;
    this.phi = this.targetPhi;
  }

  update() {
    // Damped lerp
    const k = 1.0 - Math.pow(1.0 - this.dampingFactor, 1.0);
    this.theta += (this.targetTheta - this.theta) * k;
    this.phi += (this.targetPhi - this.phi) * k;
    this.radius += (this.targetRadius - this.radius) * k;
  }

  // Returns camera position and a look-at basis (right, up, -forward)
  getCameraState() {
    const sinPhi = Math.sin(this.phi);
    const cosPhi = Math.cos(this.phi);
    const sinTheta = Math.sin(this.theta);
    const cosTheta = Math.cos(this.theta);

    const dir = new THREE.Vector3(
      sinPhi * sinTheta,
      cosPhi,
      sinPhi * cosTheta
    );
    const pos = this.target.clone().addScaledVector(dir, this.radius);

    // Forward = -dir (camera looks toward target)
    const forward = dir.clone().negate().normalize();
    // World up
    const worldUp = new THREE.Vector3(0, 1, 0);
    // Right = forward × worldUp
    const right = new THREE.Vector3().crossVectors(forward, worldUp).normalize();
    // Up = right × forward
    const up = new THREE.Vector3().crossVectors(right, forward).normalize();

    return { pos, target: this.target.clone(), right, up, forward };
  }
}

// --------------------------------------------------------------------------
//  Cinematic director — drives camera along a path
// --------------------------------------------------------------------------
export class CinematicDirector {
  constructor() {
    this.pathName = 'orbit';
    this.enabled = true;       // true = playing cinematic, false = manual
    this.timeScale = 0.04;     // 1 loop per 25s
    this.elapsed = 0.0;
    this.pathStartTime = 0.0;
  }

  setPath(name) {
    if (!CAMERA_PATHS[name]) return;
    this.pathName = name;
    this.pathStartTime = this.elapsed;
  }

  cyclePath() {
    const idx = CAMERA_PATH_ORDER.indexOf(this.pathName);
    const next = (idx + 1) % CAMERA_PATH_ORDER.length;
    this.setPath(CAMERA_PATH_ORDER[next]);
    return CAMERA_PATH_ORDER[next];
  }

  toggle() {
    this.enabled = !this.enabled;
    return this.enabled;
  }

  update(dt) {
    this.elapsed += dt * this.timeScale;
  }

  getState() {
    if (!this.enabled) return null;
    const path = CAMERA_PATHS[this.pathName];
    if (!path) return null;
    const t = (this.elapsed - this.pathStartTime) % 1.0;
    const s = path.fn(t);
    return s;
  }
}

// --------------------------------------------------------------------------
//  URL screenshot mode
//    ?screenshot=1&seed=42&preset=cinematic&camera=orbit&time=12.5&quality=high
//    When screenshot=1, the app:
//      - Forces deterministic seed (no random grain per frame)
//      - Locks time to ?time= (or 0)
//      - Renders one frame at high quality
//      - Triggers a PNG download automatically
// --------------------------------------------------------------------------
export function parseScreenshotMode() {
  const params = new URLSearchParams(window.location.search);
  if (params.get('screenshot') !== '1') return null;
  return {
    enabled: true,
    seed: parseFloat(params.get('seed') || '42'),
    preset: params.get('preset') || 'cinematic',
    camera: params.get('camera') || 'orbit',
    time: parseFloat(params.get('time') || '12.5'),
    quality: params.get('quality') || 'high',
    pathTime: parseFloat(params.get('pathtime') || '0.25'),
  };
}
