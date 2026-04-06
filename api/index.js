const fs = require('fs');
const path = require('path');

// 🧬 Lazy-Initialized Database (Optimized for Vercel Cold Starts)
let DB_CACHE = { quotes: null, animes: null, characters: null, map: null };

const loadDB = () => {
  if (DB_CACHE.quotes) return true;
  try {
    // Vercel Serverless environment requires process.cwd() to resolve paths reliably from the project root.
    const dbPath = (name) => path.join(process.cwd(), 'api', 'db', `${name}.json`);
    
    DB_CACHE.quotes = JSON.parse(fs.readFileSync(dbPath('quotes'), 'utf8'));
    DB_CACHE.animes = JSON.parse(fs.readFileSync(dbPath('animes'), 'utf8'));
    DB_CACHE.characters = JSON.parse(fs.readFileSync(dbPath('characters'), 'utf8'));
    DB_CACHE.map = JSON.parse(fs.readFileSync(dbPath('map'), 'utf8'));
    console.log('[DB]: Successfully initialized database into memory from ' + process.cwd());
    return true;
  } catch (err) {
    console.error('[DB Error]: Failed to read optimized database files.', err.message);
    // Fallback: Try static require if fs.readFileSync fails. Native require works with Vercel NFT bundling.
    try {
      DB_CACHE.quotes = require('./db/quotes.json');
      DB_CACHE.animes = require('./db/animes.json');
      DB_CACHE.characters = require('./db/characters.json');
      DB_CACHE.map = require('./db/map.json');
      console.log('[DB]: Successfully initialized database via static require.');
      return true;
    } catch (reqErr) {
      console.error('[DB Error]: Static require also failed.', reqErr.message);
      return false;
    }
  }
};

const SPECIAL_ANIME = ["One Piece", "Naruto", "Bleach"];

/**
 * Standardized Response Helpers
 */
const sendJSON = (res, data, status = 200) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=30');
  res.setHeader('X-Powered-By', 'AadishAnime Quotes Engine');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.status(status).send(JSON.stringify(data, null, 2));
};

const sendError = (res, message, status = 400, extras = {}) => {
  sendJSON(res, { error: message, ...extras }, status);
};

/**
 * High-Performance Random Selection
 */
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

/**
 * Core Logic Units
 */
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

module.exports = (req, res) => {
  // 1. Core Data Load Security
  if (!loadDB()) {
    return sendError(res, 'Database unavailable. Ensure "npm run build" was executed successfully before deployment.', 500, {
      hint: "Run 'npm run build' locally and verify 'api/db/' directory contains all .json files."
    });
  }

  const { quotes, animes, characters, map: animeMap } = DB_CACHE;

  try {
    const url = (req.url || '/api/random').split('?')[0];
    const host = req.headers.host || 'localhost';
    const query = req.url.includes('?') ? new URL(req.url, `http://${host}`).searchParams : new URLSearchParams();
    
    // 🔍 Local Debug Login
    console.log(`[Request]: ${req.method} ${url}`);

    // 1. Discovery Routes
    if (url === '/api/list/animes') return sendJSON(res, animes);
    if (url === '/api/list/characters') return sendJSON(res, characters);

    // 2. Search Engine
    if (url === '/api/search') {
      const q = query.get('q')?.toLowerCase();
      if (!q) return sendError(res, 'Search query "q" required');
      const results = quotes.filter(item => 
        item.quote.toLowerCase().includes(q) || 
        item.character.toLowerCase().includes(q) || 
        item.animename.toLowerCase().includes(q)
      );
      return sendJSON(res, getRandom(results, 10));
    }

    // 3. Special Pools
    if (url === '/api/special') {
      const pool = [];
      SPECIAL_ANIME.forEach(a => { if (animeMap[a]) pool.push(...animeMap[a]); });
      return sendJSON(res, getRandom(pool));
    }

    // 4. Advanced Dynamic Routing
    const path = url.replace('/api/', '').replace(/\/$/, '');
    if (!path || path === 'index.js') return sendJSON(res, getRandom(quotes));

    const parts = path.split('-');
    let count = 1;
    let lengthFilter = null;
    let animeParts = [];

    // Intelligent Path Parsing
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

    // Case: Pure Random with optional length/count
    if (animeParts.length === 1 && animeParts[0] === 'random') {
      const filtered = filterByLength(quotes, lengthFilter);
      return sendJSON(res, getRandom(filtered, count));
    }

    // Construct Anime Pool
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
      return sendError(res, 'Anime not found in database', 404, { suggestions: animes.slice(0, 5) });
    }

    const finalPool = filterByLength(pool, lengthFilter);
    if (finalPool.length === 0) {
      return sendError(res, `No quotes found matching length "${lengthFilter}" for these animes`, 404);
    }

    return sendJSON(res, getRandom(finalPool, count));

  } catch (err) {
    console.error('[API Error]:', err);
    return sendError(res, 'Internal Server Error', 500);
  }
};
