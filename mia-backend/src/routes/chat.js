/**
 * Route /api/chat - Endpoint principal pour les conversations avec Mia
 */

const express = require('express');
const router = express.Router();
const quotaService = require('../services/quotaService');
const ragService = require('../services/ragService');
const groqService = require('../services/groqService');

router.post('/', async (req, res) => {
  try {
    const { userId, message } = req.body;
    
    // Validation
    if (!message || message.trim().length === 0) {
      return res.status(400).json({
        error: 'Message vide',
        message: 'Veuillez poser une question'
      });
    }
    
    // Crée ou récupère la session
    const session = quotaService.getOrCreateSession(userId);
    
    // Vérifie le quota
    if (!quotaService.hasQuota(session.userId)) {
      return res.status(403).json({
        error: 'Quota épuisé',
        message: 'Veuillez regarder une publicité pour débloquer 20 questions',
        quota: 0,
        userId: session.userId
      });
    }
    
    // Recherche RAG
    console.log(`🔍 Recherche RAG pour: "${message}"`);
    const relevantChunks = ragService.searchRelevantChunks(message, 3);
    const context = ragService.buildContext(relevantChunks);
    
    // Génère la réponse avec Groq
    console.log(`🤖 Appel Groq...`);
    const groqResult = await groqService.generateResponse(message, context);

    if (!groqResult.success) {
      return res.status(500).json({
        error: 'Une erreur est survenue, veuillez renouveler votre question...',
        message: groqResult.response,
        quota: quotaService.getRemainingQuota(session.userId),
        userId: session.userId
      });
    }

    // Consomme le quota
    quotaService.consumeQuota(session.userId);

    // Prépare les sources
    const sources = relevantChunks.map(chunk => chunk.source);

    // Réponse réussie
    res.json({
      success: true,
      response: groqResult.response,
      sources: sources.length > 0 ? sources : ['Connaissance générale'],
      quota: quotaService.getRemainingQuota(session.userId),
      userId: session.userId
    });

    console.log(`✅ Réponse envoyée. Quota restant: ${quotaService.getRemainingQuota(session.userId)}`);
    
  } catch (error) {
    console.error('❌ Erreur route /api/chat:', error);
    res.status(500).json({
      error: 'Erreur serveur',
      message: 'Une erreur inattendue s\'est produite'
    });
  }
});

/**
 * POST /api/chat/quota
 * Récupère le quota actuel d'un utilisateur
 */
router.post('/quota', (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'userId requis'
      });
    }
    
    const session = quotaService.getOrCreateSession(userId);
    const quota = quotaService.getRemainingQuota(session.userId);
    
    res.json({
      success: true,
      quota: quota,
      userId: session.userId
    });
    
  } catch (error) {
    console.error('❌ Erreur route /api/chat/quota:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur'
    });
  }
});

module.exports = router;
