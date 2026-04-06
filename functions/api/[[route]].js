const SPECIAL_ANIME = ["One Piece", "Naruto", "Bleach"];

const getRandom = (arr, n = 1) => {
  if (!arr || arr.length === 0) return null;
  const count = Math.min(Math.max(1, parseInt(n) || 1), 100);
  
  if (count === 1) return arr[Math.floor(Math.random() * arr.length)];

  const result = [];
  const poolSize = arr.length;
  const indices = new Set();
  while (result.length < Math.min(count, poolSize)) {
    const idx = Math.floor(Math.random() * poolSize);
    if (!indices.has(idx)) {
      indices.add(idx);
      result.push(arr[idx]);
    }
  }
  return result;
};

const filterByLength = (arr, length) => {
  if (!length) return arr;
  return arr.filter(item => {
    const words = (item.quote || "").split(/\s+/).length;
    if (length === 'low') return words <= 15;
    if (length === 'med') return words > 15 && words <= 35;
    if (length === 'high') return words > 35;
    return true;
  });
};

const normalizeSearch = (s) => s.toLowerCase().replace(/[_\-\s]+/g, ' ').trim();

export async function onRequest(context) {
  const { request, env } = context;
  const urlObj = new URL(request.url);
  const rawPath = urlObj.pathname;
  const query = urlObj.searchParams;

  const sendJSON = (data, status = 200) => {
    return new Response(JSON.stringify(data, null, 2), {
      status,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
        'Cache-Control': 's-maxage=60, stale-while-revalidate=30',
        'X-Powered-By': 'AadishAnime Quotes Cloudflare Edition'
      }
    });
  };

  const sendError = (message, status = 400, extras = {}) => {
    return sendJSON({ error: message, ...extras }, status);
  };

  // 🚀 Lazy Load Assets from Cloudflare Static Storage
  const loadAsset = async (name) => {
    const assetUrl = new URL(`/db/${name}.json`, request.url);
    const res = await env.ASSETS.fetch(new Request(assetUrl));
    if (!res.ok) throw new Error(`Asset ${name} not found in build directory`);
    return await res.json();
  };

  try {
    // 1. Discovery Routes
    if (rawPath === '/api/list/animes') {
        const animes = await loadAsset('animes');
        return sendJSON(animes);
    }
    if (rawPath === '/api/list/characters') {
        const chars = await loadAsset('characters');
        return sendJSON(chars);
    }

    // 2. Search Engine
    if (rawPath === '/api/search') {
      const q = query.get('q')?.toLowerCase();
      if (!q) return sendError('Search query "q" required');
      const quotes = await loadAsset('quotes');
      const results = quotes.filter(item => 
        item.quote.toLowerCase().includes(q) || 
        item.character.toLowerCase().includes(q) || 
        item.animename.toLowerCase().includes(q)
      );
      return sendJSON(getRandom(results, 10));
    }

    // 3. Special Pools
    if (rawPath === '/api/special') {
      const animeMap = await loadAsset('map');
      const pool = [];
      SPECIAL_ANIME.forEach(a => { if (animeMap[a]) pool.push(...animeMap[a]); });
      return sendJSON(getRandom(pool));
    }

    // 4. Advanced Dynamic Routing
    const pathSegments = rawPath.replace('/api/', '').replace(/\/$/, '');
    if (!pathSegments) {
        const quotes = await loadAsset('quotes');
        return sendJSON(getRandom(quotes));
    }

    const parts = pathSegments.split('-');
    let count = 1;
    let lengthFilter = null;
    let animeParts = [];

    parts.forEach(p => {
      const lowerP = p.toLowerCase();
      if (!isNaN(p)) {
        count = Math.min(parseInt(p), 100);
      } else if (['low', 'med', 'high', 'short', 'medium', 'long'].includes(lowerP)) {
        if (lowerP === 'short' || lowerP === 'low') lengthFilter = 'low';
        if (lowerP === 'medium' || lowerP === 'med') lengthFilter = 'med';
        if (lowerP === 'long' || lowerP === 'high') lengthFilter = 'high';
      } else {
        animeParts.push(p);
      }
    });

    if (animeParts.length === 1 && animeParts[0] === 'random') {
      const quotes = await loadAsset('quotes');
      const filtered = filterByLength(quotes, lengthFilter);
      return sendJSON(getRandom(filtered, count));
    }

    const animes = await loadAsset('animes');
    const animeMap = await loadAsset('map');

    let pool = [];
    const joinedName = normalizeSearch(animeParts.join(' '));
    const exactMatch = animes.find(a => normalizeSearch(a) === joinedName);
    
    if (exactMatch) {
      pool.push(...animeMap[exactMatch]);
    } else {
      animeParts.forEach(p => {
        const term = normalizeSearch(decodeURIComponent(p));
        const targetAnime = animes.find(a => {
          const normA = normalizeSearch(a);
          return normA === term || normA.includes(term);
        });
        if (targetAnime && animeMap[targetAnime]) pool.push(...animeMap[targetAnime]);
      });
    }

    if (pool.length === 0) {
      return sendError('Anime not found in database', 404, { suggestions: animes.slice(0, 5) });
    }

    const finalPool = filterByLength(pool, lengthFilter);
    if (finalPool.length === 0) {
      return sendError(`No quotes found matching length "${lengthFilter}" for these animes`, 404);
    }

    return sendJSON(getRandom(finalPool, count));

  } catch (err) {
    console.error('[API Error]:', err.stack);
    return sendError('Internal Server Error', 500);
  }
}
