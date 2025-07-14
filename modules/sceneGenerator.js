import { gaussianBlurCanvas } from './gaussianBlur.js';

class SceneGenerator {
  constructor(sceneName = 'bouncingBall', sceneCanvas) {
    this.setScene(sceneName);
    this.sceneCanvas = sceneCanvas;
    this.width = sceneCanvas.width;
    this.height = sceneCanvas.height;
  }

  setScene(sceneName) {
    this.sceneName = sceneName;
  }

  renderFrame(ctx, frameCounter, blur = 4) {
    ctx.clearRect(0, 0, this.width, this.height);

    switch (this.sceneName) {
      case 'bouncingBall':
        this.renderBouncingBall(ctx, frameCounter);
        break;
      case 'slidingSquare':
        this.renderSlidingSquare(ctx, frameCounter);
        break;
      case 'rotatingBox':
        this.renderRotatingBox(ctx, frameCounter);
        break;
      case 'multipleBlobs':
        this.renderMultipleBlobs(ctx, frameCounter);
        break;
      case 'bouncingDot':
        this.renderBouncingDot(ctx, frameCounter);
        break;
      case 'movingCheckerboard':
        this.renderMovingCheckerboard(ctx, frameCounter);
        break;
      default:
        console.log('Scene not found');
    }

    if (blur > 0) {
      gaussianBlurCanvas(ctx, this.width, this.height, blur);
    }
  }

  renderBouncingBall(ctx, frameIndex) {
    const durationFrames = 150;
    const loopTime = (frameIndex % durationFrames) / durationFrames;
    const radius = 20;
    let maxX = (this.width - 2 * radius);
    let maxY = (this.height - 2 * radius);
    let posX  = radius + maxX  * (loopTime < 0.5 ? loopTime * 2 : (1 - loopTime) * 2);
    let posY  = radius + maxY  * (loopTime < 0.5 ? loopTime * 2 : (1 - loopTime) * 2);
    ctx.save();
    ctx.beginPath();
    ctx.arc(posX, posY, radius, 0, 2 * Math.PI);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.restore();
  }

  renderSlidingSquare(ctx, frameIndex) {
    const durationFrames = 150;
    const loopTime = (frameIndex % durationFrames) / durationFrames;
    const size = 32;
    const minX = 0;
    const maxX = this.width - size;
    const t = loopTime < 0.5 ? loopTime * 2 : (1 - loopTime) * 2;
    const x = minX + (maxX - minX) * t;
    const y = (this.height - size) / 2;
    ctx.save();
    ctx.fillStyle = '#fff';
    ctx.globalAlpha = 0.95;
    ctx.fillRect(x, y, size, size);
    ctx.restore();
  }

  renderRotatingBox(ctx, frameCounter) {
    const durationFrames = 150;
    const loopTime = (frameCounter % durationFrames) / durationFrames;
    const size = 48;
    const angle = loopTime * 2 * Math.PI;
    const cx = this.width / 2;
    const cy = this.height / 2;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);
    ctx.fillStyle = '#fff';
    ctx.globalAlpha = 0.95;
    ctx.fillRect(-size/2, -size/2, size, size);
    ctx.restore();
  }

  renderMultipleBlobs(ctx, frameCounter) {
    const durationFrames = 150;
    const loopT = (frameCounter % durationFrames) / durationFrames; // 0..1
    const blobs = [
      {
        color: 'rgba(255,80,80,0.5)',
        r: 22,
        cx: this.width * 0.3 + 20 * Math.cos(loopT * 2 * Math.PI),
        cy: this.height * 0.5 + 24 * Math.sin(loopT * 2 * Math.PI)
      },
      {
        color: 'rgba(80,180,255,0.5)',
        r: 18,
        cx: this.width * 0.7 + 18 * Math.cos(loopT * 2 * Math.PI + Math.PI/2),
        cy: this.height * 0.5 + 20 * Math.sin(loopT * 2 * Math.PI + Math.PI/2)
      },
      {
        color: 'rgba(120,255,120,0.5)',
        r: 16,
        cx: this.width * 0.5 + 28 * Math.cos(loopT * 4 * Math.PI),
        cy: this.height * 0.3 + 18 * Math.sin(loopT * 3 * Math.PI)
      }
    ];
    ctx.save();
    for (const blob of blobs) {
      ctx.beginPath();
      ctx.arc(blob.cx, blob.cy, blob.r, 0, 2 * Math.PI);
      ctx.fillStyle = blob.color;
      ctx.globalAlpha = 1.0;
      ctx.fill();
    }
    ctx.restore();
  }
  
  renderBouncingDot(ctx, frameCounter) {
    const durationFrames = 150;
    const loopTime = (frameCounter % durationFrames) / durationFrames;
    const radius = 1;
    let maxX = (this.width - 2 * radius);
    let maxY = (this.height - 2 * radius);
    let posX  = radius + maxX  * (loopTime < 0.5 ? loopTime * 2 : (1 - loopTime) * 2);
    let posY  = radius + maxY  * (loopTime < 0.5 ? loopTime * 2 : (1 - loopTime) * 2);
    ctx.save();
    ctx.beginPath();
    ctx.arc(posX, posY, radius, 0, 2 * Math.PI);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.restore();
  }

  renderMovingCheckerboard(ctx, frameIndex) {
    const durationFrames = 150;
    const loopTime = (frameIndex % durationFrames) / durationFrames;
    const t = loopTime < 0.5 ? loopTime * 2 : (1 - loopTime) * 2;
  
    const offset = t * 40; // amount of diagonal shift
  
    const numCols = 8;
    const numRows = 8;
    const squareSize = 24;
  
    ctx.save();
    ctx.translate(offset, offset); // Move diagonally
  
    for (let row = 0; row < numRows; row++) {
      for (let col = 0; col < numCols; col++) {
        const x = col * squareSize;
        const y = row * squareSize;
        const isDark = (row + col) % 2 === 0;
        ctx.fillStyle = isDark ? '#333' : '#ddd';
        ctx.fillRect(x, y, squareSize, squareSize);
      }
    }
  
    ctx.restore();
  }
}

export default SceneGenerator; 