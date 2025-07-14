// Simple separable Gaussian blur for small canvases (≤ 128×128).
// Radius is given in pixels – use the same value that used to go into CSS blur(px).

export function gaussianBlurCanvas(ctx, width, height, radius) {
    if (radius <= 0) return;                     // nothing to do
    radius = Math.round(radius);
    const kernel = buildKernel(radius);
  
    const src = ctx.getImageData(0, 0, width, height);
    const tmp = new Uint8ClampedArray(src.data.length);
    const dst = new Uint8ClampedArray(src.data.length);
  
    // ----- horizontal pass -----
    convolve1D(src.data, tmp, width, height, kernel, radius, /*horizontal=*/true);
    // ----- vertical pass -----
    convolve1D(tmp, dst, width, height, kernel, radius, /*horizontal=*/false);
  
    ctx.putImageData(new ImageData(dst, width, height), 0, 0);
  }
  
  function buildKernel(r) {
    const size = r * 2 + 1;
    const sigma = r;                       // rough match to CSS blur
    const kernel = new Float32Array(size);
    let sum = 0;
    for (let i = 0; i < size; i++) {
      const x = i - r;
      const v = Math.exp(-(x * x) / (2 * sigma * sigma));
      kernel[i] = v;
      sum += v;
    }
    // normalise
    for (let i = 0; i < size; i++) kernel[i] /= sum;
    return kernel;
  }
  
  function convolve1D(src, dst, width, height, k, r, horizontal) {
    const channels = 4;                   // RGBA
    const line = horizontal ? width : height;
    const span = horizontal ? height : width;
  
    for (let s = 0; s < span; s++) {
      for (let t = 0; t < line; t++) {
        let rAcc = 0, gAcc = 0, bAcc = 0, aAcc = 0;
  
        for (let i = -r; i <= r; i++) {
          const tt = clamp(t + i, 0, line - 1);
          const x = horizontal ? tt : s;
          const y = horizontal ? s : tt;
          const idx = (y * width + x) * channels;
          const w = k[i + r];
  
          rAcc += src[idx    ] * w;
          gAcc += src[idx + 1] * w;
          bAcc += src[idx + 2] * w;
          aAcc += src[idx + 3] * w;
        }
  
        const dIdx = horizontal
          ? (s * width + t) * channels
          : (t * width + s) * channels;
  
        dst[dIdx    ] = rAcc;
        dst[dIdx + 1] = gAcc;
        dst[dIdx + 2] = bAcc;
        dst[dIdx + 3] = aAcc;
      }
    }
  }
  
  function clamp(v, lo, hi) {
    return v < lo ? lo : v > hi ? hi : v;
  } 