(function () {
  const btn = document.getElementById('audioToggle');
  const audio = document.getElementById('ambientAudio');
  audio.volume = 0.35;

  btn.addEventListener('click', () => {
    const playing = btn.getAttribute('aria-pressed') === 'true';
    if (playing) {
      audio.pause();
      btn.setAttribute('aria-pressed', 'false');
    } else {
      audio.play().catch(() => {});
      btn.setAttribute('aria-pressed', 'true');
    }
  });
})();
