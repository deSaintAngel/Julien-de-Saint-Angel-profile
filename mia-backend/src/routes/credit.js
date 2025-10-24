/**
 * Route /api/credit - Crédite le quota après pub rewardée
 */

const express = require('express');
const router = express.Router();
const quotaService = require('../services/quotaService');

router.post('/', (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({
        error: 'userId manquant',
        message: 'Veuillez fournir un userId'
      });
    }
    
    // TODO: Vérifier que la pub a bien été visionnée (intégration plateforme pub)
    // Pour l'instant, on crédite directement
    
    const newQuota = quotaService.addQuota(userId, quotaService.QUOTA_PER_AD);
    
    console.log(`💰 Quota crédité pour ${userId}: +${quotaService.QUOTA_PER_AD} (total: ${newQuota})`);
    
    res.json({
      success: true,
      message: `${quotaService.QUOTA_PER_AD} questions débloquées !`,
      quota: newQuota,
      userId
    });
    
  } catch (error) {
    console.error('❌ Erreur route /api/credit:', error);
    res.status(500).json({
      error: 'Erreur serveur',
      message: 'Une erreur inattendue s\'est produite'
    });
  }
});

module.exports = router;


