/**
 * Curated, pre-verified set of public-domain Impressionist / Post-Impressionist
 * works from The Met's Open Access collection. Verified individually (isPublicDomain
 * === true, primaryImageSmall present, landscape orientation) rather than relying
 * on the Met search endpoint, which text-matches loosely and returns unrelated
 * results.
 */
const MET_OBJECT_IDS = [
  337864, // Morisot — A Woman Seated at a Bench on the Avenue du Bois
  436524, // Van Gogh — Sunflowers
  436528, // Van Gogh — Irises
  438009, // Morisot — The Pink Dress
  437159, // Morisot — Young Woman Knitting
  437682, // Sisley — View of Marly-le-Roi from Coeur-Volant
  437299, // Pissarro — Jalais Hill, Pontoise
  435877, // Cézanne — Mont Sainte-Victoire and the Viaduct of the Arc River Valley
  437310, // Pissarro — The Boulevard Montmartre on a Winter Morning
  435882, // Cézanne — Still Life with Apples and a Pot of Primroses
  437317, // Pissarro — Still Life with Apples and Pitcher
  437995, // Fantin-Latour — Roses in a Bowl
  436946, // Manet — The Brioche
  436448, // Gauguin — A Farm in Brittany
  438031, // Fantin-Latour — Summer Flowers
  438015, // Seurat — Gray Weather, Grande Jatte
  437989, // Cézanne — Dish of Apples
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

  // Plain, uncredentialed load — this is the fast, reliable path (no CORS
  // involved at all). The Met's CDN sits behind Imperva bot-mitigation,
  // which occasionally slows down or blocks fetch()-based requests
  // inconsistently while never affecting a plain <img> load — so the
  // painting itself should always be able to appear quickly regardless of
  // how the pixel-safe load below is behaving.
  function loadDisplayImage(url, attempts = 3) {
    return retry(attempts, (attemptUrl) => new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Display image failed to load'));
      img.src = attemptUrl;
    }), url);
  }

  // For canvas pixel access the image needs to be loaded without tainting
  // the canvas — fetch()+blob (blob: URLs are same-origin) with a
  // crossOrigin <img> fallback on retry. Kicked off in parallel with (not
  // after) the display load in FlowSketch.addLayer, since this path is the
  // one occasionally slowed by Imperva; the painting shouldn't have to wait
  // for it just to appear.
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
      if (i > 0) await wait(150 * i); // ride out short network blips before retrying
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
