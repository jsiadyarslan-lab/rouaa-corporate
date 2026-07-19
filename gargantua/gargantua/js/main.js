// ============================================================================
//  GARGANTUA — main.js
//  Schwarzschild Black Hole Raytracer — application orchestration
// ============================================================================

import * as THREE from './lib/three/three.module.js';

import {
  raymarcherVertexShader,
  raymarcherFragmentShader,
} from './shaders/raymarcher.glsl.js';
import {
  fullscreenVertex,
  brightPassFragment,
  blurFragment,
  compositeFragment,
} from './shaders/composite.glsl.js';
import {
  PARAM_DEFS, PRESETS, PRESET_ORDER, QUALITY, QUALITY_ORDER,
  defaultParams, applyPreset, validateParams, loadState, saveState,
} from './params.js';
import { OrbitController, CinematicDirector, parseScreenshotMode } from './controls.js';
import { HUD } from './hud.js';
import { AudioEngine } from './audio.js';

// --------------------------------------------------------------------------
//  Application
// --------------------------------------------------------------------------
class GargantuaApp {
  constructor() {
    this.canvas = document.getElementById('glcanvas');
    this.screenshotMode = parseScreenshotMode();

    // ---- State ----------------------------------------------------------
    this.params = defaultParams();
    this.qualityName = 'medium';
    this.presetName = 'cinematic';
    this.debugView = 0;
    this.pathName = 'orbit';

    // ---- Restore persisted state (unless screenshot mode) ---------------
    if (!this.screenshotMode) {
      const saved = loadState();
      if (saved) {
        this.params = validateParams(saved.params || defaultParams());
        this.qualityName = QUALITY_ORDER.includes(saved.qualityName) ? saved.qualityName : this.qualityName;
        this.presetName = PRESET_ORDER.includes(saved.presetName) ? saved.presetName : this.presetName;
        this.debugView = Number.isInteger(saved.debugView) ? saved.debugView : 0;
        this.pathName = saved.pathName || this.pathName;
      }
    } else {
      // Screenshot mode overrides
      this.presetName = PRESETS[this.screenshotMode.preset] ? this.screenshotMode.preset : 'cinematic';
      this.pathName = this.screenshotMode.camera;
      this.qualityName = QUALITY[this.screenshotMode.quality] ? this.screenshotMode.quality : 'high';
      this.params = applyPreset(this.presetName);
    }

    // ---- Time -----------------------------------------------------------
    this.clock = new THREE.Clock();
    this.simTime = 0.0;
    this.paused = false;

    // ---- Controllers ----------------------------------------------------
    this.orbit = new OrbitController(this.canvas);
    this.cinematic = new CinematicDirector();
    this.cinematic.setPath(this.pathName);
    if (this.screenshotMode) {
      this.cinematic.enabled = true;
      this.cinematic.elapsed = this.screenshotMode.pathTime;
    }

    // ---- Audio ----------------------------------------------------------
    this.audio = new AudioEngine();

    // ---- HUD ------------------------------------------------------------
    this.hud = new HUD(this);

    // ---- Render setup ---------------------------------------------------
    this._initRenderer();
    this._initScene();
    this._initPostFX();
    this._bindEvents();
    this._applyPresetValues();

    // ---- Persistence debounce ------------------------------------------
    this._saveTimer = null;

    // ---- Boot -----------------------------------------------------------
    this.hud.refreshAll();
    this._animate = this._animate.bind(this);

    // Remove loader after first render
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const loader = document.getElementById('loader');
        if (loader) {
          loader.classList.add('hidden');
          setTimeout(() => loader.remove(), 1000);
        }
      });
    });

    requestAnimationFrame(this._animate);
  }

  // ------------------------------------------------------------------------
  //  Renderer + context loss handling
  // ------------------------------------------------------------------------
  _initRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: false,
      alpha: false,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: true, // for screenshots
    });
    this.renderer.setPixelRatio(this._effectivePixelRatio());
    this._resize();

    // Context loss recovery
    this.canvas.addEventListener('webglcontextlost', (e) => {
      e.preventDefault();
      console.warn('[Gargantua] WebGL context lost. Will attempt recovery.');
      this._contextLost = true;
      this.hud.flash('WebGL context lost — recovering…');
    });
    this.canvas.addEventListener('webglcontextrestored', () => {
      console.log('[Gargantua] WebGL context restored. Rebuilding.');
      this._disposePostFX();
      this._initScene();
      this._initPostFX();
      this._contextLost = false;
      this.hud.flash('WebGL context restored.');
    });
  }

  _effectivePixelRatio() {
    const q = QUALITY[this.qualityName];
    const dpr = window.devicePixelRatio || 1;
    return Math.max(0.25, Math.min(2.0, dpr * q.pixelRatio));
  }

  _resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.renderer.setPixelRatio(this._effectivePixelRatio());
    this.renderer.setSize(w, h, false);
    this.canvas.style.width = w + 'px';
    this.canvas.style.height = h + 'px';
    this.width = w;
    this.height = h;
    if (this.sceneRT) this._rebuildRenderTargets();
  }

  // ------------------------------------------------------------------------
  //  Scene: a fullscreen triangle + the raymarcher material
  // ------------------------------------------------------------------------
  _initScene() {
    this.scene = new THREE.Scene();
    // Orthographic camera is fine since we bypass it in the vertex shader
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    // Fullscreen triangle (covers viewport with 1 big triangle)
    const geom = new THREE.BufferGeometry();
    const verts = new Float32Array([
      -1, -1, 0,
       3, -1, 0,
      -1,  3, 0,
    ]);
    const uvs = new Float32Array([
      0, 0,
      2, 0,
      0, 2,
    ]);
    geom.setAttribute('position', new THREE.BufferAttribute(verts, 3));
    geom.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));

    // Raymarcher material
    this.rayUniforms = {
      uResolution:   { value: new THREE.Vector2(this.width, this.height) },
      uTime:         { value: 0 },
      uCameraPos:    { value: new THREE.Vector3(20, 4, 0) },
      uCameraBasis:  { value: new THREE.Matrix3() },
      uFovTan:       { value: Math.tan((this.params.CameraFov * Math.PI / 180) * 0.5) },
      uSteps:        { value: QUALITY[this.qualityName].steps },
      uDebugView:    { value: this.debugView },
    };
    // Add 21 param uniforms
    for (const def of PARAM_DEFS) {
      this.rayUniforms['u' + def.id] = { value: this.params[def.id] };
    }

    this.rayMaterial = new THREE.ShaderMaterial({
      vertexShader: raymarcherVertexShader,
      fragmentShader: raymarcherFragmentShader,
      uniforms: this.rayUniforms,
      depthTest: false,
      depthWrite: false,
    });

    this.rayMesh = new THREE.Mesh(geom, this.rayMaterial);
    this.scene.add(this.rayMesh);
  }

  // ------------------------------------------------------------------------
  //  Post-processing pipeline:
  //    sceneRT (HDR RGBA16F) → brightPassRT (half-res) → blurH → blurV → composite → screen
  // ------------------------------------------------------------------------
  _initPostFX() {
    const q = QUALITY[this.qualityName];
    const w = this.width, h = this.height;
    const hw = Math.max(1, Math.floor(w / 2));
    const hh = Math.max(1, Math.floor(h / 2));

    // HDR scene target
    this.sceneRT = new THREE.WebGLRenderTarget(w, h, {
      type: THREE.HalfFloatType,
      format: THREE.RGBAFormat,
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      depthBuffer: false,
      stencilBuffer: false,
    });

    // Half-res targets for bloom
    this.brightRT = new THREE.WebGLRenderTarget(hw, hh, {
      type: THREE.HalfFloatType,
      format: THREE.RGBAFormat,
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      depthBuffer: false,
    });
    this.blurH_RT = new THREE.WebGLRenderTarget(hw, hh, {
      type: THREE.HalfFloatType,
      format: THREE.RGBAFormat,
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      depthBuffer: false,
    });
    this.blurV_RT = new THREE.WebGLRenderTarget(hw, hh, {
      type: THREE.HalfFloatType,
      format: THREE.RGBAFormat,
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      depthBuffer: false,
    });

    // Post-process scene (uses same fullscreen geometry approach)
    const geom = new THREE.PlaneGeometry(2, 2);
    this.postScene = new THREE.Scene();
    this.postCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    // Bright-pass material
    this.brightUniforms = {
      uScene:     { value: this.sceneRT.texture },
      uThreshold: { value: this.params.BloomThresh },
      uSoftKnee:  { value: 0.5 },
    };
    this.brightMaterial = new THREE.ShaderMaterial({
      vertexShader: fullscreenVertex,
      fragmentShader: brightPassFragment,
      uniforms: this.brightUniforms,
      depthTest: false, depthWrite: false,
    });

    // Blur materials (reused for H and V passes)
    this.blurHUniforms = {
      uTex:       { value: null },
      uDirection: { value: new THREE.Vector2(1, 0) },
      uTexelSize: { value: new THREE.Vector2(1 / hw, 1 / hh) },
    };
    this.blurVUniforms = {
      uTex:       { value: null },
      uDirection: { value: new THREE.Vector2(0, 1) },
      uTexelSize: { value: new THREE.Vector2(1 / hw, 1 / hh) },
    };
    this.blurHMaterial = new THREE.ShaderMaterial({
      vertexShader: fullscreenVertex,
      fragmentShader: blurFragment,
      uniforms: this.blurHUniforms,
      depthTest: false, depthWrite: false,
    });
    this.blurVMaterial = new THREE.ShaderMaterial({
      vertexShader: fullscreenVertex,
      fragmentShader: blurFragment,
      uniforms: this.blurVUniforms,
      depthTest: false, depthWrite: false,
    });

    // Composite material
    this.compositeUniforms = {
      uScene:          { value: this.sceneRT.texture },
      uBloom:          { value: this.blurV_RT.texture },
      uResolution:     { value: new THREE.Vector2(w, h) },
      uTime:           { value: 0 },
      uExposure:       { value: this.params.Exposure },
      uBloomIntensity: { value: q.bloomEnabled ? 0.8 : 0.0 },
      uAcesContrast:   { value: this.params.AcesContrast },
      uVignette:       { value: this.params.Vignette },
      uGrain:          { value: this.params.Grain },
      uChromAb:        { value: this.params.ChromAb },
      uDebugView:      { value: this.debugView },
    };
    this.compositeMaterial = new THREE.ShaderMaterial({
      vertexShader: fullscreenVertex,
      fragmentShader: compositeFragment,
      uniforms: this.compositeUniforms,
      depthTest: false, depthWrite: false,
    });

    this.brightMesh = new THREE.Mesh(geom, this.brightMaterial);
    this.blurHMesh = new THREE.Mesh(geom, this.blurHMaterial);
    this.blurVMesh = new THREE.Mesh(geom, this.blurVMaterial);
    this.compositeMesh = new THREE.Mesh(geom, this.compositeMaterial);
  }

  _disposePostFX() {
    [this.sceneRT, this.brightRT, this.blurH_RT, this.blurV_RT].forEach(rt => {
      if (rt) rt.dispose();
    });
    [this.rayMaterial, this.brightMaterial, this.blurHMaterial,
     this.blurVMaterial, this.compositeMaterial].forEach(m => {
      if (m) m.dispose();
    });
  }

  _rebuildRenderTargets() {
    const q = QUALITY[this.qualityName];
    const w = this.width, h = this.height;
    const hw = Math.max(1, Math.floor(w / 2));
    const hh = Math.max(1, Math.floor(h / 2));

    this.sceneRT.setSize(w, h);
    this.brightRT.setSize(hw, hh);
    this.blurH_RT.setSize(hw, hh);
    this.blurV_RT.setSize(hw, hh);

    this.rayUniforms.uResolution.value.set(w, h);
    this.compositeUniforms.uResolution.value.set(w, h);
    this.blurHUniforms.uTexelSize.value.set(1 / hw, 1 / hh);
    this.blurVUniforms.uTexelSize.value.set(1 / hw, 1 / hh);
  }

  // ------------------------------------------------------------------------
  //  Apply current preset values to params + uniforms
  // ------------------------------------------------------------------------
  _applyPresetValues() {
    // Already in this.params; sync uniforms
    for (const def of PARAM_DEFS) {
      this.rayUniforms['u' + def.id].value = this.params[def.id];
    }
    // Post uniforms that depend on params
    this.brightUniforms.uThreshold.value = this.params.BloomThresh;
    this.compositeUniforms.uExposure.value = this.params.Exposure;
    this.compositeUniforms.uAcesContrast.value = this.params.AcesContrast;
    this.compositeUniforms.uVignette.value = this.params.Vignette;
    this.compositeUniforms.uGrain.value = this.params.Grain;
    this.compositeUniforms.uChromAb.value = this.params.ChromAb;
    // FOV
    this.rayUniforms.uFovTan.value = Math.tan((this.params.CameraFov * Math.PI / 180) * 0.5);
  }

  // ------------------------------------------------------------------------
  //  Event binding
  // ------------------------------------------------------------------------
  _bindEvents() {
    window.addEventListener('resize', () => this._resize());

    // Hotkeys
    window.addEventListener('keydown', (e) => this._onKey(e));
  }

  _onKey(e) {
    // Ignore when typing in an input
    if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;

    const key = e.key.toLowerCase();

    // Debug views 0-9
    if (/^[0-9]$/.test(e.key)) {
      this.debugView = parseInt(e.key, 10);
      this.rayUniforms.uDebugView.value = this.debugView;
      this.compositeUniforms.uDebugView.value = this.debugView;
      this.hud.flash(`Debug view: ${this.debugView}`);
      this.hud.refreshDebug();
      this._persist();
      return;
    }

    switch (key) {
      case ' ':
        e.preventDefault();
        this.paused = !this.paused;
        this.hud.flash(this.paused ? 'Paused' : 'Playing');
        break;
      case 'c':
        const next = this.cinematic.cyclePath();
        this.pathName = next;
        this.hud.flash(`Camera: ${next}`);
        this.hud.refreshCamera();
        this._persist();
        break;
      case 'p':
        const idx = PRESET_ORDER.indexOf(this.presetName);
        this.presetName = PRESET_ORDER[(idx + 1) % PRESET_ORDER.length];
        this.params = applyPreset(this.presetName);
        this._applyPresetValues();
        this.hud.refreshAll();
        this.hud.flash(`Preset: ${PRESETS[this.presetName].label}`);
        this._persist();
        break;
      case 'q':
        this._cycleQuality(-1);
        break;
      case 'e':
        this._cycleQuality(1);
        break;
      case 'r':
        if (e.shiftKey) {
          this.orbit.theta = 0;
          this.orbit.phi = Math.PI * 0.35;
          this.orbit.radius = 20;
          this.orbit.targetTheta = 0;
          this.orbit.targetPhi = Math.PI * 0.35;
          this.orbit.targetRadius = 20;
          this.orbit.target.set(0, 0, 0);
          this.hud.flash('Camera reset');
        } else {
          this.params = defaultParams();
          this._applyPresetValues();
          this.hud.refreshAll();
          this.hud.flash('Params reset');
          this._persist();
        }
        break;
      case 's':
        this._saveScreenshot();
        break;
      case 'a':
        const on = this.audio.toggle();
        this.hud.flash(`Audio: ${on ? 'ON' : 'OFF'}`);
        this._persist();
        break;
      case 'h':
        this.hud.togglePanels();
        break;
      case 't':
        this.hud.toggleTelemetry();
        break;
      case 'f':
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen();
        } else {
          document.exitFullscreen();
        }
        break;
      case 'escape':
        this.hud.hidePanel();
        break;
    }
  }

  _cycleQuality(dir) {
    const idx = QUALITY_ORDER.indexOf(this.qualityName);
    const next = (idx + dir + QUALITY_ORDER.length) % QUALITY_ORDER.length;
    this.qualityName = QUALITY_ORDER[next];
    this.rayUniforms.uSteps.value = QUALITY[this.qualityName].steps;
    const q = QUALITY[this.qualityName];
    this.compositeUniforms.uBloomIntensity.value = q.bloomEnabled ? 0.8 : 0.0;
    this.renderer.setPixelRatio(this._effectivePixelRatio());
    this._resize();
    this.hud.flash(`Quality: ${q.label} (${q.steps} steps)`);
    this.hud.refreshQuality();
    this._persist();
  }

  // ------------------------------------------------------------------------
  //  Screenshot (PNG download)
  // ------------------------------------------------------------------------
  _saveScreenshot() {
    // Force a render so the buffer is current
    this._renderFrame();
    this.canvas.toBlob((blob) => {
      if (!blob) {
        this.hud.flash('Screenshot failed');
        return;
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const ts = new Date().toISOString().replace(/[:.]/g, '-');
      a.href = url;
      a.download = `gargantua-${ts}.png`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      this.hud.flash('Screenshot saved');
    }, 'image/png');
  }

  // ------------------------------------------------------------------------
  //  Persist state to localStorage (debounced)
  // ------------------------------------------------------------------------
  _persist() {
    if (this.screenshotMode) return;
    if (this._saveTimer) clearTimeout(this._saveTimer);
    this._saveTimer = setTimeout(() => {
      saveState({
        params: this.params,
        qualityName: this.qualityName,
        presetName: this.presetName,
        debugView: this.debugView,
        pathName: this.pathName,
      });
    }, 250);
  }

  // ------------------------------------------------------------------------
  //  Camera basis matrix from right/up/forward vectors
  // ------------------------------------------------------------------------
  _buildCameraBasis(right, up, forward) {
    // The matrix maps screen (x,y,-1) to world ray direction.
    // Columns: right, up, -forward
    const m = new THREE.Matrix3();
    m.set(
      right.x, up.x, -forward.x,
      right.y, up.y, -forward.y,
      right.z, up.z, -forward.z
    );
    return m;
  }

  // ------------------------------------------------------------------------
  //  Per-frame camera update
  // ------------------------------------------------------------------------
  _updateCamera(dt) {
    this.cinematic.update(dt);
    const cState = this.cinematic.getState();
    if (cState) {
      // Cinematic drive: set orbit controller's position from path
      this.orbit.setFromPosition(cState.pos, cState.target);
    }
    this.orbit.update();
    const s = this.orbit.getCameraState();

    this.rayUniforms.uCameraPos.value.copy(s.pos);
    this.rayUniforms.uCameraBasis.value.copy(this._buildCameraBasis(s.right, s.up, s.forward));

    // Telemetry
    this._telemetry = {
      pos: s.pos,
      target: s.target,
      radius: this.orbit.radius,
      theta: this.orbit.theta,
      phi: this.orbit.phi,
      cinematic: this.cinematic.enabled,
      path: this.cinematic.pathName,
    };
  }

  // ------------------------------------------------------------------------
  //  Render one frame
  // ------------------------------------------------------------------------
  _renderFrame() {
    if (this._contextLost) return;

    const q = QUALITY[this.qualityName];

    // 1. Raymarch into sceneRT (HDR)
    this.renderer.setRenderTarget(this.sceneRT);
    this.renderer.render(this.scene, this.camera);

    if (q.bloomEnabled && this.debugView === 0) {
      // 2. Bright pass → brightRT
      this.brightUniforms.uScene.value = this.sceneRT.texture;
      this.brightUniforms.uThreshold.value = this.params.BloomThresh;
      this.renderer.setRenderTarget(this.brightRT);
      this.renderer.render(this.postScene, this.postCamera); // postScene has multiple meshes — set visibility

      // Actually we use separate meshes per pass; let's render them one at a time.
      // Simpler approach: swap scene.children visibility.
    }

    // For clarity, render each post pass via a tiny temporary scene swap:
    // We'll just render the appropriate mesh by setting it as the only visible one.
    if (q.bloomEnabled && this.debugView === 0) {
      // Re-do with proper mesh selection
      this._renderPostPass(this.brightMesh, this.brightRT, this.sceneRT.texture, this.brightUniforms);

      // Iterative blur (ping-pong for multiple iterations)
      let src = this.brightRT.texture;
      for (let i = 0; i < q.bloomIterations; i++) {
        this._renderPostPass(this.blurHMesh, this.blurH_RT, src, this.blurHUniforms);
        src = this.blurH_RT.texture;
        this._renderPostPass(this.blurVMesh, this.blurV_RT, src, this.blurVUniforms);
        src = this.blurV_RT.texture;
      }
      // Final blur V
      this._renderPostPass(this.blurHMesh, this.blurH_RT, src, this.blurHUniforms);
      this._renderPostPass(this.blurVMesh, this.blurV_RT, this.blurH_RT.texture, this.blurVUniforms);

      this.compositeUniforms.uBloom.value = this.blurV_RT.texture;
    } else {
      this.compositeUniforms.uBloom.value = this.sceneRT.texture; // dummy — bloom intensity 0
    }

    // 3. Composite → screen
    this.compositeUniforms.uScene.value = this.sceneRT.texture;
    this.compositeUniforms.uTime.value = this.simTime;
    this.compositeUniforms.uExposure.value = this.params.Exposure;
    this.compositeUniforms.uAcesContrast.value = this.params.AcesContrast;
    this.compositeUniforms.uVignette.value = this.params.Vignette;
    this.compositeUniforms.uGrain.value = this.params.Grain;
    this.compositeUniforms.uChromAb.value = this.params.ChromAb;
    this.compositeUniforms.uDebugView.value = this.debugView;

    this.renderer.setRenderTarget(null);
    // Render compositeMesh alone
    this._renderPostPass(this.compositeMesh, null, this.sceneRT.texture, this.compositeUniforms);
  }

  // Helper: render a single fullscreen mesh to a target
  _renderPostPass(mesh, target, srcTex, uniforms) {
    if (uniforms.uScene) uniforms.uScene.value = srcTex;
    if (uniforms.uTex)   uniforms.uTex.value = srcTex;

    // Build a temporary scene with just this mesh
    if (!this._postScenes) this._postScenes = new Map();
    let s = this._postScenes.get(mesh);
    if (!s) {
      s = new THREE.Scene();
      s.add(mesh);
      this._postScenes.set(mesh, s);
    }
    this.renderer.setRenderTarget(target);
    this.renderer.render(s, this.postCamera);
  }

  // ------------------------------------------------------------------------
  //  Animation loop
  // ------------------------------------------------------------------------
  _animate() {
    requestAnimationFrame(this._animate);
    if (this._contextLost) return;

    const dt = Math.min(this.clock.getDelta(), 1 / 30);
    if (!this.paused && !this.screenshotMode) {
      this.simTime += dt;
    } else if (this.screenshotMode) {
      this.simTime = this.screenshotMode.time;
    }

    // Update uniforms
    this.rayUniforms.uTime.value = this.simTime;

    // Update camera
    this._updateCamera(dt);

    // Audio
    this.audio.update(this.simTime, this._telemetry);

    // Render
    this._renderFrame();

    // Update HUD telemetry (throttled)
    this.hud.updateTelemetry(this._telemetry, this.simTime);

    // Screenshot mode: save and stop after first frame
    if (this.screenshotMode && !this._screenshotSaved) {
      this._screenshotSaved = true;
      // Wait for next frame so the render is complete
      setTimeout(() => this._saveScreenshot(), 100);
    }
  }
}

// --------------------------------------------------------------------------
//  Boot
// --------------------------------------------------------------------------
window.addEventListener('DOMContentLoaded', () => {
  try {
    window.gargantua = new GargantuaApp();
    console.log('%c[GARGANTUA] Schwarzschild Black Hole Raytracer initialized',
      'color:#f80;font-weight:bold;');
    console.log('Hotkeys: 0-9 debug views, Space pause, C cycle camera, P cycle preset,');
    console.log('         Q/E quality, R reset, S screenshot, A audio, H toggle HUD,');
    console.log('         T telemetry, F fullscreen, Shift+R camera reset');
  } catch (e) {
    console.error('[Gargantua] Failed to initialize:', e);
    document.body.innerHTML =
      '<div style="color:#f55;padding:2em;font-family:monospace;">' +
      '<h2>GARGANTUA failed to initialize</h2>' +
      '<pre>' + (e && e.stack || e) + '</pre>' +
      '<p>Make sure you are serving this page over HTTP (not file://) ' +
      'and that your browser supports WebGL2 / HalfFloat render targets.</p>' +
      '</div>';
  }
});
