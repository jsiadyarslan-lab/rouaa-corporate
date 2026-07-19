# GARGANTUA — Schwarzschild Black Hole Raytracer

A full-screen interactive WebGL visualization of a Schwarzschild black hole,
with **real null-geodesic integration** performed entirely in a fragment shader.
No meshes, textures, images, or video are used to fake the black hole — every
pixel is computed by integrating the photon path through curved spacetime.

---

## Quick start

```bash
cd gargantua
python3 -m http.server 8000
# then open http://localhost:8000/
```

Any static server works (`npx serve`, `php -S localhost:8000`, nginx, etc.).
Opening `index.html` directly via `file://` will **not** work because ES modules
require HTTP.

**Browser requirements:**
- WebGL2 (or WebGL1 with the `EXT_color_buffer_half_float` extension)
- Modern browser (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)

---

## What's in the box

```
gargantua/
├── index.html                 — Entry HTML
├── style.css                  — UI / HUD styling
├── README.md                  — This file
└── js/
    ├── main.js                — App lifecycle, render pipeline, hotkeys
    ├── params.js              — 21 parameters, 4 presets, 3 quality profiles
    ├── controls.js            — Camera paths + orbit controls + screenshot mode
    ├── hud.js                 — Telemetry HUD + parameter panel
    ├── audio.js               — Procedural WebAudio soundtrack
    ├── shaders/
    │   ├── raymarcher.glsl.js — Schwarzschild geodesic integrator (the physics)
    │   └── composite.glsl.js  — Bloom + ACES + vignette + grain + CA
    └── lib/three/
        ├── three.module.js    — Three.js r161 (local, no CDN)
        └── OrbitControls.js   — (bundled but unused; we have our own)
```

No external assets. No build step. No npm install.

---

## Physics

The shader integrates the **null geodesic equation** for Schwarzschild spacetime
in 3D Cartesian form, with the Schwarzschild radius set to `rs = 1`:

```
d²x⃗/dλ² = -1.5 · h² · x⃗ / r⁵
```

where `h = |x⃗ × v⃗|` is the conserved angular momentum. This form reproduces:

| Feature | Predicted | Computed |
|---|---|---|
| Photon sphere | r = 1.5 rs | r = 1.5 ✓ |
| ISCO (massive) | r = 6M = 3 rs | disk inner edge ✓ |
| Weak-field deflection | 4M/b = 2 rs/b | ✓ |
| Event horizon | r = rs | r = 1 ✓ |

Integration uses **RK4** with adaptive step size (smaller near the horizon).
Up to 450 steps per pixel at high quality. Disk plane crossings are detected
via sign change of the y-coordinate, with linear interpolation of the
crossing point — this produces the multi-crossing Einstein ring naturally.

### Disk model
- Shakura-Sunyaev temperature profile: `T ∝ r^(-3/4)`
- Procedural fbm turbulence in (angle, log r, time)
- Spiral arms (subtle shear)
- Relativistic Doppler beaming: `I' = I · D⁴` where `D = 1/[γ(1 - β·n̂)]`
- Gravitational redshift: `1+z = sqrt((1 - rs/r_obs) / (1 - rs/r_emit))`

### Background
- 3-octave procedural starfield with twinkle and blackbody-tinted star colors
- Procedural Milky Way: noise band along galactic plane with dust lanes and HII regions

---

## Features

### 21 live parameters
All editable in the right-side panel or via URL params. Each slider is
double-click-to-reset.

| # | Parameter | Range |
|---|---|---|
| 1 | BH Mass (M) | 0.3 – 2.0 |
| 2 | Disk Inner R | 1.5 – 6.0 |
| 3 | Disk Outer R | 6.0 – 30.0 |
| 4 | Disk Thickness | 0.02 – 0.8 |
| 5 | Disk Temperature | 0.2 – 3.0 |
| 6 | Disk Opacity | 0.1 – 2.0 |
| 7 | Turbulence Amp | 0.0 – 2.0 |
| 8 | Turbulence Freq | 0.2 – 6.0 |
| 9 | Disk Orbital Speed | 0.0 – 1.5 |
| 10 | Doppler Beaming | 0.0 – 2.0 |
| 11 | Redshift Strength | 0.0 – 1.5 |
| 12 | Star Brightness | 0.0 – 3.0 |
| 13 | Milky Way | 0.0 – 3.0 |
| 14 | Bloom Threshold | 0.05 – 4.0 |
| 15 | Exposure | 0.1 – 4.0 |
| 16 | ACES Contrast | 0.5 – 2.5 |
| 17 | Vignette | 0.0 – 2.0 |
| 18 | Film Grain | 0.0 – 0.2 |
| 19 | Chromatic Aberration | 0.0 – 2.0 |
| 20 | Camera FOV | 25 – 110° |
| 21 | Turbulence Speed | 0.0 – 3.0 |

