// ============================================================================
//  hud.js — Telemetry HUD + parameter side panel + debug view indicator
// ============================================================================

import { PARAM_DEFS, PRESETS, PRESET_ORDER, QUALITY, QUALITY_ORDER } from './params.js';
import { CAMERA_PATHS, CAMERA_PATH_ORDER } from './controls.js';

export class HUD {
  constructor(app) {
    this.app = app;
    this.params = app.params;

    this.elTelemetry = document.getElementById('hud-telemetry');
    this.elFlash     = document.getElementById('hud-flash');
    this.elPanel     = document.getElementById('panel');
    this.elPanelToggle = document.getElementById('panel-toggle');
    this.elDebug     = document.getElementById('debug-indicator');
    this.elPreset    = document.getElementById('preset-indicator');
    this.elQuality   = document.getElementById('quality-indicator');
    this.elPath      = document.getElementById('camera-indicator');
    this.elAudio     = document.getElementById('audio-indicator');

    this._buildPanel();
    this._bindToggles();

    this._flashTimer = null;
    this._telemetryFrame = 0;
  }

  // ------------------------------------------------------------------------
  //  Build the side panel with all 21 parameter sliders
  // ------------------------------------------------------------------------
  _buildPanel() {
    const list = document.getElementById('panel-list');
    if (!list) return;
    list.innerHTML = '';

    for (const def of PARAM_DEFS) {
      const row = document.createElement('div');
      row.className = 'param-row';
      const id = def.id;

      const label = document.createElement('label');
      label.className = 'param-label';
      label.textContent = def.label;
      label.htmlFor = `param-${id}`;

      const value = document.createElement('span');
      value.className = 'param-value';
      value.id = `param-value-${id}`;
      value.textContent = this._formatValue(def, this.params[id]);

      const input = document.createElement('input');
      input.type = 'range';
      input.id = `param-${id}`;
      input.className = 'param-slider';
      input.min = def.min;
      input.max = def.max;
      input.step = def.step;
      input.value = this.params[id];

      input.addEventListener('input', () => {
        const v = parseFloat(input.value);
        this.params[id] = v;
        value.textContent = this._formatValue(def, v);
        // Sync uniform
        this.app.rayUniforms['u' + id].value = v;
        // Sync post uniforms if applicable
        this._syncPostParam(id, v);
        this.app._persist();
      });

      // Double-click to reset to default
      input.addEventListener('dblclick', () => {
        const dv = def.default;
        input.value = dv;
        this.params[id] = dv;
        value.textContent = this._formatValue(def, dv);
        this.app.rayUniforms['u' + id].value = dv;
        this._syncPostParam(id, dv);
        this.app._persist();
      });

      row.appendChild(label);
      row.appendChild(value);
      row.appendChild(input);
      list.appendChild(row);
    }

    // Preset buttons
    const presetRow = document.getElementById('panel-presets');
    if (presetRow) {
      presetRow.innerHTML = '';
      for (const name of PRESET_ORDER) {
        const btn = document.createElement('button');
        btn.className = 'btn-preset';
        btn.textContent = PRESETS[name].label;
        btn.dataset.preset = name;
        btn.addEventListener('click', () => {
          this.app.presetName = name;
          this.app.params = { ...PRESETS[name].params };
          this.app._applyPresetValues();
          this.refreshAll();
          this.flash(`Preset: ${PRESETS[name].label}`);
          this.app._persist();
        });
        presetRow.appendChild(btn);
      }
    }

    // Quality buttons
    const qualRow = document.getElementById('panel-quality');
    if (qualRow) {
      qualRow.innerHTML = '';
      for (const name of QUALITY_ORDER) {
        const btn = document.createElement('button');
        btn.className = 'btn-quality';
        btn.textContent = QUALITY[name].label;
        btn.dataset.quality = name;
        btn.addEventListener('click', () => {
          this.app.qualityName = name;
          this.app.rayUniforms.uSteps.value = QUALITY[name].steps;
          const q = QUALITY[name];
          this.app.compositeUniforms.uBloomIntensity.value = q.bloomEnabled ? 0.8 : 0.0;
          this.app.renderer.setPixelRatio(this.app._effectivePixelRatio());
          this.app._resize();
          this.refreshQuality();
          this.flash(`Quality: ${q.label}`);
          this.app._persist();
        });
        qualRow.appendChild(btn);
      }
    }

    // Camera path buttons
    const camRow = document.getElementById('panel-cameras');
    if (camRow) {
      camRow.innerHTML = '';
      for (const name of CAMERA_PATH_ORDER) {
        const btn = document.createElement('button');
        btn.className = 'btn-camera';
        btn.textContent = CAMERA_PATHS[name].label;
        btn.dataset.camera = name;
        btn.addEventListener('click', () => {
          this.app.cinematic.setPath(name);
          this.app.cinematic.enabled = true;
          this.app.pathName = name;
          this.refreshCamera();
          this.flash(`Camera: ${CAMERA_PATHS[name].label}`);
          this.app._persist();
        });
        camRow.appendChild(btn);
      }
    }

    // Debug view buttons
    const dbgRow = document.getElementById('panel-debug');
    if (dbgRow) {
      dbgRow.innerHTML = '';
      const dbgLabels = [
        'Final', 'Raw', 'Depth', 'Cross#', 'Redshift',
        'Doppler', 'Stars', 'Steps', 'Dir', 'Rmin'
      ];
      for (let i = 0; i < 10; i++) {
        const btn = document.createElement('button');
        btn.className = 'btn-debug';
        btn.textContent = `${i}:${dbgLabels[i]}`;
        btn.addEventListener('click', () => {
          this.app.debugView = i;
          this.app.rayUniforms.uDebugView.value = i;
          this.app.compositeUniforms.uDebugView.value = i;
          this.refreshDebug();
          this.flash(`Debug: ${i} (${dbgLabels[i]})`);
          this.app._persist();
        });
        dbgRow.appendChild(btn);
      }
    }

    // Audio toggle
    const audioBtn = document.getElementById('panel-audio-toggle');
    if (audioBtn) {
      audioBtn.addEventListener('click', () => {
        const on = this.app.audio.toggle();
        audioBtn.textContent = on ? 'Audio: ON' : 'Audio: OFF';
        this.flash(`Audio: ${on ? 'ON' : 'OFF'}`);
        this.app._persist();
      });
    }

    // Screenshot button
    const ssBtn = document.getElementById('panel-screenshot');
    if (ssBtn) {
      ssBtn.addEventListener('click', () => this.app._saveScreenshot());
    }
  }

