// ============================================================================
//  params.js — 21 live parameters, 4 presets, 3 quality profiles, persistence
// ============================================================================

const STORAGE_KEY = 'gargantua.v1';

// --------------------------------------------------------------------------
//  Parameter definitions
//    id        — shader uniform name (without leading 'u')
//    label     — UI label
//    min, max  — slider range
//    step      — slider step
//    default   — initial value
// --------------------------------------------------------------------------
export const PARAM_DEFS = [
  // Black hole & geometry -----------------------------------------------
  { id: 'Mass',           label: 'BH Mass (M)',         min: 0.3,   max: 2.0,   step: 0.01,  default: 1.0  },
  // Accretion disk ------------------------------------------------------
  { id: 'DiskInner',      label: 'Disk Inner R',        min: 1.5,   max: 6.0,   step: 0.05,  default: 3.0  },
  { id: 'DiskOuter',      label: 'Disk Outer R',        min: 6.0,   max: 30.0,  step: 0.1,   default: 12.0 },
  { id: 'DiskThickness',  label: 'Disk Thickness',      min: 0.02,  max: 0.8,   step: 0.01,  default: 0.15 },
  { id: 'DiskTemp',       label: 'Disk Temperature',    min: 0.2,   max: 3.0,   step: 0.01,  default: 1.4  },
  { id: 'DiskOpacity',    label: 'Disk Opacity',        min: 0.1,   max: 2.0,   step: 0.01,  default: 0.9  },
  { id: 'TurbAmp',        label: 'Turbulence Amp',      min: 0.0,   max: 2.0,   step: 0.01,  default: 1.0  },
  { id: 'TurbFreq',       label: 'Turbulence Freq',     min: 0.2,   max: 6.0,   step: 0.01,  default: 1.8  },
  { id: 'DiskSpeed',      label: 'Disk Orbital Speed',  min: 0.0,   max: 1.5,   step: 0.01,  default: 0.7  },
  { id: 'Doppler',        label: 'Doppler Beaming',     min: 0.0,   max: 2.0,   step: 0.01,  default: 1.0  },
  { id: 'Redshift',       label: 'Redshift Strength',   min: 0.0,   max: 1.5,   step: 0.01,  default: 1.0  },
  // Background ----------------------------------------------------------
  { id: 'StarBright',     label: 'Star Brightness',     min: 0.0,   max: 3.0,   step: 0.01,  default: 1.0  },
  { id: 'MilkyWay',       label: 'Milky Way',           min: 0.0,   max: 3.0,   step: 0.01,  default: 1.0  },
  // Post-processing -----------------------------------------------------
  { id: 'BloomThresh',    label: 'Bloom Threshold',     min: 0.05,  max: 4.0,   step: 0.01,  default: 0.7  },
  { id: 'Exposure',       label: 'Exposure',            min: 0.1,   max: 4.0,   step: 0.01,  default: 1.0  },
  { id: 'AcesContrast',   label: 'ACES Contrast',       min: 0.5,   max: 2.5,   step: 0.01,  default: 1.0  },
  { id: 'Vignette',       label: 'Vignette',            min: 0.0,   max: 2.0,   step: 0.01,  default: 0.55 },
  { id: 'Grain',          label: 'Film Grain',          min: 0.0,   max: 0.2,   step: 0.001, default: 0.035},
  { id: 'ChromAb',        label: 'Chromatic Aberr',     min: 0.0,   max: 2.0,   step: 0.01,  default: 0.25 },
  // Camera --------------------------------------------------------------
  { id: 'CameraFov',      label: 'Camera FOV (deg)',    min: 25.0,  max: 110.0, step: 0.5,   default: 60.0 },
  // Turbulence time -----------------------------------------------------
  { id: 'TurbTime',       label: 'Turbulence Speed',    min: 0.0,   max: 3.0,   step: 0.01,  default: 0.5  },
];

// Sanity check: exactly 21 parameters
if (PARAM_DEFS.length !== 21) {
  console.error(`PARAM_DEFS has ${PARAM_DEFS.length} entries, expected 21`);
}

