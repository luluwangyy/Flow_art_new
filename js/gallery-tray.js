/**
 * Builds the artwork tray from the Met API, and wires up both desktop
 * drag-and-drop and a touch/click tap-to-select fallback onto the same
 * FlowSketch.addLayer / removeByArtworkId calls.
 */
(function () {
  const tray = document.getElementById('tray');
  const canvasContainer = document.getElementById('canvas-container');
  const caption = document.getElementById('caption');
  const captionTitle = caption.querySelector('.caption-title');
  const captionMeta = caption.querySelector('.caption-meta');

  const thumbsById = new Map();
  let pendingIds = new Set(); // artworks currently mid-fetch, to prevent double-adds

  function showCaption(artwork) {
    captionTitle.textContent = artwork.title;
    captionMeta.innerHTML = `${artwork.artist}${artwork.date ? ' · ' + artwork.date : ''} · <a href="${artwork.objectURL}" target="_blank" rel="noopener">The Met ↗</a>`;
    caption.classList.remove('hidden');
  }
  function hideCaption() {
    caption.classList.add('hidden');
  }

  function setActive(id, active) {
    const el = thumbsById.get(id);
    if (el) el.classList.toggle('active', active);
  }

  async function addArtwork(artwork) {
    if (pendingIds.has(artwork.id) || FlowSketch.getActiveArtworkIds().includes(artwork.id)) return;
    pendingIds.add(artwork.id);
    const el = thumbsById.get(artwork.id);
    if (el) el.style.opacity = '0.5';
    try {
      await FlowSketch.addLayer(artwork.imageUrl, artwork);
      setActive(artwork.id, true);
      showCaption(artwork);
    } catch (err) {
      console.error('Could not load artwork onto canvas:', err);
    } finally {
      pendingIds.delete(artwork.id);
      if (el) el.style.opacity = '';
    }
  }

  function removeArtwork(artwork) {
    FlowSketch.removeByArtworkId(artwork.id);
    setActive(artwork.id, false);
  }

  function toggleArtwork(artwork) {
    if (FlowSketch.getActiveArtworkIds().includes(artwork.id)) removeArtwork(artwork);
    else addArtwork(artwork);
  }

  function buildThumb(artwork, index) {
    const el = document.createElement('div');
    el.className = 'tray-item';
    el.style.animationDelay = (index * 45) + 'ms';
    el.draggable = true;
    el.setAttribute('role', 'button');
    el.setAttribute('tabindex', '0');
    el.setAttribute('aria-label', `${artwork.title} by ${artwork.artist}`);
    el.dataset.id = artwork.id;

    const img = document.createElement('img');
    img.crossOrigin = 'anonymous'; // keep cache mode consistent with the canvas-sampling load of the same URL
    img.src = artwork.imageUrl;
    img.alt = artwork.title;
    img.loading = 'lazy';
    el.appendChild(img);

    el.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/plain', String(artwork.id));
      e.dataTransfer.effectAllowed = 'copy';
      el.classList.add('dragging');
    });
    el.addEventListener('dragend', () => el.classList.remove('dragging'));

    el.addEventListener('mouseenter', () => showCaption(artwork));
    el.addEventListener('mouseleave', () => {
      if (!FlowSketch.getActiveArtworkIds().includes(artwork.id)) hideCaption();
    });

    // Works for both touch tap and desktop click (a real drag doesn't fire click).
    el.addEventListener('click', () => toggleArtwork(artwork));
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleArtwork(artwork); }
    });

    thumbsById.set(artwork.id, el);
    return el;
  }

  ['dragover', 'dragenter'].forEach(evt => {
    canvasContainer.addEventListener(evt, (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
      canvasContainer.classList.add('drag-over');
    });
  });
  canvasContainer.addEventListener('dragleave', (e) => {
    if (e.target === canvasContainer) canvasContainer.classList.remove('drag-over');
  });
  canvasContainer.addEventListener('drop', async (e) => {
    e.preventDefault();
    canvasContainer.classList.remove('drag-over');
    const id = Number(e.dataTransfer.getData('text/plain'));
    const artwork = await MetAPI.fetchArtwork(id);
    addArtwork(artwork);
  });

  window.addEventListener('flow:layer-evicted', (e) => setActive(e.detail.artworkId, false));

  (async function init() {
    const artworks = await MetAPI.loadAll();
    artworks.forEach((artwork, i) => tray.appendChild(buildThumb(artwork, i)));
  })();
})();
