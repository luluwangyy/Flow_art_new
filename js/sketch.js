/**
 * Flow field engine — ported from the original raw-Canvas2D technique in
 * final3/final3_layer1.js (see main branch), rebuilt in p5.js with
 * live-tunable params and dynamic image sources (dropped-in Met artworks)
 * instead of static <img> tags. One active painting at a time: dropping a
 * new one replaces the last, and the source painting is shown faintly as a
 * background, scaled/positioned identically to how it seeds the flow field
 * so the particles visually align with the brushwork underneath.
 */

const FlowSketch = (() => {
  const MAX_LAYERS = 1;
  // Actual engine values. The settings panel exposes these as friendly 0–100
  // sliders (see js/controls.js RANGES) rather than these raw numbers.
  const params = { speed: 1.5, density: 2670, trailLength: 182 };

  let layers = []; // { id, artwork, img, buffer, flowField, cols, rows, cellSize, particles }
  let ctx = null;
  let nextId = 1;
  let noiseTime = 0; // advances every frame; drives the Perlin-noise turbulence all particles share

  // Perlin noise spatial scale (bigger = larger, smoother swirls) and how
  // strongly it bends a particle's angle each frame.
  const NOISE_SCALE = 0.006;
  const NOISE_STRENGTH = 1.1;

  class Particle {
    constructor(layer) {
      this.layer = layer;
      this.reset(true);
    }
    reset(initial) {
      const f = this.layer.flowField;
      let placed = false;
      for (let i = 0; i < 30 && !placed; i++) {
        const idx = Math.floor(Math.random() * f.length);
        if (f[idx] && f[idx].alpha > 10) {
          this.x = f[idx].x;
          this.y = f[idx].y;
          placed = true;
        }
      }
      if (!placed) {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
      }
      this.history = [{ x: this.x, y: this.y }];
      this.speedModifier = Math.random() * 2 + 0.6;
      this.maxLength = initial ? Math.floor(Math.random() * 40) + params.trailLength : params.trailLength;
      this.angle = 0;
      this.newAngle = 0;
      this.angleCorrector = Math.random() * 0.35 + 0.06;
      // Perlin noise (see draw()/NOISE_SCALE) supplies the primary organic
      // turbulence, sampled at each particle's own position so nearby
      // particles curl coherently, like wind. A small secondary sine wobble
      // rides on top purely as a guarantee: Perlin noise varies smoothly, so
      // in principle a particle could still ride a near-flat stretch of it
      // for a while, and a sine wave can never average out to a long
      // straight run the way that's theoretically possible with noise alone.
      this.noiseSeed = Math.random() * 1000;
      this.wobbleT = Math.random() * Math.PI * 2;
      this.wobbleFreq = 0.15 + Math.random() * 0.25;
      this.wobbleAmp = 0.04 + Math.random() * 0.04;
      this.timer = this.maxLength * (Math.random() * 1.5 + 1);
      this.r = 255; this.g = 255; this.b = 255;
      this.color = 'rgba(255,255,255,0.5)';
    }
    update() {
      this.timer--;
      if (this.timer >= 1) {
        const cell = this.layer.cellSize;
        const x = Math.floor(this.x / cell);
        const y = Math.floor(this.y / cell);
        // Bounds-check explicitly: a negative x with the flattened row-major
        // index (y * cols + x) can still land on a valid-looking slot from
        // the row above, which fed particles bogus flow data right at the
        // edges and made them ride along the canvas border instead of dying
        // off cleanly.
        const inBounds = x >= 0 && x < this.layer.cols && y >= 0 && y < this.layer.rows;
        const f = inBounds ? this.layer.flowField[y * this.layer.cols + x] : null;
        // Perlin-noise turbulence + a small guaranteed-non-flat wobble,
        // applied every frame regardless of flow-field lookup — see reset()
        // for why both exist. Without organic variation here, particles
        // crossing a smooth, low-detail area of a painting (open sky, a
        // flat wall) can travel an unnaturally long, mechanically straight
        // streak, since the local flow angle barely varies there.
        const n = noise(this.x * NOISE_SCALE, this.y * NOISE_SCALE, noiseTime + this.noiseSeed);
        this.angle += (n - 0.5) * NOISE_STRENGTH;
        this.wobbleT += this.wobbleFreq;
        this.angle += Math.sin(this.wobbleT) * this.wobbleAmp;
        if (f) {
          this.newAngle = f.colorAngle;
          if (this.angle > this.newAngle) this.angle -= this.angleCorrector;
          else if (this.angle < this.newAngle) this.angle += this.angleCorrector;
          if (f.alpha > 10) {
            this.r += (f.red - this.r) * 0.1;
            this.g += (f.green - this.g) * 0.1;
            this.b += (f.blue - this.b) * 0.1;
            this.color = `rgba(${this.r | 0},${this.g | 0},${this.b | 0},0.5)`;
          }
        }
        const spd = this.speedModifier * params.speed;
        this.x += Math.cos(this.angle) * spd;
        this.y += Math.sin(this.angle) * spd;
        this.history.push({ x: this.x, y: this.y });
        if (this.history.length > this.maxLength) this.history.shift();
        if (!inBounds) this.timer = 0; // start dying the moment it leaves the sampled area, not 50px later
      } else if (this.history.length > 1) {
        this.history.shift();
      } else {
        this.reset(false);
      }
    }
    draw() {
      const len = this.history.length;
      if (len < 2) return;
      // At higher density many more of these run per frame, so long trails
      // skip points when stroking them — cuts draw cost substantially with
      // a negligible visual difference at this line width.
      const step = len > 150 ? 3 : len > 70 ? 2 : 1;
      ctx.beginPath();
      ctx.moveTo(this.history[0].x, this.history[0].y);
      let i = step;
      for (; i < len; i += step) ctx.lineTo(this.history[i].x, this.history[i].y);
      if (i - step !== len - 1) { const last = this.history[len - 1]; ctx.lineTo(last.x, last.y); }
      ctx.strokeStyle = this.color;
      ctx.stroke();
    }
  }

  class Layer {
    // `img` is always the reliably-loaded display image — geometry and the
    // background render never depend on the pixel-safe load succeeding.
    constructor(id, img, artwork) {
      this.id = id;
      this.img = img;
      this.artwork = artwork;
      this.pixelImg = null;
      this.flowField = null;
      this.particles = [];
      this.computeGeometry();
    }
    computeGeometry() {
      this.cellSize = Math.max(4, Math.floor(Math.min(width, height) / 140));
      const iw = this.img.naturalWidth, ih = this.img.naturalHeight;
      const scale = Math.max(width / iw, height / ih);
      const dw = iw * scale, dh = ih * scale;
      this.bgX = (width - dw) / 2;
      this.bgY = (height - dh) / 2;
      this.bgW = dw;
      this.bgH = dh;
    }
    // Called once a pixel-safe copy of the same image is available (may
    // never be called, if that load couldn't succeed — the layer still
    // renders fine as a static background either way). Also re-run on
    // window resize, reusing the cached pixelImg.
    buildField(pixelImg) {
      this.pixelImg = pixelImg;
      const buf = createGraphics(width, height);
      buf.pixelDensity(1);
      buf.drawingContext.drawImage(pixelImg, this.bgX, this.bgY, this.bgW, this.bgH);
      buf.loadPixels();
      const px = buf.pixels;
      const cols = this.cols = Math.floor(width / this.cellSize);
      const rows = this.rows = Math.floor(height / this.cellSize);
      const cell = this.cellSize;
      const n = cols * rows;

      // Pass 1: sample raw color + grayscale onto the coarse cell grid.
      const gray = new Float32Array(n);
      const red = new Uint8ClampedArray(n), green = new Uint8ClampedArray(n),
            blue = new Uint8ClampedArray(n), alpha = new Uint8ClampedArray(n);
      for (let ry = 0; ry < rows; ry++) {
        for (let rx = 0; rx < cols; rx++) {
          const p = ((ry * cell) * width + (rx * cell)) * 4;
          const idx = ry * cols + rx;
          const r = px[p], g = px[p + 1], b = px[p + 2];
          red[idx] = r; green[idx] = g; blue[idx] = b; alpha[idx] = px[p + 3];
          gray[idx] = (r + g + b) / 3;
        }
      }

      // Pass 1.5: smooth the grayscale grid before computing gradients.
      // Impasto brushwork (Van Gogh especially) has heavy local texture
      // everywhere, so an unsmoothed pixel-to-pixel gradient mostly picks up
      // brush noise rather than the painting's actual large shapes — that
      // read as generic scribble rather than a recognizable figure. A box
      // blur suppresses the fine texture so the gradient responds to real
      // shape boundaries instead.
      const blurR = 2;
      const smooth = new Float32Array(n);
      for (let ry = 0; ry < rows; ry++) {
        for (let rx = 0; rx < cols; rx++) {
          let sum = 0, count = 0;
          for (let oy = -blurR; oy <= blurR; oy++) {
            const sy = ry + oy;
            if (sy < 0 || sy >= rows) continue;
            const rowBase = sy * cols;
            for (let ox = -blurR; ox <= blurR; ox++) {
              const sx = rx + ox;
              if (sx < 0 || sx >= cols) continue;
              sum += gray[rowBase + sx];
              count++;
            }
          }
          smooth[ry * cols + rx] = sum / count;
        }
      }

      // Pass 2: flow direction follows the image's actual contours/edges
      // (perpendicular to the smoothed brightness gradient) rather than an
      // arbitrary angle derived from absolute brightness — this is what
      // makes particles trace recognizable shapes in the painting instead
      // of generic wandering lines. Flat, low-detail areas (no reliable
      // gradient) fall back to the old brightness-angle behavior.
      const field = new Array(n);
      for (let ry = 0; ry < rows; ry++) {
        for (let rx = 0; rx < cols; rx++) {
          const idx = ry * cols + rx;
          const xm = rx > 0 ? rx - 1 : rx, xp = rx < cols - 1 ? rx + 1 : rx;
          const ym = ry > 0 ? ry - 1 : ry, yp = ry < rows - 1 ? ry + 1 : ry;
          const dx = smooth[ry * cols + xp] - smooth[ry * cols + xm];
          const dy = smooth[yp * cols + rx] - smooth[ym * cols + rx];
          const mag = Math.sqrt(dx * dx + dy * dy);
          const colorAngle = mag > 1.5
            ? Math.atan2(dx, -dy) // rotate the gradient 90° -> direction of the edge itself
            : (gray[idx] / 256) * 6.28318;
          field[idx] = {
            x: rx * cell, y: ry * cell,
            red: red[idx], green: green[idx], blue: blue[idx], alpha: alpha[idx],
            colorAngle,
          };
        }
      }
      this.flowField = field;
      buf.remove();
      this.repopulate();
    }
    repopulate() {
      if (!this.flowField) return;
      const target = Math.floor(params.density);
      while (this.particles.length < target) this.particles.push(new Particle(this));
      if (this.particles.length > target) this.particles.length = target;
    }
    step() {
      ctx.save();
      ctx.globalAlpha = 0.27;
      ctx.drawImage(this.img, this.bgX, this.bgY, this.bgW, this.bgH);
      ctx.restore();
      for (const p of this.particles) { p.draw(); p.update(); }
    }
  }

  function setup() {
    const container = document.getElementById('canvas-container');
    const c = createCanvas(container.clientWidth, container.clientHeight);
    c.parent('canvas-container');
    pixelDensity(1);
    ctx = drawingContext;
    ctx.lineWidth = 0.7;
    ctx.lineCap = 'round';
    noLoop();
    loop();
  }

  function draw() {
    clear();
    ctx.globalCompositeOperation = 'source-over';
    noiseTime += 0.004;
    for (const layer of layers) layer.step();
  }

  function windowResized() {
    const container = document.getElementById('canvas-container');
    resizeCanvas(container.clientWidth, container.clientHeight);
    for (const layer of layers) {
      layer.computeGeometry();
      if (layer.pixelImg) {
        layer.buildField(layer.pixelImg);
        // Redistribute particles across the new bounds immediately, rather
        // than waiting for each one to naturally time out and reset.
        layer.particles.forEach(p => p.reset(true));
      }
    }
  }

  window.setup = setup;
  window.draw = draw;
  window.windowResized = windowResized;

  function notifyChange() {
    document.body.classList.toggle('has-layers', layers.length > 0);
    window.dispatchEvent(new CustomEvent('flow:layers-changed', { detail: { ids: layers.map(l => l.id) } }));
  }

  async function addLayer(imageUrl, artwork) {
    // Kick off both loads at once rather than one after the other — the
    // pixel-safe load (which needs CORS and retries) used to only start
    // once the display image had already finished, adding its whole
    // duration again before the first particles could appear.
    const pixelPromise = MetAPI.loadPixelSafeImage(imageUrl);
    // The display image is loaded plainly (no CORS involved at all) and is
    // reliable — the painting always has a chance to show up. Only the
    // (separate, optional) pixel-safe load below can fail without blocking
    // that.
    const img = await MetAPI.loadDisplayImage(imageUrl);
    const id = nextId++;
    // Only one painting active at a time — dropping a new one replaces the last.
    const evicted = layers.map(l => l.artwork.id);
    layers = [];
    evicted.forEach(artworkId => window.dispatchEvent(new CustomEvent('flow:layer-evicted', { detail: { artworkId } })));
    const layer = new Layer(id, img, artwork);
    layers.push(layer);
    notifyChange();

    // Attach the flow field as soon as it's ready — if it fails, the
    // painting stays visible as a static image rather than the whole thing
    // erroring out.
    pixelPromise
      .then((pixelImg) => {
        if (layers.includes(layer)) layer.buildField(pixelImg);
      })
      .catch((err) => {
        console.warn('Flow effect unavailable for this painting (showing it without motion):', err);
        window.dispatchEvent(new CustomEvent('flow:pixel-load-failed', { detail: { artworkId: artwork.id } }));
      });

    return id;
  }

  function removeByArtworkId(artworkId) {
    layers = layers.filter(l => l.artwork.id !== artworkId);
    notifyChange();
  }

  function clearAll() {
    const evicted = layers.map(l => l.artwork.id);
    layers = [];
    evicted.forEach(artworkId => window.dispatchEvent(new CustomEvent('flow:layer-evicted', { detail: { artworkId } })));
    notifyChange();
  }

  function setParams(next) {
    Object.assign(params, next);
    for (const layer of layers) layer.repopulate();
  }

  function resetParams() {
    setParams({ speed: 1.5, density: 2670, trailLength: 182 });
  }

  function getParams() { return { ...params }; }
  function getActiveArtworkIds() { return layers.map(l => l.artwork.id); }
  function getLayerCount() { return layers.length; }

  return { MAX_LAYERS, addLayer, removeByArtworkId, clearAll, setParams, resetParams, getParams, getActiveArtworkIds, getLayerCount };
})();
