const fs = require('fs');
const path = require('path');

const SOURCE_FILE = path.join(__dirname, '..', 'animequotes.json');
const DIST_DIR = path.join(__dirname, '..', 'db');

if (!fs.existsSync(DIST_DIR)) {
  fs.mkdirSync(DIST_DIR, { recursive: true });
}

console.log('🚀 Building AadishAnime Databases...');

function normalize(str) {
  return str
    .replace(/\\n/g, ' ')
    .replace(/\\/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

const rawData = JSON.parse(fs.readFileSync(SOURCE_FILE, 'utf8'));

const allQuotes = [];
const animeSet = new Set();
const charSet = new Set();
const animeMap = {};

for (const anime in rawData) {
  animeSet.add(anime);
  animeMap[anime] = [];
  
  for (const character in rawData[anime]) {
    charSet.add(character);
    const quotes = rawData[anime][character];
    
    quotes.forEach(q => {
      const normalized = normalize(q);
      const entry = {
        animename: anime,
        character: character,
        quote: normalized
      };
      allQuotes.push(entry);
      animeMap[anime].push(entry);
    });
  }
}

const animes = Array.from(animeSet).sort();
const characters = Array.from(charSet).sort();

fs.writeFileSync(path.join(DIST_DIR, 'quotes.json'), JSON.stringify(allQuotes));
fs.writeFileSync(path.join(DIST_DIR, 'animes.json'), JSON.stringify(animes));
fs.writeFileSync(path.join(DIST_DIR, 'characters.json'), JSON.stringify(characters));
fs.writeFileSync(path.join(DIST_DIR, 'map.json'), JSON.stringify(animeMap));

const stats = {
  quotes: fs.statSync(path.join(DIST_DIR, 'quotes.json')).size,
  total: allQuotes.length,
  animes: animes.length,
  chars: characters.length
};

console.log(`✅ Success! [${new Date().toLocaleTimeString()}]
- Total Quotes: ${stats.total}
- Unique Animes: ${stats.animes}
- Unique Characters: ${stats.chars}
- Database Size: ${(stats.quotes / 1024 / 1024).toFixed(2)} MB
`);