// --------------------------------------------------------------------------
//  Presets — 4 cinematic configurations
// --------------------------------------------------------------------------
export const PRESETS = {
  cinematic: {
    label: 'Cinematic',
    params: {
      Mass: 1.0, DiskInner: 3.0, DiskOuter: 12.0, DiskThickness: 0.15,
      DiskTemp: 1.4, DiskOpacity: 0.9, TurbAmp: 1.0, TurbFreq: 1.8,
      DiskSpeed: 0.7, Doppler: 1.0, Redshift: 1.0,
      StarBright: 1.0, MilkyWay: 1.0,
      BloomThresh: 0.7, Exposure: 1.0, AcesContrast: 1.0,
      Vignette: 0.55, Grain: 0.035, ChromAb: 0.25,
      CameraFov: 60.0, TurbTime: 0.5,
    }
  },
  scientific: {
    label: 'Scientific',
    params: {
      Mass: 1.0, DiskInner: 3.0, DiskOuter: 14.0, DiskThickness: 0.10,
      DiskTemp: 1.2, DiskOpacity: 0.7, TurbAmp: 0.4, TurbFreq: 1.0,
      DiskSpeed: 0.8, Doppler: 1.0, Redshift: 1.0,
      StarBright: 1.2, MilkyWay: 1.2,
      BloomThresh: 1.2, Exposure: 0.85, AcesContrast: 0.9,
      Vignette: 0.15, Grain: 0.0, ChromAb: 0.0,
      CameraFov: 55.0, TurbTime: 0.3,
    }
  },
  interstellar: {
    label: 'Interstellar',
    params: {
      Mass: 1.0, DiskInner: 3.0, DiskOuter: 18.0, DiskThickness: 0.10,
      DiskTemp: 1.8, DiskOpacity: 1.1, TurbAmp: 0.7, TurbFreq: 1.2,
      DiskSpeed: 0.5, Doppler: 1.0, Redshift: 1.0,
      StarBright: 0.5, MilkyWay: 0.5,
      BloomThresh: 0.4, Exposure: 1.2, AcesContrast: 1.15,
      Vignette: 0.85, Grain: 0.05, ChromAb: 0.45,
      CameraFov: 65.0, TurbTime: 0.35,
    }
  },
  debug: {
    label: 'Debug',
    params: {
      Mass: 1.0, DiskInner: 3.0, DiskOuter: 12.0, DiskThickness: 0.20,
      DiskTemp: 1.5, DiskOpacity: 1.0, TurbAmp: 0.0, TurbFreq: 1.0,
      DiskSpeed: 0.7, Doppler: 1.0, Redshift: 1.0,
      StarBright: 1.0, MilkyWay: 1.0,
      BloomThresh: 2.0, Exposure: 1.0, AcesContrast: 1.0,
      Vignette: 0.0, Grain: 0.0, ChromAb: 0.0,
      CameraFov: 60.0, TurbTime: 0.5,
    }
  },
};

export const PRESET_ORDER = ['cinematic', 'scientific', 'interstellar', 'debug'];

// --------------------------------------------------------------------------
//  Quality profiles — 3 tiers
// --------------------------------------------------------------------------
export const QUALITY = {
  low: {
    label: 'Low',
    pixelRatio: 0.5,
    steps: 100,
    bloomEnabled: false,
    bloomIterations: 0,
  },
  medium: {
    label: 'Medium',
    pixelRatio: 0.75,
    steps: 220,
    bloomEnabled: true,
    bloomIterations: 1,
  },
  high: {
    label: 'High',
    pixelRatio: 1.0,   // multiplied by devicePixelRatio at runtime, capped at 2
    steps: 450,
    bloomEnabled: true,
    bloomIterations: 2,
  },
};

export const QUALITY_ORDER = ['low', 'medium', 'high'];

// --------------------------------------------------------------------------
//  Persistence
// --------------------------------------------------------------------------
export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed;
  } catch (e) {
    console.warn('Failed to load state:', e);
    return null;
  }
}

export function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('Failed to save state:', e);
  }
}

// --------------------------------------------------------------------------
//  Build initial params object from defaults
// --------------------------------------------------------------------------
export function defaultParams() {
  const p = {};
  for (const def of PARAM_DEFS) {
    p[def.id] = def.default;
  }
  return p;
}

// --------------------------------------------------------------------------
//  Apply a preset (returns new params object)
// --------------------------------------------------------------------------
export function applyPreset(presetName) {
  const preset = PRESETS[presetName];
  if (!preset) return defaultParams();
  return { ...preset.params };
}

// --------------------------------------------------------------------------
//  Validate / clamp a params object (in case localStorage has stale values)
// --------------------------------------------------------------------------
export function validateParams(p) {
  const out = {};
  for (const def of PARAM_DEFS) {
    let v = (p && typeof p[def.id] === 'number') ? p[def.id] : def.default;
    if (!isFinite(v)) v = def.default;
    v = Math.max(def.min, Math.min(def.max, v));
    out[def.id] = v;
  }
  return out;
}
