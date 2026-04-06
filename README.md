# 🌟 AadishAnime Quotes API

[![Cloudflare Deployment](https://img.shields.io/badge/Cloudflare_Pages-Deployed-F38020?style=for-the-badge&logo=cloudflare)](https://aadishquotes.pages.dev)
[![Node version](https://img.shields.io/badge/Node-v22+-green?style=for-the-badge&logo=node.js)](https://nodejs.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](https://opensource.org/licenses/MIT)

A high-performance, serverless anime quote engine featuring a striking **Neobrutalism** design and advanced, power-user routing. Built for speed, flexibility, and the anime community.

---

## ⚡ Quick Start

Visit the live portal to use the **Interactive URL Builder**:
👉 **[aadishquotes.pages.dev](https://aadishquotes.pages.dev)**

---

## 🚀 API Reference

All responses are **Pretty-Printed JSON** by default for maximum readability.

### 1. Random Quotes
Get quotes from across the entire database of 8,600+ entries.
- `/api/random` — Get 1 lucky quote.
- `/api/random-5` — Get 5 random quotes.
- `/api/random-high-10` — Get 10 long philosophical quotes.

### 2. Targeted Anime Routing
Target specific animes or create custom pools.
- `/api/Naruto` — Get a random Naruto quote.
- `/api/One_Piece-5` — Get 5 One Piece quotes.
- `/api/Bleach-Naruto-10` — Create a pool from both series.

### 3. Length Filtering
Fine-tune your results using length flags:
- `low` / `short`: 1-15 words.
- `med` / `medium`: 16-35 words.
- `high` / `long`: 36+ words.
- *Example*: `/api/random-low-5`

### 4. Discovery & Search
- `/api/list/animes` — List all 800+ supported titles.
- `/api/list/characters` — List all 2,300+ characters.
- `/api/search?q=goku` — Search by keyword, character, or anime.

---

## 🛠️ Local Development

We use `wrangler` to fully emulate the Cloudflare Pages serverless environment.

### Setup & Optimization
```bash
# 1. Install dependencies
npm install

# 2. Build & Optimize DB (Required for first run)
npm run build

# 3. Start Development Server
npm run dev
```

### Deployment
```bash
# Trigger production deployment
npm run deploy
```

---

## 🏗️ Technical Architecture
- **Pre-Indexed Data**: $O(1)$ lookup for anime pools thanks to a custom build-time indexing script.
- **Serverless Edge**: Optimized for Cloudflare Pages Functions with ASSETS bindings.
- **Neobrutalism UI**: A premium, high-contrast dashboard with a built-in testing console and social sharing.

*Crafted by Aadish. Optimized for the modern web.*