  _formatValue(def, v) {
    if (def.step >= 1) return v.toFixed(0);
    if (def.step >= 0.1) return v.toFixed(1);
    if (def.step >= 0.01) return v.toFixed(2);
    return v.toFixed(3);
  }

  _syncPostParam(id, v) {
    const cu = this.app.compositeUniforms;
    const bu = this.app.brightUniforms;
    if (id === 'BloomThresh')   bu.uThreshold.value = v;
    if (id === 'Exposure')      cu.uExposure.value = v;
    if (id === 'AcesContrast')  cu.uAcesContrast.value = v;
    if (id === 'Vignette')      cu.uVignette.value = v;
    if (id === 'Grain')         cu.uGrain.value = v;
    if (id === 'ChromAb')       cu.uChromAb.value = v;
    if (id === 'CameraFov')     this.app.rayUniforms.uFovTan.value = Math.tan((v * Math.PI / 180) * 0.5);
  }

  _bindToggles() {
    if (this.elPanelToggle) {
      this.elPanelToggle.addEventListener('click', () => this.togglePanels());
    }
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.hidePanel();
    });
  }

  togglePanels() {
    document.body.classList.toggle('panel-hidden');
  }
  hidePanel() {
    document.body.classList.add('panel-hidden');
  }

  toggleTelemetry() {
    document.body.classList.toggle('telemetry-hidden');
  }

  refreshAll() {
    this.refreshParams();
    this.refreshPreset();
    this.refreshQuality();
    this.refreshCamera();
    this.refreshDebug();
  }

  refreshParams() {
    for (const def of PARAM_DEFS) {
      const input = document.getElementById(`param-${def.id}`);
      const value = document.getElementById(`param-value-${def.id}`);
      if (input) input.value = this.params[def.id];
      if (value) value.textContent = this._formatValue(def, this.params[def.id]);
    }
  }

  refreshPreset() {
    if (this.elPreset) this.elPreset.textContent = `Preset: ${PRESETS[this.app.presetName].label}`;
  }
  refreshQuality() {
    if (this.elQuality) {
      const q = QUALITY[this.app.qualityName];
      this.elQuality.textContent = `Quality: ${q.label} (${q.steps} steps)`;
    }
  }
  refreshCamera() {
    if (this.elPath) {
      this.elPath.textContent = `Camera: ${CAMERA_PATHS[this.app.pathName].label}`;
    }
  }
  refreshDebug() {
    if (this.elDebug) {
      this.elDebug.textContent = `Debug: ${this.app.debugView}`;
      this.elDebug.classList.toggle('active', this.app.debugView !== 0);
    }
  }

  // ------------------------------------------------------------------------
  //  Telemetry update (called per frame, throttled to ~5Hz)
  // ------------------------------------------------------------------------
  updateTelemetry(t, simTime) {
    this._telemetryFrame++;
    if (this._telemetryFrame % 12 !== 0) return; // ~5Hz at 60fps
    if (!this.elTelemetry || !t) return;

    const pos = t.pos;
    const r = pos.length();
    const rOverRs = r; // rs=1
    const rOverRph = r / 1.5;
    const fps = 1 / Math.max(this.app.clock.getDelta() * 0 + 0.016, 0.001);
    const fpsNow = window.gargantua ? (this._lastFps || 0) : 0;

    this.elTelemetry.innerHTML =
      `<div class="tel-row"><span>Camera Pos</span><span>${pos.x.toFixed(2)}, ${pos.y.toFixed(2)}, ${pos.z.toFixed(2)}</span></div>` +
      `<div class="tel-row"><span>r / r<sub>s</sub></span><span>${rOverRs.toFixed(3)}</span></div>` +
      `<div class="tel-row"><span>r / r<sub>ph</sub></span><span>${rOverRph.toFixed(3)}</span></div>` +
      `<div class="tel-row"><span>θ (az)</span><span>${t.theta.toFixed(3)} rad</span></div>` +
      `<div class="tel-row"><span>φ (pol)</span><span>${t.phi.toFixed(3)} rad</span></div>` +
      `<div class="tel-row"><span>Sim Time</span><span>${simTime.toFixed(2)} s</span></div>` +
      `<div class="tel-row"><span>Camera Mode</span><span>${t.cinematic ? 'Cinematic' : 'Manual'}</span></div>` +
      `<div class="tel-row"><span>Path</span><span>${t.path}</span></div>`;
  }

  // ------------------------------------------------------------------------
  //  Flash message
  // ------------------------------------------------------------------------
  flash(msg) {
    if (!this.elFlash) return;
    this.elFlash.textContent = msg;
    this.elFlash.classList.add('visible');
    if (this._flashTimer) clearTimeout(this._flashTimer);
    this._flashTimer = setTimeout(() => {
      this.elFlash.classList.remove('visible');
    }, 1500);
  }
}
