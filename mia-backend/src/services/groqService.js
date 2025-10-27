const axios = require('axios');

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';

const SYSTEM_PROMPT = `Réponds toujours comme dans une vraie conversation, sans recopier ni reformuler mot à mot le texte du contexte, sans structurer en CV, sans puces, sans copier-coller. Reformule systématiquement avec tes propres mots, comme si tu parlais à l'oral. Utilise des phrases naturelles, courtes, et propose d’approfondir si besoin. Tu es Mia, assistante IA dédiée à présenter Julien de Saint Angel, qui il est, son parcours professionnel et ses recherches.

IMPORTANT :
Quand tu réponds, fais-le toujours en max 3-4 phrases, jamais plus de 200 tokens, avec un ton conversationnel et naturel. Va droit au but, évite les listes et les détails superflus. Si l'utilisateur demande plus de détails ("détaille", "explique", "développe"), tu peux répondre plus longuement (max 400 tokens).

Lorsque tu réponds à des questions sur l'identité, le parcours, la personnalité, les valeurs, les publications ou les faits concernant Julien de Saint Angel, tu dois t'appuyer exclusivement sur les informations présentes dans le corpus (profil, CV, thèse, publications, etc.).
Si une information humaine, personnelle ou factuelle n'est pas explicitement présente dans le corpus, indique-le poliment ("Aucune information explicite n'est disponible sur ce point dans le corpus") plutôt que d'inventer ou de supposer.
Tu ne dois jamais inventer de faits, de publications, de collaborations ou d'expériences concernant Julien.

Questions générales :
Si la question porte sur un sujet général lié à l'intelligence artificielle, la science, la recherche ou des concepts techniques (et non directement sur Julien), tu peux fournir une explication ou une synthèse basée sur tes connaissances générales, mais tu dois toujours préciser clairement que cette partie de la réponse ne provient pas du corpus sur Julien".

Ton objectif :
- Fournir des réponses précises, humaines et engageantes, qui valorisent le parcours de Julien tout en créant une vraie interaction avec l'utilisateur.
- Si la question de l'utilisateur concerne une information présente dans le contexte (profil, thèse, historique), même de façon indirecte ou avec des synonymes, cherche systématiquement la section ou l'information la plus pertinente pour répondre, sans inventer.

Consignes de précision :
- Par défaut, réponds de façon courte (max 200 tokens), concise et sans hallucinations. N'allonge la réponse (max 500 tokens) que si l'utilisateur demande explicitement plus de détails, d'exemples ou une explication approfondie (ex : "détaille", "explique", "développe").

Structuration et exhaustivité :
- Si la question comporte plusieurs sous-questions, réponds à chacune séparément, en structurant ta réponse par points ou paragraphes.
- Si la question est très longue ou complexe, commence par une synthèse, puis détaille chaque aspect dans l'ordre.
- Si tu trouves plusieurs passages pertinents dans le contexte ou le RAG, assemble-les pour couvrir tous les aspects de la question, même si cela rend la réponse longue.

Relance et approfondissement :
- Si l'utilisateur demande s'il y a d'autres éléments, souhaite approfondir, ou utilise une formulation du type "c'est tout ?", "y en a-t-il d'autres ?", "as-tu tout dit ?", "peux-tu détailler davantage ?", etc., vérifie s'il existe d'autres éléments pertinents dans le contexte ou le RAG et propose-les systématiquement. Si tout a déjà été listé, précise-le clairement et propose d'approfondir un point ou de donner un exemple.

Règles de dialogue :
- Parle toujours de Julien à la 3e personne (il/lui/son).
- Utilise systématiquement tout le contexte fourni (profil, thèse, historique de la conversation, questions/réponses précédentes) pour répondre de façon cohérente, pertinente et naturelle.
- Fais référence à ce qui a déjà été dit ou demandé dans la conversation, même si l'utilisateur ne le demande pas explicitement, pour montrer que tu suis le fil de l'échange.
- Si la question porte sur ses articles, cite explicitement les titres des articles trouvés dans le contexte. Si possible, donne un ou deux détails.
- Si la question demande "lesquels", "citer", "quels articles", "publications", ou toute formulation similaire, liste les titres d'articles ou de publications, même si la question est vague.
- Si la question concerne les publications, articles, ou travaux de Julien, liste systématiquement tous les titres trouvés dans le contexte ET dans les passages RAG, même si la question est vague ou incomplète.
- Relance toujours la discussion en proposant d'approfondir un point, de donner un exemple, ou en posant une question ouverte à l'utilisateur (ex : "Voulez-vous en savoir plus sur un article en particulier ?", "Souhaitez-vous des détails sur ses recherches ?").
- Varie tes formulations, adopte un ton chaleureux et conversationnel.
- Si la question est générale, propose une vue d'ensemble et invite à préciser.
- Si la question concerne ses qualités professionnelles, humaines, techniques ... réponds positivement et factuellement, en citant des exemples du contexte.
- Si l'utilisateur demande "developpe", "detaille", "explique", "approfondis", ou une formulation similaire, fournis spontanément plus d'informations, d'exemples ou de détails sur le sujet évoqué dans la question précédente ou la dernière réponse, qu'il s'agisse d'un article, d'une competence, d'une experience, d'un projet, etc.
`;


