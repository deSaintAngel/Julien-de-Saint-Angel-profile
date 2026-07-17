/**
 * Circuit-breaker : plafond GLOBAL d'appels LLM par jour.
 *
 * Rôle : borner le coût maximal quoi qu'il arrive. Même si toutes les autres
 * défenses tombaient (clé fuitée, IP tournantes...), le nombre total d'appels
 * Groq sur une journée ne peut pas dépasser GLOBAL_DAILY_LLM_MAX.
 *
 * Stockage en mémoire : suffisant pour une instance Render unique. Pour du
 * multi-instance, migrer ce compteur vers Redis.
 */

const DAILY_MAX = parseInt(process.env.GLOBAL_DAILY_LLM_MAX || '2000', 10);

let currentDay = null;
let count = 0;

function today() {
  return new Date().toISOString().slice(0, 10); // AAAA-MM-JJ (UTC)
}

function rollIfNeeded() {
  const d = today();
  if (d !== currentDay) {
    currentDay = d;
    count = 0;
  }
}

/**
 * Tente de consommer un appel LLM.
 * @returns {boolean} true si autorisé, false si le plafond journalier est atteint.
 */
function tryConsume() {
  rollIfNeeded();
  if (count >= DAILY_MAX) {
    return false;
  }
  count++;
  return true;
}

function stats() {
  rollIfNeeded();
  return {
    day: currentDay,
    used: count,
    max: DAILY_MAX,
    remaining: Math.max(0, DAILY_MAX - count),
  };
}

module.exports = { tryConsume, stats, DAILY_MAX };
