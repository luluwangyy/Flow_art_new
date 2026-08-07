/**
 * Curated, pre-verified set of public-domain Impressionist / Post-Impressionist
 * works from The Met's Open Access collection. Verified individually (isPublicDomain
 * === true, primaryImageSmall present, CORS-open image CDN) rather than relying on
 * the Met search endpoint, which text-matches loosely and returns unrelated results.
 */
const MET_OBJECT_IDS = [
  436535, // Van Gogh — Wheat Field with Cypresses
  437980, // Van Gogh — Cypresses
  436524, // Van Gogh — Sunflowers
  436528, // Van Gogh — Irises
  437984, // Van Gogh — La Berceuse
  438815, // Renoir — Madame Georges Charpentier and Her Children
  437437, // Renoir — Young Woman (La Servante)
  437439, // Renoir — A Young Girl with Daisies
  438009, // Morisot — The Pink Dress
  337864, // Morisot — A Woman Seated at a Bench on the Avenue du Bois
  437159, // Morisot — Young Woman Knitting
  336672, // Morisot — Young Woman Reclining
];

const MetAPI = (() => {
  const cache = new Map();
  const BASE = 'https://collectionapi.metmuseum.org/public/collection/v1/objects/';

  async function fetchArtwork(objectID) {
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
  // one path but not the other:
  //   1. crossOrigin="anonymous" <img> — the Met's CDN sends
  //      Access-Control-Allow-Origin: *, so this works directly when allowed.
  //   2. fetch() the bytes as a blob and load that via a blob: object URL,
  //      which is same-origin and so never needs CORS permission at all.
  function loadPixelSafeImage(url, attempts = 4) {
    function attempt(attemptUrl, i) {
      if (i % 2 === 0) {
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
      if (i > 0) await wait(300 * i); // ride out short network blips before retrying
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
    const settled = await Promise.allSettled(MET_OBJECT_IDS.map(fetchArtwork));
    return settled
      .filter(r => r.status === 'fulfilled' && r.value.imageUrl)
      .map(r => r.value);
  }

  return { fetchArtwork, loadDisplayImage, loadPixelSafeImage, loadAll };
})();
