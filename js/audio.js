(function () {
  const btn = document.getElementById('audioToggle');
  const audio = document.getElementById('ambientAudio');
  audio.volume = 0.35;

  function setPlayingUI(isPlaying) {
    btn.setAttribute('aria-pressed', isPlaying ? 'true' : 'false');
  }

  // Start unmuted immediately. Browsers commonly block audible autoplay
  // without a prior user gesture, in which case play() rejects and the
  // toggle falls back to reflecting the real (muted) state — clicking it
  // then starts playback, same as any browser's autoplay policy expects.
  audio.play().then(() => setPlayingUI(true)).catch(() => setPlayingUI(false));

  btn.addEventListener('click', () => {
    const playing = btn.getAttribute('aria-pressed') === 'true';
    if (playing) {
      audio.pause();
      setPlayingUI(false);
    } else {
      audio.play().then(() => setPlayingUI(true)).catch(() => {});
    }
  });
})();
