import SceneGenerator from './modules/sceneGenerator.js';
import OpticalFlowEngine from './modules/opticalFlowEngine.js';

const sceneCanvas = document.getElementById('scene-canvas');
const flowCanvas = document.getElementById('flow-canvas');
const sceneCtx = sceneCanvas.getContext('2d');
const flowCtx = flowCanvas.getContext('2d');
const pauseBtn = document.getElementById('pause-btn');
const nextFrameBtn = document.getElementById('next-frame-btn');
const previousFrameBtn = document.getElementById('previous-frame-btn');
const algoSelect = document.getElementById('algo-select');
const blurSlider = document.getElementById('blur-slider');
const blurValue = document.getElementById('blur-value');
const fpsSlider = document.getElementById('fps-slider');
const fpsValue = document.getElementById('fps-value');
const fpsCounter = document.getElementById('fps-counter');
const sceneSelect = document.getElementById('scene-select');

// New controls for algorithm parameters
const lkControls = document.getElementById('lk-controls');
const lkWindowSlider = document.getElementById('lk-window-slider');
const lkWindowValue = document.getElementById('lk-window-value');
const hsControls = document.getElementById('hs-controls');
const hsAlphaSlider = document.getElementById('hs-alpha-slider');
const hsAlphaValue = document.getElementById('hs-alpha-value');
const hsIterSlider = document.getElementById('hs-iter-slider');
const hsIterValue = document.getElementById('hs-iter-value');
const hsAlphaDecrement = document.getElementById('hs-alpha-decrement');
const hsAlphaIncrement = document.getElementById('hs-alpha-increment');

const sceneGen = new SceneGenerator('bouncingBall', sceneCanvas);
const flowEngine = new OpticalFlowEngine();

let prevGray = null;
let currGray = null;
let width = sceneCanvas.width;
let height = sceneCanvas.height;
let paused = false;
let frameCount = 0;
let lastFrameTime = null;
let selectedAlgo = algoSelect.value;
let blurAmount = parseInt(document.getElementById('blur-slider').value, 10);
let targetFPS = parseInt(fpsSlider.value, 10);
let framesThisSecond = 0;
let lastFpsUpdate = performance.now();

// Initial values
let lkWindowSize = parseInt(lkWindowSlider.value, 10);
let hsAlpha = parseFloat(hsAlphaSlider.value);
let hsIterations = parseInt(hsIterSlider.value, 10);

// == Event Listeners ==
blurSlider.addEventListener('input', () => {
  blurAmount = parseInt(blurSlider.value, 10);
  blurValue.textContent = blurAmount;
  renderScene(frameCount, false);
});

fpsSlider.addEventListener('input', () => {
  targetFPS = parseInt(fpsSlider.value, 10);
  fpsValue.textContent = targetFPS;
  lastFrameTime = performance.now();
});

pauseBtn.addEventListener('click', () => {
  paused = !paused;
  pauseBtn.textContent = paused ? 'Play' : 'Pause';
  setPauseUI(paused);
  if (paused) {
    fpsCounter.textContent = 0;
  } else {
    lastFrameTime = performance.now();
    requestAnimationFrame(animateScene);
  }
});

nextFrameBtn.addEventListener('click', () => {
  if (!paused) return;
  frameCount = frameCount + 1;
  renderScene(frameCount);
});

previousFrameBtn.addEventListener('click', () => {
    if (!paused) return;
    frameCount = frameCount - 1;
    if (frameCount < 0) frameCount = 0;
    renderScene(frameCount);
});

lkWindowSlider.addEventListener('input', () => {
  lkWindowSize = parseInt(lkWindowSlider.value, 10);
  lkWindowValue.textContent = lkWindowSize;
  if (paused) renderScene(frameCount);
});
hsAlphaSlider.addEventListener('input', () => {
  hsAlpha = parseFloat(hsAlphaSlider.value);
  hsAlphaValue.textContent = hsAlpha.toFixed(1);
  if (paused) renderScene(frameCount);
});
hsIterSlider.addEventListener('input', () => {
  hsIterations = parseInt(hsIterSlider.value, 10);
  hsIterValue.textContent = hsIterations;
  if (paused) renderScene(frameCount);
});
hsAlphaDecrement.addEventListener('click', () => {
  let newValue = Math.max(parseFloat(hsAlphaSlider.min), parseFloat(hsAlphaSlider.value) - 0.1);
  hsAlphaSlider.value = newValue.toFixed(1);
  hsAlphaSlider.dispatchEvent(new Event('input'));
});
hsAlphaIncrement.addEventListener('click', () => {
  let newValue = Math.min(parseFloat(hsAlphaSlider.max), parseFloat(hsAlphaSlider.value) + 0.1);
  hsAlphaSlider.value = newValue.toFixed(1);
  hsAlphaSlider.dispatchEvent(new Event('input'));
});