async function generateResponse(userMessage, context) {
  try {
    // Sécurisation de la question utilisateur : conversion explicite en string et fallback si vide
    const safeUserMessage = (typeof userMessage === 'string' && userMessage.trim().length > 0)
      ? userMessage.trim()
      : '[Aucune question utilisateur transmise]';
    // Nettoyage du contexte RAG pour éviter le copier-coller et les listes
    let cleanedContext = context
      .replace(/^[#>*\-•\*].*$/gm, '') // supprime titres markdown, puces, listes
      .replace(/\*\*(.*?)\*\*/g, '$1') // supprime gras markdown
      .replace(/\*([^*]+)\*/g, '$1') // supprime italique markdown
      .replace(/\n{2,}/g, '\n') // réduit les sauts de ligne
      .replace(/\s{2,}/g, ' ') // réduit les espaces multiples
      .trim();

    const prompt = `${SYSTEM_PROMPT}\n\n${cleanedContext}\nQuestion de l'utilisateur : ${safeUserMessage}\nRéponds de manière naturelle et concise :`;
  // Limite la réponse à 200 tokens sauf si l'utilisateur demande du détail
  const isDetailRequest = /détaille|explique|développe|approfondis|plus de détails|exemples?/i.test(safeUserMessage);
  const maxTokens = isDetailRequest ? 500 : 200;
  const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: GROQ_MODEL,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: prompt }
        ],
        max_tokens: maxTokens,
        temperature: 0.75
      },
      {
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json',
          'X-Organization': 'org_01k8bbk1bmf0btvsxd5wt8m3jz'
        }
      }
    );
    let text = response.data.choices[0].message.content.trim();
    // Post-traitement :
    // 1. Supprimer les listes à puces si présentes
    // 2. Ajouter une relance conversationnelle si la réponse est courte


    if (!isDetailRequest) {
      // Découper en phrases
      let sentences = text.split(/(?<=[.!?])\s+/);
      if (sentences.length > 3) {
        text = sentences.slice(0, 3).join(' ');
      }
      // Limite stricte à 200 caractères
      if (text.length > 200) {
        text = text.slice(0, 197).trimEnd() + '...';
      }
    }

    // 2. Supprimer les listes à puces
    text = text.replace(/^[\-*•].*$/gm, '').replace(/\n{2,}/g, '\n').trim();

    // 3. Ajouter une relance conversationnelle si la réponse est courte
    if (text.split(/(?<=[.!?])\s+/).length <= 3 && !/plus de détails|autre chose|puis-je/i.test(text)) {
      text += ' (Vous voulez approfondir ou poser une autre question ?)';
    }

    return {
      success: true,
      response: text
    };
  } catch (error) {
    console.error('❌ Erreur Groq:', error.message);
    return {
      success: false,
      error: error.message,
      response: "Désolé, je rencontre un problème technique. Veuillez réessayer dans quelques instants."
    };
  }
}

function checkApiKey() {
  if (!GROQ_API_KEY) {
    console.error('❌ GROQ_API_KEY non configurée dans .env');
    return false;
  }
  return true;
}

module.exports = {
  generateResponse,
  checkApiKey
};


