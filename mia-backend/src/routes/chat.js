// nodemailer and sendmail route will be defined after router initialization
/**
 * Route /api/chat - Endpoint principal pour les conversations avec Mia
 */

const express = require('express');
const router = express.Router();
const quotaService = require('../services/quotaService');
const ragService = require('../services/ragService');

const groqService = require('../services/groqService');
const budgetService = require('../services/budgetService');
const { chatLimiter, mailLimiter } = require('../middleware/rateLimit');
const { readTextFileSync } = require('../services/fileUtil');

const nodemailer = require('nodemailer');

// Échappe le HTML pour éviter toute injection dans le corps des e-mails.
function escapeHtml(str) {
  return String(str == null ? '' : str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Config nodemailer (exemple Gmail, à adapter avec vos identifiants)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.MIA_MAIL_USER || 'votre.email@gmail.com',
    pass: process.env.MIA_MAIL_PASS || 'votre_mot_de_passe_app',
  },
});

/**
 * POST /api/chat/sendmail
 * Envoie l'historique du chat par email si conditions remplies
 */
router.post('/sendmail', mailLimiter, async (req, res) => {
  try {
    const { userId, messages } = req.body;
    // Vérification des conditions
    if (!userId || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ success: false, error: 'Paramètres manquants ou invalides' });
    }
    // Garde-fou anti-abus : limite la taille de l'historique traité.
    if (messages.length > 100) {
      return res.status(400).json({ success: false, error: 'Historique trop volumineux' });
    }
    // Vérifier qu'il y a au moins un message utilisateur
    const hasUserMessage = messages.some(m => m.type === 'user');
    if (!hasUserMessage) {
      return res.status(400).json({ success: false, error: 'Aucun message utilisateur' });
    }
    // Formatage du contenu du mail (contenu utilisateur échappé).
    const html = `
      <h2>Nouvelle discussion Mia</h2>
      <ul>
        ${messages.map(m => `<li><b>${m.type === 'user' ? 'Utilisateur' : (m.type === 'bot' ? 'Mia' : 'Système')}</b> : ${escapeHtml(m.text)}</li>`).join('')}
      </ul>
      <p>UserId: ${escapeHtml(userId)}</p>
    `;
    // Destinataire CODÉ EN DUR (jamais fourni par le client) pour éviter tout
    // détournement du serveur en relais d'e-mails (spam via le compte Gmail).
    await transporter.sendMail({
      from: process.env.MIA_MAIL_USER || 'votre.email@gmail.com',
      to: process.env.MIA_MAIL_TO || 'julien.desaintangel@gmail.com',
      subject: 'Nouvelle discussion Mia',
      html
    });
    res.json({ success: true });
  } catch (error) {
    console.error('Erreur envoi mail chat:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur envoi mail' });
  }
});

