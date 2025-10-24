/**
 * Service Gemini - Appels à l'API Gemini 2.5 Flash
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Prompt système pour Mia
const SYSTEM_PROMPT = `Tu es Mia, l'assistante IA de Julien De Saint Angel. Tu réponds de façon naturelle et équilibrée.

Règles générales:
- Tu es Mia, l'assistante de Julien De Saint Angel. Tu parles de lui à la 3e personne (il/lui/son).
- Si une information correspond exactement au contexte fourni, cite-la textuellement.
- Réponds en 1-3 phrases, style conversationnel, sauf si la question demande du détail.
- Varie tes formulations.
- Valorise le profil de Julien de façon factuelle et mesurée.

Adaptation selon le type de question:
- TECHNIQUES/RECHERCHE : sois précis, rigoureux, cite les noms exacts.
- GENERALES : sois souple, naturel, donne une vue d'ensemble.

Valorisation mesurée:
✅ "Il a développé une méthode innovante"
✅ "Son expertise couvre les CNN, RNN et Transformers"
❌ "Il est exceptionnel" (trop)
❌ "C'est un génie" (trop)`;

/**
 * Génère une réponse avec Gemini 1.5 Flash
 */
async function generateResponse(userMessage, context) {
  try {
  const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    
    // Construction du prompt complet
    const fullPrompt = `${SYSTEM_PROMPT}

${context}

Question de l'utilisateur : ${userMessage}

Réponds de manière naturelle et concise :`;
    
    // Appel API Gemini
    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const text = response.text();
    
    return {
      success: true,
      response: text.trim()
    };
    
  } catch (error) {
    console.error('❌ Erreur Gemini:', error.message);
    
    return {
      success: false,
      error: error.message,
      response: "Désolé, je rencontre un problème technique. Veuillez réessayer dans quelques instants."
    };
  }
}

/**
 * Vérifie que la clé API Gemini est configurée
 */
function checkApiKey() {
  if (!process.env.GEMINI_API_KEY) {
    console.error('❌ GEMINI_API_KEY non configurée dans .env');
    return false;
  }
  return true;
}



// Seul 'gemini-pro' est accessible via le SDK Node.js public

module.exports = {
  generateResponse,
  checkApiKey
};
