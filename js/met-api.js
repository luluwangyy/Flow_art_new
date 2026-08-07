/**
 * Curated, pre-verified set of public-domain Impressionist / Post-Impressionist
 * works from The Met's Open Access collection. Verified individually (isPublicDomain
 * === true, primaryImageSmall present, CORS-open image CDN) rather than relying on
 * the Met search endpoint, which text-matches loosely and returns unrelated results.
 */
// Landscape-orientation works only (verified against each image's actual
// pixel dimensions) — portrait paintings (Cypresses, La Berceuse, Young
// Woman/La Servante, A Young Girl with Daisies) were dropped since they
// don't fit the wide canvas well.
const MET_OBJECT_IDS = [
  436524, // Van Gogh — Sunflowers
  436528, // Van Gogh — Irises
  438009, // Morisot — The Pink Dress
  337864, // Morisot — A Woman Seated at a Bench on the Avenue du Bois
  437159, // Morisot — Young Woman Knitting
  437682, // Sisley — View of Marly-le-Roi from Coeur-Volant
  437299, // Pissarro — Jalais Hill, Pontoise
];

// Bundled directly with the site (not from the Met) — same-origin, so
// there's zero CORS concern for either the display or pixel-safe load.
// No Met object page exists to link to from its caption.
const LOCAL_ARTWORKS = [
  {
    id: 'local-van-self-portrait-1889',
    title: 'Self-Portrait',
    artist: 'Vincent van Gogh',
    date: '1889',
    medium: 'Oil on canvas, 25⅗ × 21½ in (65 × 54.5 cm)',
    imageUrl: 'assets/images/van1.jpg',
    objectURL: null,
  },
];
// Where it's inserted into the tray order (0-indexed, so 1 = second item).
const LOCAL_ARTWORK_POSITION = 1;

const MetAPI = (() => {
  const cache = new Map();
  const localById = new Map(LOCAL_ARTWORKS.map(a => [a.id, a]));
  const BASE = 'https://collectionapi.metmuseum.org/public/collection/v1/objects/';

  async function fetchArtwork(objectID) {
    if (localById.has(objectID)) return localById.get(objectID);
    if (cache.has(objectID)) return cache.get(objectID);
    const res = await fetch(BASE + objectID);
    if (!res.ok) throw new Error('Met API error ' + res.status);
    const d = await res.json();
    const artwork = {
      id: objectID,
      title: d.title || 'Untitled',
      artist: d.artistDisplayName || 'Unknown artist',
      date: d.objectDate || '',
      imageUrl: d.primaryImageSmall || d.primaryImage,
      objectURL: d.objectURL,
    };
    cache.set(objectID, artwork);
    return artwork;
  }

  const wait = (ms) => new Promise(r => setTimeout(r, ms));

  // Plain, uncredentialed load — works everywhere (no CORS involved at all),
  // used purely for on-screen display. This is the reliable baseline: the
  // painting should always be able to show up, even if the fancier
  // pixel-reading load below can't.
  function loadDisplayImage(url, attempts = 3) {
    return retry(attempts, (attemptUrl) => new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Display image failed to load'));
      img.src = attemptUrl;
    }), url);
  }

  // For canvas pixel access (building the flow field) the image needs to be
  // loaded without tainting the canvas. Two independent strategies are tried,
  // since ad blockers / privacy extensions / flaky networks can each block
  // one path but not the other. fetch()+blob goes first — it's proven more
  // reliable in practice — with crossOrigin="anonymous" <img> (the Met's CDN
  // sends Access-Control-Allow-Origin: *, so this works directly when
  // allowed) as the fallback on retry.
  function loadPixelSafeImage(url, attempts = 4) {
    function attempt(attemptUrl, i) {
      if (i % 2 === 1) {
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => resolve(img);
          img.onerror = () => reject(new Error('crossOrigin image load failed'));
          img.src = attemptUrl;
        });
      }
      return fetch(attemptUrl).then((res) => {
        if (!res.ok) throw new Error('Image fetch error ' + res.status);
        return res.blob();
      }).then((blob) => new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error('Decoding image blob failed'));
        img.src = URL.createObjectURL(blob);
      }));
    }
    return retry(attempts, attempt, url);
  }

  async function retry(attempts, attemptFn, url) {
    let lastErr;
    for (let i = 0; i < attempts; i++) {
      if (i > 0) await wait(200 * i); // ride out short network blips before retrying
      const sep = url.includes('?') ? '&' : '?';
      const attemptUrl = i === 0 ? url : url + sep + '_r=' + i;
      try {
        return await attemptFn(attemptUrl, i);
      } catch (err) {
        lastErr = err;
      }
    }
    throw lastErr;
  }

  async function loadAll() {
    const ids = [...MET_OBJECT_IDS];
    ids.splice(LOCAL_ARTWORK_POSITION, 0, ...LOCAL_ARTWORKS.map(a => a.id));
    const settled = await Promise.allSettled(ids.map(fetchArtwork));
    return settled
      .filter(r => r.status === 'fulfilled' && r.value.imageUrl)
      .map(r => r.value);
  }

  return { fetchArtwork, loadDisplayImage, loadPixelSafeImage, loadAll };
})();
