/**
 * Middleware d'authentification pour sécuriser les routes API
 */

function verifyApiKey(req, res, next) {
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey) {
    return res.status(401).json({ 
      error: 'API key manquante',
      message: 'Veuillez fournir une clé API dans le header X-API-Key' 
    });
  }
  
  if (apiKey !== process.env.BACKEND_API_KEY) {
    return res.status(403).json({ 
      error: 'API key invalide',
      message: 'La clé API fournie n\'est pas valide' 
    });
  }
  
  next();
}

module.exports = { verifyApiKey };
