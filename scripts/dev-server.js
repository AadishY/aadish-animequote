const express = require('express');
const path = require('path');
const http = require('http');
const handler = require('../api/index');

const app = express();
app.use(express.json());

// 📦 Serve static files from root
app.use(express.static(path.join(__dirname, '..')));

// 🔌 API Router Emulator
app.all('/api/*', (req, res) => {
    // Inject Vercel-like helper for dev
    res.status = (code) => {
        res.statusCode = code;
        return res;
    };
    return handler(req, res);
});

// 🌐 Fallback for SPA routing
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'index.html'));
});

/**
 * Port Finder Logic
 * Tries 3000, 3001, 3002... until it finds a free one
 */
function startServer(port) {
    const server = http.createServer(app);
    
    server.on('error', (e) => {
        if (e.code === 'EADDRINUSE') {
            console.log(`⚠️ Port ${port} is busy, trying ${port + 1}...`);
            startServer(port + 1);
        } else {
            console.error('[Fatal Error]:', e);
            process.exit(1);
        }
    });

    server.listen(port, () => {
        console.log('\n' + '='.repeat(50));
        console.log(`🚀 AADISHANIME DEV SERVER ONLINE`);
        console.log('='.repeat(50));
        console.log(`🏠 Landing Page : http://localhost:${port}`);
        console.log(`🧬 API Test Case : http://localhost:${port}/api/random-5`);
        console.log(`🛠️ API Builder  : http://localhost:${port}/api/list/animes`);
        console.log('='.repeat(50) + '\n');
    });
}

startServer(3000);
