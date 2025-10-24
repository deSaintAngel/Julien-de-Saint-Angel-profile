/**
 * Serveur HTTP simple pour tester le frontend
 * Usage: node serve-frontend.js
 * Puis ouvrir: http://localhost:5500
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 5500;
const FRONTEND_DIR = path.join(__dirname, 'mia-frontend');

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  console.log(`📥 ${req.method} ${req.url}`);
  
  // Route par défaut vers test-local.html
  let filePath = req.url === '/' 
    ? path.join(FRONTEND_DIR, 'test-local.html')
    : path.join(FRONTEND_DIR, req.url);
  
  const extname = String(path.extname(filePath)).toLowerCase();
  const contentType = MIME_TYPES[extname] || 'application/octet-stream';
  
  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('<h1>404 - Fichier non trouvé</h1>', 'utf-8');
      } else {
        res.writeHead(500);
        res.end('Erreur serveur: ' + error.code);
      }
    } else {
      res.writeHead(200, { 
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*'
      });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(PORT, () => {
  console.log('');
  console.log('🌐 Serveur frontend démarré !');
  console.log(`📡 Ouvrir: http://localhost:${PORT}`);
  console.log('📂 Dossier: ' + FRONTEND_DIR);
  console.log('');
  console.log('✅ Prêt pour les tests !');
  console.log('');
});


