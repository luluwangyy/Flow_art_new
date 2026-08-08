/**
 * Builds the artwork tray from the Met API, and wires up both desktop
 * drag-and-drop and a touch/click tap-to-select fallback onto
 * FlowSketch.addLayer. Only one painting is active at a time — selecting a
 * new one replaces the last (FlowSketch.addLayer already clears prior
 * layers and fires 'flow:layer-evicted', which this file listens for to
 * keep the tray's active-thumbnail state in sync).
 */
(function () {
  const tray = document.getElementById('tray');
  const canvasContainer = document.getElementById('canvas-container');
  const loadingIndicator = document.getElementById('loading-indicator');
  const caption = document.getElementById('caption');
  const captionTitle = caption.querySelector('.caption-title');
  const captionMeta = caption.querySelector('.caption-meta');
  const hoverPreview = document.getElementById('hover-preview');
  const hoverPreviewImg = hoverPreview.querySelector('img');

  const thumbsById = new Map();
  let pendingIds = new Set(); // artworks currently mid-fetch, to prevent double-adds

  function showHoverPreview(artwork) {
    hoverPreviewImg.src = artwork.imageUrl;
    hoverPreviewImg.alt = artwork.title;
    // Anchored to the caption ("name") card rather than the hovered
    // thumbnail, so it always sits beside the title/artist text instead of
    // occasionally overlapping it depending on which thumbnail (near either
    // end of a scrolling tray) is being hovered.
    const capRect = caption.getBoundingClientRect();
    const previewWidth = 220;
    let left = capRect.right + 14;
    if (left + previewWidth > window.innerWidth - 12) {
      left = capRect.left - previewWidth - 14; // flip to the left if there's no room on the right
    }
    left = Math.max(12, left);
    hoverPreview.style.left = left + 'px';
    hoverPreview.style.bottom = (window.innerHeight - capRect.bottom) + 'px';
    hoverPreview.classList.add('visible');
  }
  function hideHoverPreview() {
    hoverPreview.classList.remove('visible');
  }

  function showCaption(artwork, note) {
    captionTitle.textContent = artwork.title;
    const link = artwork.objectURL
      ? ` · <a href="${artwork.objectURL}" target="_blank" rel="noopener">The Met ↗</a>`
      : '';
    const medium = artwork.medium ? `<br>${artwork.medium}` : '';
    captionMeta.innerHTML = `${artwork.artist}${artwork.date ? ' · ' + artwork.date : ''}${link}${medium}` +
      (note ? `<br>${note}` : '');
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
    loadingIndicator.classList.remove('hidden');
    try {
      await FlowSketch.addLayer(artwork.imageUrl, artwork);
      setActive(artwork.id, true);
      showCaption(artwork);
    } catch (err) {
      console.error('Could not load artwork onto canvas:', err);
      captionTitle.textContent = "Couldn't load that painting";
      captionMeta.textContent = 'The Met may be momentarily busy — try again in a moment.';
      caption.classList.remove('hidden');
    } finally {
      pendingIds.delete(artwork.id);
      if (el) el.style.opacity = '';
      loadingIndicator.classList.add('hidden');
    }
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
    // Plain, uncredentialed load — the tray only ever displays these, it never
    // reads pixels. (Loading many images at once with crossOrigin="anonymous"
    // is unreliable against the Met's CDN; the flow-field sampler requests
    // its own distinctly-keyed copy of the URL, see FlowSketch.addLayer.)
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

    el.addEventListener('mouseenter', () => {
      showCaption(artwork);
      showHoverPreview(artwork);
    });
    el.addEventListener('mouseleave', () => {
      if (!FlowSketch.getActiveArtworkIds().includes(artwork.id)) hideCaption();
      hideHoverPreview();
    });
    el.addEventListener('dragstart', hideHoverPreview);

    // Works for both touch tap and desktop click (a real drag doesn't fire click).
    el.addEventListener('click', () => addArtwork(artwork));
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); addArtwork(artwork); }
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
    const raw = e.dataTransfer.getData('text/plain');
    // dataTransfer only ever stores strings. Met artwork ids are numbers
    // (and MetAPI's cache is keyed by number, from MET_OBJECT_IDS), but
    // local/bundled artworks (see LOCAL_ARTWORKS in met-api.js) use string
    // ids — blindly Number()-converting turned those into NaN, so dragging
    // (though not clicking, which passes the artwork object directly) the
    // local painting silently failed to resolve to anything.
    const id = /^\d+$/.test(raw) ? Number(raw) : raw;
    const artwork = await MetAPI.fetchArtwork(id);
    addArtwork(artwork);
  });

  window.addEventListener('flow:layer-evicted', (e) => setActive(e.detail.artworkId, false));
  window.addEventListener('flow:pixel-load-failed', (e) => {
    const active = FlowSketch.getActiveArtworkIds();
    if (active[0] === e.detail.artworkId) {
      MetAPI.fetchArtwork(e.detail.artworkId).then((artwork) => {
        showCaption(artwork, '<em>flow effect unavailable right now — showing the painting as-is</em>');
      });
    }
  });

  const clearBtn = document.getElementById('clearBtn');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      FlowSketch.clearAll();
      hideCaption();
    });
  }

  (async function init() {
    const artworks = await MetAPI.loadAll();
    artworks.forEach((artwork, i) => tray.appendChild(buildThumb(artwork, i)));
  })();
})();