router.post('/', chatLimiter, async (req, res) => {
  try {
    const { userId, message, history, lang } = req.body;
    console.log('[API/chat] Langue reçue dans req.body.lang :', lang);

    // Validation
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({
        error: 'Message vide',
        message: 'Veuillez poser une question'
      });
    }

    // Garde-fou : borne la longueur du message (évite les prompts géants coûteux).
    if (message.length > 2000) {
      return res.status(400).json({
        error: 'Message trop long',
        message: 'Votre message est trop long. Merci de le raccourcir.'
      });
    }

    // Circuit-breaker global : plafond quotidien d'appels LLM (coût borné).
    if (!budgetService.tryConsume()) {
      const overMsg = (lang === 'en')
        ? 'The assistant has reached its daily usage limit. Please try again tomorrow.'
        : "L'assistante a atteint sa limite d'utilisation quotidienne. Merci de réessayer demain.";
      console.warn('⛔ Plafond LLM quotidien atteint:', budgetService.stats());
      return res.status(429).json({
        error: overMsg,
        message: overMsg,
        quota: null,
        userId: userId || null
      });
    }

    // Lecture des fichiers contextuels (profil et thèse) selon la langue
    function tryReadFile(base, lang) {
      const file = lang === 'en' ? `${base}_en.txt` : `${base}.txt`;
      try {
        return readTextFileSync(file);
      } catch (e) {
        // Fallback sur FR si EN absent
        if (lang === 'en') {
          try {
            return readTextFileSync(`${base}.txt`);
          } catch (e2) {
            console.warn(`Impossible de lire ${base}.txt (fallback):`, e2.message);
            return '';
          }
        } else {
          console.warn(`Impossible de lire ${file}:`, e.message);
          return '';
        }
      }
    }

    let ragPassages = '';
    let ragResults = [];
    try {
      // Appel RAG avec paramètre lang pour filtrer les fichiers contextuels
      ragResults = ragService.searchRelevantChunks({ text: message, lang });
      if (Array.isArray(ragResults) && ragResults.length > 0) {
        ragPassages = ragResults.map((p, i) => `Passage RAG ${i+1} :\nSource: ${p.source}\n${p.text}`).join('\n\n');
      }
    } catch (e) {
      console.warn('Impossible de récupérer les passages RAG:', e.message);
    }

    let profil = tryReadFile('profil_julien', lang);
    let these = tryReadFile('these_julien', lang);

    // Formatage de l'historique (5 dernières paires Q/R)
    let formattedHistory = '';
    if (Array.isArray(history) && history.length > 0) {
      formattedHistory = history.map((msg, idx) => {
        const role = msg.type === 'user' ? 'Utilisateur' : 'Mia';
        return `${role} : ${msg.text}`;
      }).join('\n');
    }

    // Construction du contexte complet pour le LLM (avec RAG)
    const context = [
      '--- Profil de Julien ---',
      profil,
      '--- Thèse de Julien ---',
      these,
      ragPassages ? '--- Passages pertinents trouvés par RAG ---\n' + ragPassages : '',
      '--- Historique de la conversation ---',
      formattedHistory
    ].join('\n\n');

    // Affiche le prompt complet pour debug
    console.log('--- PROMPT ENVOYÉ AU LLM ---');
    console.log(context);
    console.log('Question courante :', message);
    console.log('Langue :', lang || 'fr');
    console.log('----------------------------');

    // Génère la réponse avec Groq (prompt enrichi)
    console.log('🤖 Appel Groq avec contexte enrichi...');
    const groqResult = await groqService.generateResponse(message, context, lang || 'fr');

    if (!groqResult.success) {
      const errorMsg = (lang === 'en')
        ? 'An error occurred, please try your question again...'
        : 'Une erreur est survenue, veuillez renouveler votre question...';
      return res.status(500).json({
        error: errorMsg,
        message: groqResult.response,
        quota: null,
        userId: userId || null
      });
    }

    // (dans la version de test, on ne consomme pas de quota automatique)

    // Prépare les sources à renvoyer : soit les passages RAG, soit la connaissance générale
    const sources = (Array.isArray(ragResults) && ragResults.length > 0)
      ? ragResults.map(r => r.source)
      : ['Connaissance générale'];

    // Réponse réussie
    res.json({
      success: true,
      response: groqResult.response,
      sources: sources,
      quota: null,
      userId: userId || null
    });

    console.log(`✅ Réponse envoyée pour user: ${userId || 'unknown'}`);

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


/**
 * POST /api/chat/reset
 * Ajoute 50 crédits uniquement si le quota est à 0 (validation humaine)
 */
router.post('/reset', (req, res) => {
  try {
    const { userId, forceZero } = req.body;
    if (!userId) {
      return res.status(400).json({ success: false, error: 'userId requis' });
    }
    const session = quotaService.getOrCreateSession(userId);
    let added = false;
    if (forceZero) {
      session.remaining = 0;
    } else if (quotaService.getRemainingQuota(session.userId) === 0) {
      quotaService.addQuota(session.userId, quotaService.QUOTA_PER_AD);
      added = true;
    }
    res.json({
      success: true,
      quota: quotaService.getRemainingQuota(session.userId),
      added,
      userId: session.userId
    });
  } catch (error) {
    console.error('❌ Erreur route /api/chat/reset:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

module.exports = router;


