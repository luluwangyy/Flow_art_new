(function () {
  const toggleBtn = document.getElementById('settingsToggle');
  const panel = document.getElementById('settings-panel');
  const speed = document.getElementById('speedSlider');
  const density = document.getElementById('densitySlider');
  const trail = document.getElementById('trailSlider');
  const resetBtn = document.getElementById('resetBtn');

  // The sliders show a friendly 0–100 scale; these map to FlowSketch's
  // actual engine ranges (see the params default in js/sketch.js).
  const RANGES = {
    speed: [0.3, 2.3],
    density: [150, 1700],
    trailLength: [50, 400],
  };
  function uiToActual(key, ui) {
    const [lo, hi] = RANGES[key];
    return lo + (ui / 100) * (hi - lo);
  }
  function actualToUi(key, actual) {
    const [lo, hi] = RANGES[key];
    return Math.round(((actual - lo) / (hi - lo)) * 100);
  }

  function open() {
    panel.classList.remove('hidden');
    toggleBtn.setAttribute('aria-expanded', 'true');
  }
  function close() {
    panel.classList.add('hidden');
    toggleBtn.setAttribute('aria-expanded', 'false');
  }

  toggleBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    panel.classList.contains('hidden') ? open() : close();
  });
  document.addEventListener('click', (e) => {
    if (!panel.classList.contains('hidden') && !panel.contains(e.target) && e.target !== toggleBtn) close();
  });

  function applyFromInputs() {
    FlowSketch.setParams({
      speed: uiToActual('speed', parseFloat(speed.value)),
      density: Math.round(uiToActual('density', parseFloat(density.value))),
      trailLength: Math.round(uiToActual('trailLength', parseFloat(trail.value))),
    });
  }
  [speed, density, trail].forEach(input => input.addEventListener('input', applyFromInputs));

  resetBtn.addEventListener('click', () => {
    FlowSketch.resetParams();
    const p = FlowSketch.getParams();
    speed.value = actualToUi('speed', p.speed);
    density.value = actualToUi('density', p.density);
    trail.value = actualToUi('trailLength', p.trailLength);
  });
})();
