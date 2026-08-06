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

  // Fetch the image as a blob and load it from a blob: object URL, which is
  // same-origin — so canvas pixel reads never need crossOrigin/CORS at all.
  // (A crossOrigin="anonymous" <img> load also works in principle since the
  // Met's CDN sends Access-Control-Allow-Origin: *, but proved unreliable
  // in practice; a plain fetch() of the same URL is consistently solid.)
  function elementFromBlob(blob) {
    return new Promise((resolve, reject) => {
      const objectUrl = URL.createObjectURL(blob);
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Decoding image blob failed'));
      img.src = objectUrl;
    });
  }

  const wait = (ms) => new Promise(r => setTimeout(r, ms));

  async function loadImageElement(url, attempts = 5) {
    let lastErr;
    for (let i = 0; i < attempts; i++) {
      if (i > 0) await wait(300 * i); // ride out short network blips before retrying
      try {
        const res = await fetch(url, { cache: 'force-cache' });
        if (!res.ok) throw new Error('Image fetch error ' + res.status);
        const blob = await res.blob();
        return await elementFromBlob(blob);
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

  return { fetchArtwork, loadImageElement, loadAll };
})();
