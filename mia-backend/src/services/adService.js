/**
 * Service de gestion des publicités et crédits
 * Gère l'état des pubs visionnées et l'attribution des crédits
 */

// Stockage en mémoire des sessions de pub (en production, utiliser Redis ou DB)
const adSessions = new Map();

// Configuration
const AD_DURATION = 30000; // Durée minimale pub (30 secondes)
const AD_CREDITS = 50; // Nombre de crédits accordés après une pub

/**
 * Initialise une session de visionnage de pub
 * @param {string} userId - ID de l'utilisateur
 * @returns {object} - Session avec adId et timestamp
 */
function startAdSession(userId) {
  const adId = generateAdId();
  const session = {
    adId,
    userId,
    startTime: Date.now(),
    completed: false,
    credited: false
  };
  
  adSessions.set(adId, session);
  
  // Nettoyage auto après 2 minutes (sécurité)
  setTimeout(() => {
    if (adSessions.has(adId)) {
      adSessions.delete(adId);
    }
  }, 120000);
  
  console.log(`📺 Nouvelle session pub: ${adId} pour user ${userId}`);
  
  return {
    adId,
    duration: AD_DURATION,
    credits: AD_CREDITS
  };
}

/**
 * Vérifie et valide le visionnage complet d'une pub
 * @param {string} adId - ID de la session pub
 * @param {string} userId - ID de l'utilisateur
 * @returns {object} - Résultat de la vérification
 */
function verifyAdCompletion(adId, userId) {
  const session = adSessions.get(adId);
  
  // Vérifications de sécurité
  if (!session) {
    console.log(`❌ Session pub inexistante: ${adId}`);
    return {
      success: false,
      error: 'Session de publicité invalide ou expirée'
    };
  }
  
  if (session.userId !== userId) {
    console.log(`❌ User mismatch pour session ${adId}`);
    return {
      success: false,
      error: 'Session de publicité invalide'
    };
  }
  
  if (session.credited) {
    console.log(`⚠️ Crédit déjà accordé pour ${adId}`);
    return {
      success: false,
      error: 'Crédits déjà accordés pour cette publicité'
    };
  }
  
  // Vérifier que la durée minimale est respectée
  const elapsed = Date.now() - session.startTime;
  if (elapsed < AD_DURATION) {
    const remaining = Math.ceil((AD_DURATION - elapsed) / 1000);
    console.log(`⏳ Pub non terminée: ${remaining}s restantes`);
    return {
      success: false,
      error: `Veuillez regarder la publicité encore ${remaining} secondes`
    };
  }
  
  // Marquer comme crédité
  session.completed = true;
  session.credited = true;
  
  console.log(`✅ Pub complétée: ${adId} → +${AD_CREDITS} crédits pour ${userId}`);
  
  // Nettoyer la session
  adSessions.delete(adId);
  
  return {
    success: true,
    credits: AD_CREDITS
  };
}

/**
 * Génère un ID unique pour une session pub
 * @returns {string} - ID unique
 */
function generateAdId() {
  return 'ad_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

/**
 * Obtient les statistiques des sessions actives (debug)
 * @returns {object} - Stats
 */
function getStats() {
  return {
    activeSessions: adSessions.size,
    adDuration: AD_DURATION / 1000 + 's',
    creditsPerAd: AD_CREDITS
  };
}

module.exports = {
  startAdSession,
  verifyAdCompletion,
  getStats,
  AD_CREDITS
};