### 4 presets
- **Cinematic** — balanced, dramatic, default
- **Scientific** — minimal post-processing, accurate colors
- **Interstellar** — heavy bloom, warm disk, vignette (movie-style)
- **Debug** — flat, no post-processing

### 3 quality profiles
| Profile | Pixel ratio | Steps | Bloom |
|---|---|---|---|
| Low | 0.5× | 100 | off |
| Medium | 0.75× | 220 | 1 iter |
| High | 1.0× (× devicePixelRatio, max 2) | 450 | 2 iter |

### 4 cinematic camera paths
- **Orbit** — slow circular orbit at r=18, gentle vertical bob
- **Dive** — approaches the photon sphere, then pulls back
- **Edge-on** — sweeps along the disk plane (maximum Doppler asymmetry)
- **Polar** — looks down from above the pole

### 10 debug views (keys 0-9)
| Key | View |
|---|---|
| 0 | Final composite |
| 1 | Raw raytraced color (no post) |
| 2 | Depth (step count) |
| 3 | Disk crossing count |
| 4 | Redshift visualization |
| 5 | Doppler factor magnitude |
| 6 | Starfield only |
| 7 | Step count heatmap |
| 8 | Ray exit direction |
| 9 | r_min / photon sphere |

### Hotkeys
| Key | Action |
|---|---|
| `0`-`9` | Debug view |
| `Space` | Pause/play |
| `C` | Cycle camera path |
| `P` | Cycle preset |
| `Q`/`E` | Quality down/up |
| `R` | Reset all parameters |
| `Shift+R` | Reset camera |
| `S` | Save screenshot (PNG) |
| `A` | Toggle audio |
| `H` | Toggle all panels |
| `T` | Toggle telemetry |
| `F` | Fullscreen |
| `Esc` | Hide parameter panel |

**Mouse:** left-drag = rotate, wheel = zoom, right-drag = pan.

### URL screenshot mode
Append `?screenshot=1` to capture a deterministic frame and trigger a PNG download:

```
http://localhost:8000/?screenshot=1&seed=42&preset=interstellar&camera=dive&time=12.5&pathtime=0.35&quality=high
```

| Param | Default | Notes |
|---|---|---|
| `seed` | 42 | Reserved for future deterministic noise |
| `preset` | cinematic | cinematic / scientific / interstellar / debug |
| `camera` | orbit | orbit / dive / edgeon / polar |
| `time` | 12.5 | Sim time in seconds (turbulence phase) |
| `pathtime` | 0.25 | Camera path phase in [0, 1) |
| `quality` | high | low / medium / high |

### Persistence
All parameters, quality, preset, debug view, and camera path persist in
`localStorage` under the key `gargantua.v1`. Clear browser storage to reset.

### WebGL context loss recovery
The app listens for `webglcontextlost` and `webglcontextrestored`. On restore,
all render targets, materials, and the post-processing pipeline are rebuilt
automatically — no page reload required.

### Procedural audio (optional, off by default — press `A`)
A WebAudio drone synthesized from two detuned oscillators, lowpass-filtered.
Frequency and filter cutoff modulate with proximity to the black hole.
Occasional "chirps" fire during edge-on disk crossings.

---

## Post-processing pipeline

```
Raymarcher (HDR RGBA16F)
   │
   ▼
Bright pass (½ res, threshold + soft knee)
   │
   ▼  ──┐
Blur H  │
   │   │  (× bloomIterations)
   ▼   │
Blur V ─┘
   │
   ▼
Composite: scene + bloom·intensity → ACES → sRGB → vignette → grain → CA
   │
   ▼
Screen
```

ACES is the **Narkowicz 2015** approximation (manual, no Three.js dependency).

Chromatic aberration samples the scene at three offset UVs — radial, scaled by
distance from screen center, so corners get more fringing than the center.

---

## Troubleshooting

**Black screen / "Failed to initialize"**
- Make sure you opened the page via `http://localhost:8000/`, not `file://`.
- Check the browser console (F12) for the actual error.
- On older GPUs, try the **Low** quality profile (key `Q`).
- WebGL2 + `EXT_color_buffer_half_float` is required for HDR render targets.

**Slow performance**
- Press `Q` to drop to Low quality.
- Reduce `Disk Outer R` and `Turbulence Freq` (these increase fragment work).
- Close other tabs using GPU.

**Context lost repeatedly**
- This usually means GPU memory pressure. Lower the quality profile.

---

## Verification

Run the headless-browser verification script:

```bash
node scripts/verify.js
```

It launches the page in a headless browser, checks for console errors, and
captures a screenshot to `scripts/screenshot.png`.

---

## License

Code: MIT.
Three.js (r161): MIT — see `js/lib/three/three.module.js` header.

Physics inspiration: Müller & Weiskopf (2010), Riazuelo (2020), and the
Interstellar science team's published derivation.
