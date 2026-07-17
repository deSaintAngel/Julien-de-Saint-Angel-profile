/**
 * Limiteurs de débit par IP (défense anti-abus).
 *
 * IMPORTANT : c'est le vrai levier de protection du backend. Contrairement à une
 * clé API embarquée dans le frontend (publique, donc inutile), ces limites
 * s'appliquent à TOUT appelant (navigateur, script, curl...) et bornent le coût.
 *
 * Toutes les valeurs sont surchargeables via variables d'environnement.
 */

const rateLimit = require('express-rate-limit');

const minutes = (n) => n * 60 * 1000;

// Limite globale « douce » sur l'ensemble des routes /api/*
const apiLimiter = rateLimit({
  windowMs: minutes(parseInt(process.env.API_RATE_WINDOW_MIN || '5', 10)),
  max: parseInt(process.env.API_RATE_MAX || '100', 10),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Trop de requêtes',
    message: 'Vous avez envoyé trop de requêtes. Veuillez patienter quelques instants.',
  },
});

// Limite stricte sur le chat (chaque message = un appel LLM coûteux)
const chatLimiter = rateLimit({
  windowMs: minutes(parseInt(process.env.CHAT_RATE_WINDOW_MIN || '5', 10)),
  max: parseInt(process.env.CHAT_RATE_MAX || '30', 10),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Trop de messages',
    message: 'Vous avez envoyé trop de messages en peu de temps. Réessayez dans quelques minutes.',
  },
});

// Limite très stricte sur l'envoi d'e-mails (anti-spam / anti-relais ouvert)
const mailLimiter = rateLimit({
  windowMs: minutes(parseInt(process.env.MAIL_RATE_WINDOW_MIN || '60', 10)),
  max: parseInt(process.env.MAIL_RATE_MAX || '3', 10),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Trop d\'envois. Réessayez plus tard.',
  },
});

module.exports = { apiLimiter, chatLimiter, mailLimiter };
