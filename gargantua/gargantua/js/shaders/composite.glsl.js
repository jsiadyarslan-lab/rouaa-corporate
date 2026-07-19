// ============================================================================
//  GARGANTUA — Post-processing shaders
//    1. Bright pass     (extract HDR highlights)
//    2. Horizontal blur (separable Gaussian)
//    3. Vertical blur
//    4. Composite       (bloom + ACES + vignette + grain + chromatic aberration)
// ============================================================================

export const fullscreenVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

// ---------------------------------------------------------------------------
//  Bright-pass shader: extracts pixels above threshold, downsamples to half-res
// ---------------------------------------------------------------------------
export const brightPassFragment = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  

  uniform sampler2D uScene;
  uniform float uThreshold;
  uniform float uSoftKnee;

  void main() {
    vec3 c = texture2D(uScene, vUv).rgb;
    float l = max(c.r, max(c.g, c.b));
    // Soft knee: smoothly attenuate values near threshold
    float knee = uThreshold * uSoftKnee + 1e-5;
    float soft = clamp(l - knee, 0.0, 2.0 * knee);
    soft = soft * soft / (4.0 * knee + 1e-5);
    float contribution = max(soft, l - uThreshold) / max(l, 1e-5);
    gl_FragColor = vec4(c * contribution, 1.0);
  }
`;

// ---------------------------------------------------------------------------
//  Separable Gaussian blur — 9-tap
//    direction: vec2(1,0) for horizontal, vec2(0,1) for vertical
// ---------------------------------------------------------------------------
export const blurFragment = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  

  uniform sampler2D uTex;
  uniform vec2 uDirection;   // (texelStep, 0) or (0, texelStep)
  uniform vec2 uTexelSize;

  // 9-tap Gaussian weights (sigma ~ 4)
  const float w0 = 0.227027;
  const float w1 = 0.1945946;
  const float w2 = 0.1216216;
  const float w3 = 0.054054;
  const float w4 = 0.016216;

  void main() {
    vec2 step = uDirection * uTexelSize;
    vec3 sum = texture2D(uTex, vUv).rgb * w0;
    sum += texture2D(uTex, vUv + step * 1.0).rgb * w1;
    sum += texture2D(uTex, vUv - step * 1.0).rgb * w1;
    sum += texture2D(uTex, vUv + step * 2.0).rgb * w2;
    sum += texture2D(uTex, vUv - step * 2.0).rgb * w2;
    sum += texture2D(uTex, vUv + step * 3.0).rgb * w3;
    sum += texture2D(uTex, vUv - step * 3.0).rgb * w3;
    sum += texture2D(uTex, vUv + step * 4.0).rgb * w4;
    sum += texture2D(uTex, vUv - step * 4.0).rgb * w4;
    gl_FragColor = vec4(sum, 1.0);
  }
`;

// ---------------------------------------------------------------------------
//  Composite shader: bloom add + ACES tonemap + CA + vignette + grain + gamma
// ---------------------------------------------------------------------------
export const compositeFragment = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  

  uniform sampler2D uScene;
  uniform sampler2D uBloom;
  uniform vec2  uResolution;
  uniform float uTime;
  uniform float uExposure;
  uniform float uBloomIntensity;
  uniform float uAcesContrast;
  uniform float uVignette;
  uniform float uGrain;
  uniform float uChromAb;
  uniform int   uDebugView;

  // Manual ACES filmic tonemap (Narkowicz 2015)
  vec3 acesNark(vec3 x) {
    const float a = 2.51;
    const float b = 0.03;
    const float c = 2.43;
    const float d = 0.59;
    const float e = 0.14;
    return clamp((x * (a * x + b)) / (x * (c * x + d) + e), 0.0, 1.0);
  }

  // ACES with adjustable contrast (scales input pre-tonemap)
  vec3 acesTonemap(vec3 x, float contrast) {
    return acesNark(x * contrast);
  }

  float rand(vec2 co) {
    return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
  }

  void main() {
    // Debug views 1-9 bypass post-processing entirely (handled in raymarcher).
    if (uDebugView > 0) {
      vec3 c = texture2D(uScene, vUv).rgb;
      gl_FragColor = vec4(c, 1.0);
      return;
    }

    vec2 uv = vUv;
    vec2 dir = uv - 0.5;

    // ---- Chromatic aberration (sample scene at slightly offset UVs) ------
    float caAmt = uChromAb * dot(dir, dir);
    vec2 caDir = dir * caAmt * 0.5;
    vec3 col;
    col.r = texture2D(uScene, uv - caDir).r;
    col.g = texture2D(uScene, uv).g;
    col.b = texture2D(uScene, uv + caDir).b;

    // ---- Exposure ---------------------------------------------------------
    col *= uExposure;

    // ---- Bloom add --------------------------------------------------------
    vec3 bloom = texture2D(uBloom, uv).rgb;
    col += bloom * uBloomIntensity;

    // ---- ACES tonemap -----------------------------------------------------
    col = acesTonemap(col, uAcesContrast);

    // ---- sRGB gamma -------------------------------------------------------
    col = pow(col, vec3(1.0 / 2.2));

    // ---- Vignette (preserves deep blacks) --------------------------------
    float vig = 1.0 - uVignette * dot(dir, dir) * 1.8;
    vig = clamp(vig, 0.0, 1.0);
    col *= vig;

    // ---- Film grain (subtle, animated) -----------------------------------
    float g = rand(uv * uResolution.xy + fract(uTime) * 999.9) - 0.5;
    col += g * uGrain;

    // ---- Final clamp ------------------------------------------------------
    col = clamp(col, 0.0, 1.0);
    gl_FragColor = vec4(col, 1.0);
  }
`;
