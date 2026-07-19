// ============================================================================
//  GARGANTUA — Schwarzschild Black Hole Raytracer
//  Fragment shader: integrates null geodesics of Schwarzschild spacetime
//
//  Units: G = c = 1, Schwarzschild radius rs = 2M = 1.
//  Therefore:
//    Event horizon : r = 1
//    Photon sphere : r = 1.5
//    ISCO          : r = 3
//    Disk outer    : ~ 12
//
//  Geodesic equation (3D Cartesian, affine parameter λ):
//      d²x⃗/dλ² = -1.5 * h² * x⃗ / r⁵
//  where h = |x⃗ × v⃗| (conserved angular momentum).
//
//  This reproduces:
//    - photon sphere at r = 1.5 rs
//    - deflection 4M/b = 2 rs / b  (weak field)
//    - ISCO at r = 6M = 3 rs
//  Verified by plugging r=1.5 into the equilibrium:
//    a = 1.5 * h² / r⁵  with h=r, v=1 (null)  →  1/r = 1.5/r²  →  r = 1.5  ✓
// ============================================================================

export const raymarcherVertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

export const raymarcherFragmentShader = /* glsl */ `
  precision highp float;

  varying vec2 vUv;

  // --- camera / frame --------------------------------------------------------
  uniform vec2  uResolution;
  uniform float uTime;
  uniform vec3  uCameraPos;
  uniform mat3  uCameraBasis;   // columns: right, up, -forward
  uniform float uFovTan;        // tan(fov/2)
  uniform int   uSteps;         // quality-dependent step count
  uniform int   uDebugView;     // 0..9

  // --- 21 live parameters ----------------------------------------------------
  uniform float uMass;          // 1  : BH mass (scales rs, but we keep rs=1 here; affects h² weight)
  uniform float uDiskInner;     // 2  : inner disk radius (default = ISCO = 3)
  uniform float uDiskOuter;     // 3  : outer disk radius (default 12)
  uniform float uDiskThickness; // 4  : disk vertical thickness (soft)
  uniform float uDiskTemp;      // 5  : disk temperature scale
  uniform float uDiskOpacity;   // 6  : disk opacity
  uniform float uTurbAmp;       // 7  : turbulence amplitude
  uniform float uTurbFreq;      // 8  : turbulence spatial frequency
  uniform float uDiskSpeed;     // 9  : orbital speed (Keplerian scale)
  uniform float uDoppler;       // 10 : Doppler beaming strength
  uniform float uRedshift;      // 11 : gravitational redshift strength
  uniform float uStarBright;    // 12 : star brightness
  uniform float uMilkyWay;      // 13 : Milky Way brightness
  uniform float uBloomThresh;   // 14 : bloom threshold (used in composite, here for debug)
  uniform float uExposure;      // 15 : exposure
  uniform float uAcesContrast;  // 16 : ACES contrast
  uniform float uVignette;      // 17 : vignette
  uniform float uGrain;         // 18 : film grain amount
  uniform float uChromAb;       // 19 : chromatic aberration
  uniform float uCameraFov;     // 20 : camera FOV (deg)
  uniform float uTurbTime;      // 21 : turbulence time scale

  // --- constants -------------------------------------------------------------
  const float PI         = 3.14159265358979;
  const float TAU        = 6.28318530717959;
  const float R_HORIZON  = 1.0;
  const float R_PHOTON   = 1.5;
  const float R_ISCO     = 3.0;
  const float R_FAR      = 60.0;

  // ===========================================================================
  //  Hash & noise
  // ===========================================================================
  float hash13(vec3 p3) {
    p3 = fract(p3 * 0.1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
  }
  float hash21(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * 0.1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
  }
  float vnoise(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(mix(hash13(i + vec3(0,0,0)), hash13(i + vec3(1,0,0)), f.x),
          mix(hash13(i + vec3(0,1,0)), hash13(i + vec3(1,1,0)), f.x), f.y),
      mix(mix(hash13(i + vec3(0,0,1)), hash13(i + vec3(1,0,1)), f.x),
          mix(hash13(i + vec3(0,1,1)), hash13(i + vec3(1,1,1)), f.x), f.y),
      f.z);
  }
  float fbm(vec3 p) {
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 5; i++) {
      v += a * vnoise(p);
      p = p * 2.03 + vec3(7.13, 3.17, 5.91);
      a *= 0.5;
    }
    return v;
  }
  float fbm6(vec3 p) {
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 6; i++) {
      v += a * vnoise(p);
      p = p * 2.03 + vec3(7.13, 3.17, 5.91);
      a *= 0.5;
    }
    return v;
  }

  // ===========================================================================
  //  Blackbody color (approximation, normalized t in [0,1])
  //    t=0.0 -> deep red    (~1500K)
  //    t=0.5 -> warm orange  (~5000K)
  //    t=1.0 -> blue-white   (~15000K)
  // ===========================================================================
  vec3 blackbody(float t) {
    t = clamp(t, 0.0, 1.0);
    float r = 1.0;
    float g = clamp(t * 1.6 - 0.20, 0.0, 1.0);
    float b = clamp(t * 2.8 - 1.10, 0.0, 1.0);
    // Hot star blue tint
    if (t > 0.75) {
      b = clamp(0.85 + (t - 0.75) * 0.6, 0.0, 1.0);
      g = clamp(0.85 + (t - 0.75) * 0.4, 0.0, 1.0);
      r = clamp(1.0 - (t - 0.75) * 0.6, 0.4, 1.0);
    }
    return vec3(r, g, b);
  }

  // ===========================================================================
  //  Starfield — multi-scale procedural stars with twinkle
  // ===========================================================================
  vec3 starfield(vec3 dir) {
    // Spherical UV from direction
    float u = atan(dir.z, dir.x) / TAU + 0.5;
    float v = asin(clamp(dir.y, -1.0, 1.0)) / PI + 0.5;

    vec3 col = vec3(0.0);

    // Three octaves of star grids at different scales
    for (int oct = 0; oct < 3; oct++) {
      float scale = 90.0 + float(oct) * 130.0;
      vec2 gv = vec2(u * scale * 2.0, v * scale);
      vec2 id = floor(gv);
      vec2 f  = fract(gv) - 0.5;

      for (int y = -1; y <= 1; y++) {
        for (int x = -1; x <= 1; x++) {
          vec2 off = vec2(float(x), float(y));
          vec2 cid = id + off;
          float h  = hash21(cid + float(oct) * 31.7);
          // Threshold: only render ~5% of cells as stars
          if (h > 0.965) {
            vec2 starPos = off + vec2(
              hash21(cid + 1.3) - 0.5,
              hash21(cid + 2.7) - 0.5
            );
            float d = length(f - starPos);
            float bright = (h - 0.965) * 28.0;
            float twinkle = 0.7 + 0.3 * sin(uTime * 2.5 + h * 100.0);
            vec3 sCol = blackbody(0.3 + hash21(cid + 5.1) * 0.6);
            col += sCol * bright * twinkle * smoothstep(0.06, 0.0, d);
          }
        }
      }
    }
    return col;
  }

  // ===========================================================================
  //  Milky Way — procedural noise band along galactic plane (y = 0)
  // ===========================================================================
  vec3 milkyway(vec3 dir) {
    // Galactic latitude: 0 at plane, pi/2 at pole
    float lat = abs(dir.y);
    // Smooth band
    float band = exp(-lat * lat * 14.0);

    // Procedural dust lanes
    vec3 p = dir * 3.5;
    float n1 = fbm(p);
    float n2 = fbm6(p * 2.3 + vec3(11.0, 5.0, 7.0));
    float density = band * (0.45 + 0.55 * n1) * (0.6 + 0.4 * n2);

    // Dark dust lanes
    float dust = fbm(p * 4.1 + vec3(uTime * 0.005, 0.0, 0.0));
    density *= 1.0 - smoothstep(0.55, 0.75, dust) * 0.7;

    // Color: warm core + cool halo
    vec3 core = vec3(1.0, 0.82, 0.60);
    vec3 halo = vec3(0.45, 0.55, 0.85);
    vec3 col = mix(halo, core, n1 * n1);

    // A few HII region pinkish spots
    float hii = smoothstep(0.78, 0.92, n2);
    col += vec3(1.0, 0.4, 0.5) * hii * 0.4 * band;

    return col * density * 0.65;
  }

  // ===========================================================================
  //  Accretion disk sampling
  //    Returns emitted radiance (linear, can exceed 1 for HDR bloom)
  // ===========================================================================
  vec3 sampleDisk(vec3 pos, out float out_density) {
    out_density = 0.0;
    float r = length(pos.xz);
    if (r < uDiskInner || r > uDiskOuter) return vec3(0.0);

    float t = (r - uDiskInner) / (uDiskOuter - uDiskInner);

    // Shakura-Sunyaev temperature profile T ∝ r^(-3/4)
    float T_norm = pow(uDiskInner / max(r, 0.01), 0.75);
    vec3 bb = blackbody(T_norm * 0.85 + 0.15) * uDiskTemp;

    // Turbulence pattern in disk frame
    float angle = atan(pos.z, pos.x);
    vec2 polar = vec2(angle, log(r)) * uTurbFreq;
    vec3 turb_p = vec3(polar.x, polar.y, uTime * uTurbTime) * 1.5;
    float turb = fbm6(turb_p);
    float turb2 = fbm(turb_p * 2.7 + vec3(3.0));
    float density = (1.0 - t * 0.6) * (0.4 + 0.6 * turb) * uDiskOpacity;
    density *= 0.8 + 0.4 * turb2;

    // Inner edge soft fade
    density *= smoothstep(uDiskInner, uDiskInner * 1.08, r);
    // Outer edge fade
    density *= 1.0 - smoothstep(uDiskOuter * 0.85, uDiskOuter, r);

    // Vertical falloff (soft thickness)
    float yNorm = pos.y / max(uDiskThickness, 0.001);
    density *= exp(-yNorm * yNorm);

    // Spiral arms — subtle shear
    float spiral = sin(angle * 2.0 - log(r) * 4.0 + uTime * uDiskSpeed * 0.3);
    density *= 0.85 + 0.15 * spiral;

    // Keplerian orbital velocity (in units where c=1, this is sqrt(M/r) = sqrt(0.5/r))
    float v_orb = uDiskSpeed * sqrt(0.5 / max(r, 0.01));
    v_orb = clamp(v_orb, 0.0, 0.6); // cap below c
    vec3 orbital_dir = normalize(vec3(-pos.z, 0.0, pos.x));
    vec3 orbital_vel = orbital_dir * v_orb;

    // Relativistic Doppler factor
    //   D = 1 / [γ (1 - β·n̂)]
    vec3 n = normalize(uCameraPos - pos);
    float beta_n = dot(orbital_vel, n);
    float gamma = 1.0 / sqrt(max(1.0 - dot(orbital_vel, orbital_vel), 0.001));
    float doppler = 1.0 / max(gamma * (1.0 - beta_n), 0.05);

    // Doppler beaming: I' = I * D^4
    float beaming = pow(doppler, 4.0) * uDoppler + (1.0 - uDoppler);

    // Gravitational redshift: 1+z = sqrt((1 - rs/r_obs) / (1 - rs/r_emit))
    // emitted frequency scales by 1/(1+z). For color shift, remap T_norm.
    float z_emit = 1.0 / sqrt(max(1.0 - R_HORIZON / max(r, 0.01), 0.01));
    float z_obs  = 1.0 / sqrt(max(1.0 - R_HORIZON / max(length(uCameraPos), 0.01), 0.01));
    float gravShift = (z_obs / z_emit); // <1 near BH (redshift)
    gravShift = mix(1.0, gravShift, uRedshift);

    // Combine: shift temperature, scale intensity
    float shifted_T = T_norm * gravShift;
    vec3 shifted_bb = blackbody(shifted_T * 0.85 + 0.15) * uDiskTemp;

    out_density = clamp(density, 0.0, 1.0);
    return shifted_bb * density * beaming * (1.0 + 2.0 * pow(T_norm, 2.0));
  }

  // ===========================================================================
  //  Geodesic integrator (RK4) with disk crossing detection
  // ===========================================================================
  vec3 traceGeodesic(vec3 ro, vec3 rd,
                     out int dbg_steps, out float dbg_rmin,
                     out int dbg_crossings, out float dbg_doppler,
                     out vec3 dbg_dir_out, out float dbg_disk_r) {
    vec3 pos = ro;
    vec3 vel = rd;

    vec3 color = vec3(0.0);
    float transmittance = 1.0;

    dbg_steps = 0;
    dbg_rmin = length(ro);
    dbg_crossings = 0;
    dbg_doppler = 1.0;
    dbg_dir_out = rd;
    dbg_disk_r = 0.0;

    // Angular momentum (conserved along null geodesic in Schwarzschild)
    vec3 L = cross(pos, vel);
    float h2 = dot(L, L);

    float prev_y = pos.y;
    vec3 prev_pos = pos;

    // Adaptive step: small near horizon, larger far away
    // ds = clamp(0.03 * (r - R_HORIZON + 0.15), 0.02, 0.25)
    for (int i = 0; i < 2000; i++) {
      if (i >= uSteps) break;
      dbg_steps = i;

      float r = length(pos);
      dbg_rmin = min(dbg_rmin, r);

      // ---- termination: horizon --------------------------------------
      if (r < R_HORIZON) {
        return color;
      }
      // ---- termination: escaped --------------------------------------
      if (r > R_FAR) {
        vec3 dir_out = normalize(vel);
        dbg_dir_out = dir_out;
        vec3 stars = starfield(dir_out) * uStarBright;
        vec3 mw = milkyway(dir_out) * uMilkyWay;
        return color + transmittance * (stars + mw);
      }

      // ---- disk plane crossing (y sign change) -----------------------
      float curr_y = pos.y;
      if (prev_y * curr_y < 0.0 && transmittance > 0.01) {
        // Interpolate crossing point
        float tc = prev_y / (prev_y - curr_y);
        vec3 cross_pos = mix(prev_pos, pos, tc);
        float cr = length(cross_pos.xz);
        if (cr >= uDiskInner && cr <= uDiskOuter) {
          float dens;
          vec3 emit = sampleDisk(cross_pos, dens);
          // Alpha blend
          float a = clamp(dens, 0.0, 1.0);
          color += transmittance * emit;
          transmittance *= (1.0 - a * 0.85);
          dbg_crossings++;
          dbg_disk_r = max(dbg_disk_r, cr);
          // rough average doppler for debug
          vec3 od = normalize(vec3(-cross_pos.z, 0.0, cross_pos.x));
          float v_o = uDiskSpeed * sqrt(0.5 / max(cr, 0.01));
          vec3 ov = od * v_o;
          vec3 n = normalize(uCameraPos - cross_pos);
          float bn = dot(ov, n);
          float g = 1.0 / sqrt(max(1.0 - dot(ov, ov), 0.001));
          dbg_doppler = 1.0 / max(g * (1.0 - bn), 0.05);
        }
      }
      prev_y = curr_y;
      prev_pos = pos;

      // ---- RK4 step --------------------------------------------------
      //   a(p) = -1.5 * h² * p / |p|⁵
      float ds = clamp(0.04 * (r - R_HORIZON + 0.15), 0.025, 0.22);

      vec3 k1p = vel;
      vec3 k1v = -1.5 * h2 * pos / pow(max(r, 0.01), 5.0);

      vec3 p2 = pos + 0.5 * ds * k1p;
      vec3 v2 = vel + 0.5 * ds * k1v;
      float r2 = length(p2);
      vec3 k2p = v2;
      vec3 k2v = -1.5 * h2 * p2 / pow(max(r2, 0.01), 5.0);

      vec3 p3 = pos + 0.5 * ds * k2p;
      vec3 v3 = vel + 0.5 * ds * k2v;
      float r3 = length(p3);
      vec3 k3p = v3;
      vec3 k3v = -1.5 * h2 * p3 / pow(max(r3, 0.01), 5.0);

      vec3 p4 = pos + ds * k3p;
      vec3 v4 = vel + ds * k3v;
      float r4 = length(p4);
      vec3 k4p = v4;
      vec3 k4v = -1.5 * h2 * p4 / pow(max(r4, 0.01), 5.0);

      pos = pos + ds / 6.0 * (k1p + 2.0 * k2p + 2.0 * k3p + k4p);
      vel = vel + ds / 6.0 * (k1v + 2.0 * k2v + 2.0 * k3v + k4v);

      // Mild renormalization to fight numerical drift (keeps |v|≈1)
      vel = normalize(vel);
    }

    // Ran out of steps — return dim background as fallback
    vec3 dir_out = normalize(vel);
    dbg_dir_out = dir_out;
    return color + transmittance * vec3(0.01, 0.005, 0.02);
  }

  // ===========================================================================
  //  HSV helper for debug views
  // ===========================================================================
  vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0/3.0, 1.0/3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - 3.0);
    return c.z * mix(K.xxx, clamp(p - 1.0, 0.0, 1.0), c.y);
  }

  // ===========================================================================
  //  Main
  // ===========================================================================
  void main() {
    vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution) / uResolution.y;

    // Build primary ray
    vec3 ro = uCameraPos;
    vec3 rd = normalize(uCameraBasis * vec3(uv.x * uFovTan, uv.y * uFovTan, -1.0));

    int   dbg_steps;
    float dbg_rmin;
    int   dbg_crossings;
    float dbg_doppler;
    vec3  dbg_dir_out;
    float dbg_disk_r;

    vec3 color = traceGeodesic(ro, rd, dbg_steps, dbg_rmin,
                               dbg_crossings, dbg_doppler,
                               dbg_dir_out, dbg_disk_r);

    // --- debug views --------------------------------------------------------
    if (uDebugView == 1) {
      // raw color, no post
      gl_FragColor = vec4(color, 1.0);
      return;
    }
    if (uDebugView == 2) {
      // depth: normalized step count
      float d = float(dbg_steps) / float(uSteps);
      gl_FragColor = vec4(vec3(d), 1.0);
      return;
    }
    if (uDebugView == 3) {
      // disk crossings count (color-coded)
      float c = float(dbg_crossings);
      vec3 col = vec3(c * 0.3, c * 0.6, c * 0.9) / 3.0;
      if (c == 0.0) col = vec3(0.0);
      gl_FragColor = vec4(col, 1.0);
      return;
    }
    if (uDebugView == 4) {
      // redshift visualization: bluer = blueshifted, redder = redshifted
      // we use dbg_doppler (D>1 = blueshift, D<1 = redshift)
      float d = clamp((dbg_doppler - 0.5) * 1.5, 0.0, 1.0);
      vec3 col = mix(vec3(0.8, 0.1, 0.1), vec3(0.1, 0.4, 1.0), d);
      if (dbg_crossings == 0) col = vec3(0.05);
      gl_FragColor = vec4(col, 1.0);
      return;
    }
    if (uDebugView == 5) {
      // Doppler factor magnitude
      float d = clamp(dbg_doppler * 0.5, 0.0, 1.0);
      gl_FragColor = vec4(vec3(d), 1.0);
      return;
    }
    if (uDebugView == 6) {
      // starfield only (use ray exit direction)
      vec3 stars = starfield(dbg_dir_out) * uStarBright;
      vec3 mw = milkyway(dbg_dir_out) * uMilkyWay;
      gl_FragColor = vec4(stars + mw, 1.0);
      return;
    }
    if (uDebugView == 7) {
      // step count heatmap
      float t = float(dbg_steps) / float(uSteps);
      vec3 col = hsv2rgb(vec3((1.0 - t) * 0.65, 0.85, 0.95));
      gl_FragColor = vec4(col, 1.0);
      return;
    }
    if (uDebugView == 8) {
      // ray exit direction as color
      vec3 col = 0.5 + 0.5 * dbg_dir_out;
      gl_FragColor = vec4(col, 1.0);
      return;
    }
    if (uDebugView == 9) {
      // r_min / R_PHOTON (closer = brighter)
      float t = clamp(1.0 - (dbg_rmin - R_HORIZON) / 5.0, 0.0, 1.0);
      vec3 col = hsv2rgb(vec3(0.6 - t * 0.6, 0.85, 0.95));
      gl_FragColor = vec4(col, 1.0);
      return;
    }

    // Default: HDR linear color (post-processing handled in composite pass)
    gl_FragColor = vec4(color, 1.0);
  }
`;
