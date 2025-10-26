/**
 * Service de gestion des quotas utilisateur
 * Stockage en mémoire (à migrer vers Redis pour production scalable)
 */

const { v4: uuidv4 } = require('uuid');

// Stockage en mémoire des quotas par session
const quotas = new Map();

// Configuration
const QUOTA_PER_AD = 50; // Nombre de questions débloquées par pub
const SESSION_TIMEOUT = 24 * 60 * 60 * 1000; // 24h en millisecondes

/**
 * Crée ou récupère une session utilisateur
 */
function getOrCreateSession(userId) {
  if (!userId) {
    userId = uuidv4();
  }
  
  if (!quotas.has(userId)) {
    quotas.set(userId, {
      userId,
      remaining: 0, // Commence à 0, l'utilisateur doit regarder une pub
      createdAt: Date.now(),
      lastActivity: Date.now()
    });
  } else {
    // Met à jour l'activité
    const session = quotas.get(userId);
    session.lastActivity = Date.now();
  }
  
  return quotas.get(userId);
}

/**
 * Vérifie si l'utilisateur a du quota disponible
 */
function hasQuota(userId) {
  const session = getOrCreateSession(userId);
  return session.remaining > 0;
}

/**
 * Consomme une unité de quota
 */
function consumeQuota(userId) {
  const session = getOrCreateSession(userId);
  
  if (session.remaining <= 0) {
    return false;
  }
  
  session.remaining--;
  session.lastActivity = Date.now();
  return true;
}

/**
 * Ajoute du quota (après pub rewardée)
 */
function addQuota(userId, amount = QUOTA_PER_AD) {
  const session = getOrCreateSession(userId);
  session.remaining += amount;
  // Limite le quota maximum à QUOTA_PER_AD (50)
  if (session.remaining > QUOTA_PER_AD) {
    session.remaining = QUOTA_PER_AD;
  }
  session.lastActivity = Date.now();
  return session.remaining;
}

/**
 * Récupère le quota restant
 */
function getRemainingQuota(userId) {
  const session = getOrCreateSession(userId);
  return session.remaining;
}

/**
 * Nettoie les sessions expirées (à appeler périodiquement)
 */
function cleanExpiredSessions() {
  const now = Date.now();
  let cleaned = 0;
  
  for (const [userId, session] of quotas.entries()) {
    if (now - session.lastActivity > SESSION_TIMEOUT) {
      quotas.delete(userId);
      cleaned++;
    }
  }
  
  if (cleaned > 0) {
    console.log(`🧹 ${cleaned} sessions expirées nettoyées`);
  }
}

// Nettoyage automatique toutes les heures
setInterval(cleanExpiredSessions, 60 * 60 * 1000);

module.exports = {
  getOrCreateSession,
  hasQuota,
  consumeQuota,
  addQuota,
  getRemainingQuota,
  QUOTA_PER_AD
};