algoSelect.addEventListener('change', () => {
  selectedAlgo = algoSelect.value;
  toggleParameterControls();
  if (paused) renderScene(frameCount);
});

sceneSelect.addEventListener('change', () => {
  sceneGen.setScene(sceneSelect.value);
  renderScene(frameCount, false);
});


// == Functions ==
function animateScene(ts) {
  if (paused) {
    return;
  }
  
  const frameInterval = 1000 / targetFPS;
  const timeDiff = ts - lastFrameTime;
  
  // ONLY reset on large gaps (tab switch), not every frame
  if (timeDiff > frameInterval * 3) {  // 3 frames = definitely a pause
    lastFrameTime = ts - frameInterval;
  }
  
  if (timeDiff >= frameInterval) {
    frameCount++;
    lastFrameTime += frameInterval;
    renderScene(frameCount);
    updateFpsCounter(ts);
  }
  
  requestAnimationFrame(animateScene);
}

function renderScene(frameIdx, drawFlow = true) {
  sceneGen.renderFrame(sceneCtx, frameIdx, blurAmount);
  currGray = getGrayscaleBuffer(sceneCtx, width, height);
  flowCtx.clearRect(0, 0, flowCanvas.width, flowCanvas.height);
  if (prevGray && drawFlow) {
    let flow = getOpticalFlow();
    drawFlowVectors(flowCtx, flow, width, height);
  }
  prevGray = currGray;
}

function getGrayscaleBuffer(ctx, width, height) {
  const imgData = ctx.getImageData(0, 0, width, height).data;
  const gray = new Uint8ClampedArray(width * height);
  for (let i = 0; i < width * height; ++i) {
    const r = imgData[i * 4];
    const g = imgData[i * 4 + 1];
    const b = imgData[i * 4 + 2];
    gray[i] = 0.299 * r + 0.587 * g + 0.114 * b; // Luminance formula
  }
  return gray;
}

function getOpticalFlow() {
  switch (selectedAlgo) {
      case 'lucas-kanade':
        return flowEngine.computeLucasKanade(prevGray, currGray, width, height, { gridStep: 8, windowSize: lkWindowSize });
      case 'horn-schunck':
        return flowEngine.computeHornSchunck(prevGray, currGray, width, height, { gridStep: 8, alpha: hsAlpha, iterations: hsIterations });
      case 'none':
        return [];
      default:
        console.log('Algorithm not found');
        return [];
  }
}

function drawFlowVectors(ctx, flow, sceneWidth, sceneHeight) {
  const overlayWidth = flowCanvas.width;
  const overlayHeight = flowCanvas.height;
  const scaleX = overlayWidth / sceneWidth;
  const scaleY = overlayHeight / sceneHeight;
  ctx.save();
  ctx.strokeStyle = 'red';
  ctx.lineWidth = 2;
  ctx.globalAlpha = 0.8;
  for (const { x, y, u, v } of flow) {
    // Scale flow for visibility and overlay
    const arrowScale = 6.0 * scaleX;
    const sx = x * scaleX;
    const sy = y * scaleY;
    const ex = sx + u * arrowScale;
    const ey = sy + v * arrowScale;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(ex, ey);
    ctx.stroke();
    // Draw arrowhead
    const angle = Math.atan2(ey - sy, ex - sx);
    const len = Math.sqrt((ex - sx) ** 2 + (ey - sy) ** 2);
    if (len > 1.5 * scaleX) {
      const ah = 3 * scaleX; // arrowhead size
      ctx.beginPath();
      ctx.moveTo(ex, ey);
      ctx.lineTo(ex - ah * Math.cos(angle - 0.5), ey - ah * Math.sin(angle - 0.5));
      ctx.moveTo(ex, ey);
      ctx.lineTo(ex - ah * Math.cos(angle + 0.5), ey - ah * Math.sin(angle + 0.5));
      ctx.stroke();
    }
  }
  ctx.restore();
} 

function updateFpsCounter(ts) {
  framesThisSecond++;
  if (ts - lastFpsUpdate >= 1000) {
    fpsCounter.textContent = framesThisSecond;
    framesThisSecond = 0;
    lastFpsUpdate = ts;
  }
}

function setPauseUI(paused) {
  nextFrameBtn.disabled = !paused;
  previousFrameBtn.disabled = !paused;
}

function toggleParameterControls() {
  if (selectedAlgo === 'lucas-kanade') {
    lkControls.style.display = '';
    hsControls.style.display = 'none';
  } else if (selectedAlgo === 'horn-schunck') {
    lkControls.style.display = 'none';
    hsControls.style.display = '';
  }
}

// == On Load ==
fpsValue.textContent = targetFPS;
setPauseUI(paused);
toggleParameterControls();
renderScene(frameCount);
requestAnimationFrame(animateScene);