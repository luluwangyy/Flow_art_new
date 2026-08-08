(function () {
  const btn = document.getElementById('descToggle');
  const wrap = document.querySelector('.subtitle-meaning-wrap');
  if (!btn || !wrap) return;

  btn.addEventListener('click', () => {
    const collapsed = wrap.classList.toggle('collapsed');
    btn.setAttribute('aria-pressed', collapsed ? 'true' : 'false');
    btn.setAttribute('aria-label', collapsed ? 'Show description' : 'Hide description');
    btn.title = collapsed ? 'Show description' : 'Hide description';
  });
})();
