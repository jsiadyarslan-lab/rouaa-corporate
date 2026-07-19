// ============================================================================
//  audio.js — Synchronized procedural WebAudio soundtrack
//    Low drone tied to camera proximity to BH, plus chirps on disk crossings
// ============================================================================

export class AudioEngine {
  constructor() {
    this.enabled = false;
    this.ctx = null;
    this.master = null;
    this.droneOsc1 = null;
    this.droneOsc2 = null;
    this.droneGain = null;
    this.filter = null;
    this.lastChirpTime = 0;
    this._initialized = false;
  }

  _init() {
    if (this._initialized) return;
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) {
        console.warn('[Gargantua] WebAudio not available');
        return;
      }
      this.ctx = new Ctx();

      // Master gain
      this.master = this.ctx.createGain();
      this.master.gain.value = 0;
      this.master.connect(this.ctx.destination);

      // Lowpass filter for warmth
      this.filter = this.ctx.createBiquadFilter();
      this.filter.type = 'lowpass';
      this.filter.frequency.value = 800;
      this.filter.Q.value = 1.5;
      this.filter.connect(this.master);

      // Drone: two detuned oscillators
      this.droneOsc1 = this.ctx.createOscillator();
      this.droneOsc1.type = 'sawtooth';
      this.droneOsc1.frequency.value = 55; // A1

      this.droneOsc2 = this.ctx.createOscillator();
      this.droneOsc2.type = 'sine';
      this.droneOsc2.frequency.value = 82.5; // fifth above

      this.droneGain = this.ctx.createGain();
      this.droneGain.gain.value = 0.25;

      this.droneOsc1.connect(this.droneGain);
      this.droneOsc2.connect(this.droneGain);
      this.droneGain.connect(this.filter);

      this.droneOsc1.start();
      this.droneOsc2.start();

      this._initialized = true;
    } catch (e) {
      console.warn('[Gargantua] Audio init failed:', e);
    }
  }

  toggle() {
    if (!this._initialized) this._init();
    if (!this.ctx) return false;
    this.enabled = !this.enabled;
    if (this.enabled) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      this._rampTo(this.master.gain, 0.4, 0.5);
    } else {
      this._rampTo(this.master.gain, 0.0, 0.3);
    }
    return this.enabled;
  }

  // Slowly ramp a parameter
  _rampTo(param, value, time) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    param.cancelScheduledValues(t);
    param.setValueAtTime(param.value, t);
    param.linearRampToValueAtTime(value, t + time);
  }

  // Called per frame from main loop
  update(simTime, telemetry) {
    if (!this.enabled || !this.ctx) return;

    const now = this.ctx.currentTime;

    // Modulate drone frequency by camera radius
    if (telemetry && telemetry.radius != null) {
      const r = telemetry.radius;
      // Closer to BH → higher pitch + brighter filter
      const norm = Math.max(0, Math.min(1, (30 - r) / 30));
      const baseFreq = 40 + norm * 80;
      if (this.droneOsc1) this.droneOsc1.frequency.setTargetAtTime(baseFreq, now, 0.2);
      if (this.droneOsc2) this.droneOsc2.frequency.setTargetAtTime(baseFreq * 1.5, now, 0.2);
      if (this.filter) {
        this.filter.frequency.setTargetAtTime(400 + norm * 2000, now, 0.2);
        // Modulate filter Q for tension near horizon
        this.filter.Q.setTargetAtTime(0.5 + norm * 8, now, 0.2);
      }
    }

    // Chirp on disk crossing (throttled)
    if (telemetry && telemetry.cinematic && telemetry.path === 'edgeon') {
      // Approximate disk crossing detection: camera radius within disk range
      if (telemetry.radius > 3 && telemetry.radius < 12) {
        if (now - this.lastChirpTime > 1.5 + Math.random() * 2.0) {
          this._chirp();
          this.lastChirpTime = now;
        }
      }
    }
  }

  _chirp() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800 + Math.random() * 400, now);
    osc.frequency.exponentialRampToValueAtTime(200, now + 0.3);
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.15, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    osc.connect(gain);
    gain.connect(this.master);
    osc.start(now);
    osc.stop(now + 0.6);
  }
}
