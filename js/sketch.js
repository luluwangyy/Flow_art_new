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
  const params = { speed: 1, density: 900, trailLength: 220 };

  let layers = []; // { id, artwork, img, buffer, flowField, cols, rows, cellSize, particles }
  let ctx = null;
  let nextId = 1;

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
      this.angleCorrector = Math.random() * 0.5 + 0.01;
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
        const idx = y * this.layer.cols + x;
        const f = this.layer.flowField[idx];
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
        if (this.x < -50 || this.x > width + 50 || this.y < -50 || this.y > height + 50) this.timer = 0;
      } else if (this.history.length > 1) {
        this.history.shift();
      } else {
        this.reset(false);
      }
    }
    draw() {
      if (this.history.length < 2) return;
      ctx.beginPath();
      ctx.moveTo(this.history[0].x, this.history[0].y);
      for (let i = 1; i < this.history.length; i++) ctx.lineTo(this.history[i].x, this.history[i].y);
      ctx.strokeStyle = this.color;
      ctx.stroke();
    }
  }

  class Layer {
    constructor(id, img, artwork) {
      this.id = id;
      this.img = img;
      this.artwork = artwork;
      this.cellSize = Math.max(4, Math.floor(Math.min(width, height) / 140));
      this.buildField();
      this.particles = [];
      this.repopulate();
    }
    buildField() {
      const buf = createGraphics(width, height);
      buf.pixelDensity(1);
      const iw = this.img.naturalWidth, ih = this.img.naturalHeight;
      const scale = Math.max(width / iw, height / ih);
      const dw = iw * scale, dh = ih * scale;
      // Store the exact "cover" placement so the visible background draw
      // (see step()) lines up pixel-for-pixel with what the flow field sampled.
      this.bgX = (width - dw) / 2;
      this.bgY = (height - dh) / 2;
      this.bgW = dw;
      this.bgH = dh;
      buf.drawingContext.drawImage(this.img, this.bgX, this.bgY, this.bgW, this.bgH);
      buf.loadPixels();
      const px = buf.pixels;
      this.cols = Math.floor(width / this.cellSize);
      this.rows = Math.floor(height / this.cellSize);
      const field = new Array(this.cols * this.rows);
      let i = 0;
      for (let y = 0; y < height; y += this.cellSize) {
        for (let x = 0; x < width; x += this.cellSize) {
          const p = (Math.floor(y) * width + Math.floor(x)) * 4;
          const r = px[p], g = px[p + 1], b = px[p + 2], a = px[p + 3];
          const gray = (r + g + b) / 3;
          field[i++] = { x, y, red: r, green: g, blue: b, alpha: a, colorAngle: (gray / 256) * 6.28318 };
        }
      }
      this.flowField = field;
      buf.remove();
    }
    repopulate() {
      const target = Math.floor(params.density);
      while (this.particles.length < target) this.particles.push(new Particle(this));
      if (this.particles.length > target) this.particles.length = target;
    }
    step() {
      ctx.save();
      ctx.globalAlpha = 0.32;
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
    for (const layer of layers) layer.step();
  }

  function windowResized() {
    const container = document.getElementById('canvas-container');
    resizeCanvas(container.clientWidth, container.clientHeight);
    for (const layer of layers) {
      layer.buildField();
      // Redistribute particles across the new bounds immediately, rather than
      // waiting for each one to naturally time out and reset.
      layer.particles.forEach(p => p.reset(true));
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
    const img = await MetAPI.loadImageElement(imageUrl);
    const id = nextId++;
    // Only one painting active at a time — dropping a new one replaces the last.
    const evicted = layers.map(l => l.artwork.id);
    layers = [];
    evicted.forEach(artworkId => window.dispatchEvent(new CustomEvent('flow:layer-evicted', { detail: { artworkId } })));
    const layer = new Layer(id, img, artwork);
    layers.push(layer);
    notifyChange();
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
    setParams({ speed: 1, density: 900, trailLength: 220 });
  }

  function getParams() { return { ...params }; }
  function getActiveArtworkIds() { return layers.map(l => l.artwork.id); }
  function getLayerCount() { return layers.length; }

  return { MAX_LAYERS, addLayer, removeByArtworkId, clearAll, setParams, resetParams, getParams, getActiveArtworkIds, getLayerCount };
})();
