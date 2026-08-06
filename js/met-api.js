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

  // The Met's image CDN serves Access-Control-Allow-Origin: *, so a plain
  // crossOrigin="anonymous" <img> load gives non-tainted canvas pixel access
  // (verified directly — no fetch()/blob indirection needed).
  function loadImageElement(url) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Image failed to load: ' + url));
      img.src = url;
    });
  }

  async function loadAll() {
    const settled = await Promise.allSettled(MET_OBJECT_IDS.map(fetchArtwork));
    return settled
      .filter(r => r.status === 'fulfilled' && r.value.imageUrl)
      .map(r => r.value);
  }

  return { fetchArtwork, loadImageElement, loadAll };
})();
