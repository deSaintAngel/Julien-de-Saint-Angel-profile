// Serveur de test minimal
const express = require('express');
const app = express();
const PORT = 3000;

app.use(express.json());

app.get('/health', (req, res) => {
  console.log('✅ Requête reçue sur /health');
  res.json({ 
    status: 'ok', 
    message: 'Serveur de test fonctionne !',
    timestamp: new Date().toISOString()
  });
});

app.get('/', (req, res) => {
  console.log('✅ Requête reçue sur /');
  res.send('<h1>Backend Mia - Serveur de test</h1><p>Le serveur fonctionne correctement !</p>');
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`\n🚀 Serveur de test démarré sur http://127.0.0.1:${PORT}`);
  console.log(`📡 Testez avec: http://localhost:${PORT}/health\n`);
});
