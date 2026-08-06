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
  438817, // Degas — The Dance Class
  436141, // Degas — The Dancing Class
  436174, // Degas — A Woman Ironing
  436155, // Degas — The Rehearsal of the Ballet Onstage
  437682, // Sisley — View of Marly-le-Roi from Coeur-Volant
  437685, // Sisley — The Road from Versailles to Louveciennes
  437299, // Pissarro — Jalais Hill, Pontoise
  437654, // Seurat — Circus Sideshow
  438821, // Gauguin — Ia Orana Maria
  438815, // Renoir — Madame Georges Charpentier and Her Children
  437159, // Morisot — Young Woman Knitting
  436947, // Manet — Boating
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
