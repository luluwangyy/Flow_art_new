(function () {
  const toggleBtn = document.getElementById('settingsToggle');
  const panel = document.getElementById('settings-panel');
  const speed = document.getElementById('speedSlider');
  const density = document.getElementById('densitySlider');
  const trail = document.getElementById('trailSlider');
  const resetBtn = document.getElementById('resetBtn');

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
      speed: parseFloat(speed.value),
      density: parseInt(density.value, 10),
      trailLength: parseInt(trail.value, 10),
    });
  }
  [speed, density, trail].forEach(input => input.addEventListener('input', applyFromInputs));

  resetBtn.addEventListener('click', () => {
    FlowSketch.resetParams();
    const p = FlowSketch.getParams();
    speed.value = p.speed;
    density.value = p.density;
    trail.value = p.trailLength;
  });
})();
