/**
 * Routes de gestion des publicités
 * Gère le démarrage et la validation des pubs
 */

const express = require('express');
const router = express.Router();
const adService = require('../services/adService');
const quotaService = require('../services/quotaService');

/**
 * POST /api/ad/start
 * Démarre une session de visionnage de pub
 * Body: { userId }
 */
router.post('/start', (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'userId requis'
      });
    }
    
    // Créer une session pub
    const adSession = adService.startAdSession(userId);
    
    res.json({
      success: true,
      adId: adSession.adId,
      duration: adSession.duration,
      credits: adSession.credits,
      message: `Regardez la publicité pendant ${adSession.duration / 1000} secondes pour débloquer ${adSession.credits} interactions`
    });
    
  } catch (error) {
    console.error('❌ Erreur start ad:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors du démarrage de la publicité'
    });
  }
});

/**
 * POST /api/ad/complete
 * Valide la pub visionnée et crédite l'utilisateur
 * Body: { userId, adId }
 */
router.post('/complete', (req, res) => {
  try {
    const { userId, adId } = req.body;
    
    if (!userId || !adId) {
      return res.status(400).json({
        success: false,
        error: 'userId et adId requis'
      });
    }
    
    // Vérifier que la pub a été visionnée complètement
    const verification = adService.verifyAdCompletion(adId, userId);
    
    if (!verification.success) {
      return res.status(400).json(verification);
    }
    
    // Créditer le quota
    quotaService.addQuota(userId, verification.credits);
    const newQuota = quotaService.getRemainingQuota(userId);
    
    console.log(`💰 Crédits accordés: ${userId} → ${newQuota} interactions`);
    
    res.json({
      success: true,
      creditsAdded: verification.credits,
      totalQuota: newQuota,
      message: `+${verification.credits} interactions débloquées ! Total: ${newQuota}`
    });
    
  } catch (error) {
    console.error('❌ Erreur complete ad:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la validation de la publicité'
    });
  }
});

/**
 * GET /api/ad/stats
 * Stats des sessions pub actives (debug)
 */
router.get('/stats', (req, res) => {
  try {
    const stats = adService.getStats();
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('❌ Erreur stats:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des stats'
    });
  }
});

module.exports = router;


