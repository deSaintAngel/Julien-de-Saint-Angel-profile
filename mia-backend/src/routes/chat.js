// nodemailer and sendmail route will be defined after router initialization
/**
 * Route /api/chat - Endpoint principal pour les conversations avec Mia
 */

const express = require('express');
const router = express.Router();
const quotaService = require('../services/quotaService');
const ragService = require('../services/ragService');

const groqService = require('../services/groqService');
const { readTextFileSync } = require('../services/fileUtil');

const nodemailer = require('nodemailer');

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
router.post('/sendmail', async (req, res) => {
  try {
    const { userId, messages, email } = req.body;
    // Vérification des conditions
    if (!userId || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ success: false, error: 'Paramètres manquants ou invalides' });
    }
    // Vérifier qu'il y a au moins un message utilisateur
    const hasUserMessage = messages.some(m => m.type === 'user');
    if (!hasUserMessage) {
      return res.status(400).json({ success: false, error: 'Aucun message utilisateur' });
    }
    // Formatage du contenu du mail
    const html = `
      <h2>Nouvelle discussion Mia</h2>
      <ul>
        ${messages.map(m => `<li><b>${m.type === 'user' ? 'Utilisateur' : (m.type === 'bot' ? 'Mia' : 'Système')}</b> : ${m.text}</li>`).join('')}
      </ul>
      <p>UserId: ${userId}</p>
    `;
    // Envoi du mail
    await transporter.sendMail({
      from: process.env.MIA_MAIL_USER || 'votre.email@gmail.com',
      to: email || 'julien.desaintangel@gmail.com',
      subject: 'Nouvelle discussion Mia',
      html
    });
    res.json({ success: true });
  } catch (error) {
    console.error('Erreur envoi mail chat:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur envoi mail' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { userId, message, history } = req.body;

    // Validation
    if (!message || message.trim().length === 0) {
      return res.status(400).json({
        error: 'Message vide',
        message: 'Veuillez poser une question'
      });
    }


    // Crée ou récupère la session (désactivation temporaire du quota pour les tests)
    // const session = quotaService.getOrCreateSession(userId);
    // if (!quotaService.hasQuota(session.userId)) {
    //   return res.status(403).json({
    //     error: 'Quota épuisé',
    //     message: 'Veuillez validez que vous n etes pas un robot',
    //     quota: 0,
    //     userId: session.userId
    //   });
    // }


    // Lecture des fichiers contextuels (profil et thèse)
    let profil = '';
    let these = '';
    try { 
      profil = readTextFileSync('profil_julien.txt');
    } catch (e) {
      console.warn('Impossible de lire profil_julien.txt:', e.message);
    }
    try {
      these = readTextFileSync('these_julien.txt');
    } catch (e) {
      console.warn('Impossible de lire these_julien.txt:', e.message);
    }

    // Appel du RAG pour obtenir des passages pertinents
    let ragPassages = '';
    let ragResults = [];
    try {
      // Utilise la fonction exportée `searchRelevantChunks` du service RAG
      ragResults = ragService.searchRelevantChunks(message);
      if (Array.isArray(ragResults) && ragResults.length > 0) {
        ragPassages = ragResults.map((p, i) => `Passage RAG ${i+1} :\nSource: ${p.source}\n${p.text}`).join('\n\n');
      }
    } catch (e) {
      console.warn('Impossible de récupérer les passages RAG:', e.message);
    }

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
  console.log('----------------------------');

  // Génère la réponse avec Groq (prompt enrichi)
  console.log('🤖 Appel Groq avec contexte enrichi...');
  const groqResult = await groqService.generateResponse(message, context);

    if (!groqResult.success) {
      return res.status(500).json({
        error: 'Une erreur est survenue, veuillez renouveler votre question...',
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


