class OpticalFlowEngine {
  // Compute Lucas-Kanade optical flow on a grid
  // prev, curr: Uint8ClampedArray (grayscale), width, height: image size
  // Returns: Array of {x, y, u, v} (grid points and flow vectors)
  computeLucasKanade(prev, curr, width, height, options = {}) {
    const gridStep = options.gridStep || 8;
    const win = options.windowSize || 5;
    const halfWin = Math.floor(win / 2);
    const flow = [];
    // Precompute image gradients
    const Ix = new Float32Array(width * height);
    const Iy = new Float32Array(width * height);
    const It = new Float32Array(width * height);
    for (let y = 1; y < height - 1; ++y) {
      for (let x = 1; x < width - 1; ++x) {
        const i = y * width + x;
        Ix[i] = (curr[i + 1] - curr[i - 1]) / 2;
        Iy[i] = (curr[i + width] - curr[i - width]) / 2;
        It[i] = curr[i] - prev[i];
      }
    }
    // For each grid point
    for (let y = halfWin; y < height - halfWin; y += gridStep) {
      for (let x = halfWin; x < width - halfWin; x += gridStep) {
        // Sum up squares of all space and time gradients (squared to aviod negative values)
        let sumIx2 = 0, sumIy2 = 0, sumIxIy = 0, sumIxIt = 0, sumIyIt = 0;
        for (let wy = -halfWin; wy <= halfWin; ++wy) {
          for (let wx = -halfWin; wx <= halfWin; ++wx) {
            const i = (y + wy) * width + (x + wx);
            const ix = Ix[i], iy = Iy[i], it = It[i];
            sumIx2 += ix * ix;
            sumIy2 += iy * iy;
            sumIxIy += ix * iy;
            sumIxIt += ix * it;
            sumIyIt += iy * it;
          }
        }
        // "Ix*u + Iy*v + It = 0" if u and v perfectly explain the motion.
        // If not the function gives us the error: "e = Ix*u + Iy*v + It"
        // We want to get u and v value that minimizes the error for all of the functions for all of the pixels.
        // We combine all of the individual error functions into one error function: E(u,v) = sum(Ix*u + Iy*v + It)^2
        // We then create the partial derivatives of the error function to find values for u and v that minimize the error
        // We solve with Cramer's rule
        const det = sumIx2 * sumIy2 - sumIxIy * sumIxIy;
        let u = 0, v = 0;
        if (Math.abs(det) > 1e-2) {
          u = (-sumIy2 * sumIxIt + sumIxIy * sumIyIt) / det;
          v = ( sumIxIy * sumIxIt - sumIx2 * sumIyIt) / det;
        }
        flow.push({ x, y, u, v });
      }
    }
    return flow;
  }

  // Compute Horn-Schunck optical flow on a grid
  // prev, curr: Uint8ClampedArray (grayscale), width, height: image size
  // Returns: Array of {x, y, u, v} (grid points and flow vectors)
  computeHornSchunck(prev, curr, width, height, options = {}) {
    const alpha = options.alpha || 10;
    const iterations = options.iterations || 50;
    const gridStep = options.gridStep || 8;
    // Precompute gradients
    const Ix = new Float32Array(width * height);
    const Iy = new Float32Array(width * height);
    const It = new Float32Array(width * height);
    for (let y = 1; y < height - 1; ++y) {
      for (let x = 1; x < width - 1; ++x) {
        const i = y * width + x;
        Ix[i] = (curr[i + 1] - curr[i - 1]) / 2;
        Iy[i] = (curr[i + width] - curr[i - width]) / 2;
        It[i] = curr[i] - prev[i];
      }
    }
    // Initialize flow fields (set all u and v to 0)
    const u = new Float32Array(width * height);
    const v = new Float32Array(width * height);
    // Iterative update
    for (let iter = 0; iter < iterations; ++iter) {
      // Compute local averages (4-neighbor)
      const uAvg = new Float32Array(width * height);
      const vAvg = new Float32Array(width * height);
      for (let y = 1; y < height - 1; ++y) {
        for (let x = 1; x < width - 1; ++x) {
          const i = y * width + x;
          uAvg[i] = (u[i - 1] + u[i + 1] + u[i - width] + u[i + width]) / 4;
          vAvg[i] = (v[i - 1] + v[i + 1] + v[i - width] + v[i + width]) / 4;
        }
      }
      // Horn-Schunck Energy function: E(u,v) = sum(Ix*u + Iy*v + It)^2 + alpha^2 * (sum(u^2 + v^2))
      // Make partial derivatives of the energy function with respect to u and v
      // Solve for u and v
      // Apply resulting equations to update u and v
      for (let y = 1; y < height - 1; ++y) {
        for (let x = 1; x < width - 1; ++x) {
          const i = y * width + x;
          const numerator  = Ix[i] * uAvg[i] + Iy[i] * vAvg[i] + It[i];
          const denominator = alpha * alpha + Ix[i] * Ix[i] + Iy[i] * Iy[i];
          u[i] = uAvg[i] - (Ix[i] * numerator ) / denominator;
          v[i] = vAvg[i] - (Iy[i] * numerator ) / denominator;
        }
      }
    }
    // Sample flow on a grid for visualization
    const flow = [];
    for (let y = gridStep; y < height - gridStep; y += gridStep) {
      for (let x = gridStep; x < width - gridStep; x += gridStep) {
        const i = y * width + x;
        flow.push({ x, y, u: u[i], v: v[i] });
      }
    }
    return flow;
  }
}

export default OpticalFlowEngine; 