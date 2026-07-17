/**
 * Serveur Express principal pour Mia Backend
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { verifyApiKey } = require('./middleware/auth');
const { apiLimiter } = require('./middleware/rateLimit');
const chatRoute = require('./routes/chat');
const creditRoute = require('./routes/credit');
const adRoute = require('./routes/ad');
const ragService = require('./services/ragService');


const app = express();
const PORT = process.env.PORT || 3000;

// Derrière le proxy Render : nécessaire pour que req.ip soit la vraie IP client
// (sinon le rate-limit par IP est inefficace).
app.set('trust proxy', 1);

// Configuration CORS — liste blanche d'origines autorisées.
// Surchargeable via ALLOWED_ORIGINS (domaines séparés par des virgules).
const allowedOrigins = (process.env.ALLOWED_ORIGINS ||
  'https://desaintangel.github.io,http://localhost:8080,http://127.0.0.1:8080')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Requêtes sans origine (curl, health-checks, appels serveur-à-serveur) : tolérées.
    if (!origin) {
      return callback(null, true);
    }
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Origin non autorisée par CORS'));
  },
  credentials: true
}));

// Middleware
app.use(express.json({ limit: '32kb' }));

// Route racine (publique)
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Mia Backend API</title>
      <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; }
        h1 { color: #4285f4; }
        .endpoint { background: #f5f5f5; padding: 10px; margin: 10px 0; border-radius: 5px; }
        .method { color: #0f9d58; font-weight: bold; }
      </style>
    </head>
    <body>
      <h1>🤖 Mia Backend API</h1>
      <p>Service opérationnel ✅</p>
      
      <h2>📡 Endpoints disponibles :</h2>
      
      <div class="endpoint">
        <span class="method">GET</span> /health - Vérification de l'état du serveur
      </div>
      
      <div class="endpoint">
        <span class="method">POST</span> /api/chat - Envoyer un message au chatbot
      </div>
      
      <div class="endpoint">
        <span class="method">POST</span> /api/chat/quota - Vérifier le quota restant
      </div>
      
      <div class="endpoint">
        <span class="method">POST</span> /api/ad/start - Démarrer une session publicitaire
      </div>
      
      <div class="endpoint">
        <span class="method">POST</span> /api/ad/complete - Compléter une pub et obtenir des crédits
      </div>
      
      <p><strong>🔒 Note :</strong> Les routes /api/* nécessitent une clé API valide.</p>
    </body>
    </html>
  `);
});

// Route de santé (publique)
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'Mia Backend',
    version: '1.0.0'
  });
});

// Rate-limit global sur toutes les routes /api/* (première ligne de défense anti-abus)
app.use('/api', apiLimiter);

// Routes API (clé API = filtre basique ; la vraie protection = rate-limit + budget)
app.use('/api/chat', verifyApiKey, chatRoute);
app.use('/api/credit', verifyApiKey, creditRoute);
app.use('/api/ad', verifyApiKey, adRoute);

// Route 404
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Route introuvable',
    message: `La route ${req.method} ${req.path} n'existe pas` 
  });
});

// Gestion des erreurs
app.use((err, req, res, next) => {
  console.error('❌ Erreur:', err.message);
  res.status(500).json({ 
    error: 'Erreur serveur',
    message: err.message 
  });
});

// Démarrage du serveur
app.listen(PORT, '0.0.0.0', () => {
  console.log('\n🚀 Mia Backend démarré !');
  console.log(`📡 Serveur écoute sur http://0.0.0.0:${PORT} (ou http://localhost:${PORT} en local)`);
  console.log(`🌍 Environnement: ${process.env.NODE_ENV || 'development'}`);
  

  
  // Pré-charge l'index RAG
  ragService.loadRagIndex();
  
  console.log('\n✅ Backend prêt à recevoir des requêtes\n');
});


