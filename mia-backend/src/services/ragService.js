/**
 * Service RAG - Recherche sémantique dans l'index exporté
 */

const fs = require('fs');
const path = require('path');


let ragIndex = null;
let ragIndexEn = null;

/**
 * Charge l'index RAG depuis le fichier JSON
 */
function loadRagIndex(lang = null) {
  if (lang === 'en') {
    if (ragIndexEn) return ragIndexEn;
    const indexPathEn = path.join(__dirname, '../../data/rag_index_en.json');
    if (!fs.existsSync(indexPathEn)) {
      console.error('❌ Fichier rag_index_en.json introuvable !');
      return null;
    }
    console.log('📚 Chargement de l\'index RAG anglais...');
    ragIndexEn = JSON.parse(fs.readFileSync(indexPathEn, 'utf-8'));
    console.log(`✅ ${ragIndexEn.chunks.length} EN chunks chargés`);
    return ragIndexEn;
  } else {
    if (ragIndex) return ragIndex;
    const indexPath = path.join(__dirname, '../../data/rag_index.json');
    if (!fs.existsSync(indexPath)) {
      console.error('❌ Fichier rag_index.json introuvable !');
      return null;
    }
    console.log('📚 Chargement de l\'index RAG...');
    ragIndex = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));
    console.log(`✅ ${ragIndex.chunks.length} chunks chargés`);
    return ragIndex;
  }
}

/**
 * Calcule la similarité cosinus entre deux vecteurs
 */
function cosineSimilarity(vecA, vecB) {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Normalise une chaîne : minuscules + suppression des accents.
 * Permet de matcher "detection" avec "détection", "semantique" avec "sémantique", etc.
 */
function normalize(str) {
  return (str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

// Mots vides (FR + EN) : trop fréquents pour être discriminants. On les retire
// des requêtes pour que les mots porteurs (ex. "jobscope", "unapei") dominent.
const STOPWORDS = new Set([
  // FR
  'les', 'des', 'une', 'est', 'sont', 'que', 'qui', 'quoi', 'quel', 'quelle',
  'quels', 'quelles', 'ces', 'cette', 'son', 'sic', 'ton', 'tes', 'mes', 'ses',
  'aux', 'dans', 'pour', 'par', 'sur', 'avec', 'nous', 'vous', 'ils', 'elles',
  'elle', 'plus', 'moins', 'fait', 'faire', 'dit', 'peux', 'peut', 'comment',
  'pourquoi', 'donc', 'aussi', 'entre', 'chez', 'ainsi', 'tout', 'tous', 'toute',
  'parle', 'moi', 'dis', 'explique', 'raconte',
  // EN
  'the', 'and', 'are', 'was', 'were', 'his', 'her', 'she', 'they', 'you',
  'what', 'who', 'which', 'how', 'does', 'did', 'about', 'tell', 'give', 'for',
  'with', 'this', 'that', 'these', 'those', 'from', 'have', 'has', 'can', 'your',
  'their', 'him', 'its', 'into', 'more', 'than', 'then', 'them', 'there',
]);

/**
 * Recherche les chunks les plus pertinents (recherche par mots-clés pondérée).
 *
 * Score d'un chunk = somme, pour chaque mot significatif de la question, de :
 *   +3 si le mot est présent dans l'en-tête (titre ## du chunk),
 *   +2 si le mot est présent dans la ligne "Mots-clés",
 *   +1 si le mot est présent dans le corps du texte.
 * Insensible aux accents et à la casse. Pas d'embeddings nécessaires.
 */
function searchRelevantChunks(query, topK = 4) {
  let lang = null;
  let actualQuery = query;
  if (typeof query === 'object' && query !== null) {
    actualQuery = query.text || '';
    lang = query.lang || null;
  }

  const index = loadRagIndex(lang);
  if (!index) return [];

  const allWords = [...new Set(normalize(actualQuery).split(/\s+/).filter(w => w.length > 2))];
  // On retire les mots vides ; si la requête n'était QUE des mots vides, on garde tout.
  let words = allWords.filter(w => !STOPWORDS.has(w));
  if (words.length === 0) words = allWords;
  if (words.length === 0) return [];

  // Stemming léger : on retire un "s" final (pluriel) pour que "passions" matche
  // "passion", "anomalies" matche "anomalie", etc. (recherche par sous-chaîne).
  const needles = words.map(w => (w.length > 4 && w.endsWith('s')) ? w.slice(0, -1) : w);

  const scored = index.chunks.map(chunk => {
    const textNorm = normalize(chunk.text);
    const headerNorm = normalize(chunk.header || '');
    const kwNorm = normalize(chunk.keywords || '');
    let score = 0;
    needles.forEach(word => {
      if (headerNorm.includes(word)) score += 3;
      if (kwNorm.includes(word)) score += 2;
      if (textNorm.includes(word)) score += 1;
    });
    return { chunk, score };
  });

  scored.sort((a, b) => b.score - a.score);

  return scored
    .filter(item => item.score > 0)
    .slice(0, topK)
    .map(item => ({
      text: item.chunk.text,
      source: item.chunk.source_file,
      header: item.chunk.header || '',
      score: item.score
    }));
}

/**
 * Construit le contexte pour le prompt Gemini
 */
function buildContext(relevantChunks) {
  if (relevantChunks.length === 0) {
    return "Aucun contexte spécifique trouvé.";
  }
  
  let context = "Contexte pertinent :\n\n";
  
  relevantChunks.forEach((chunk, index) => {
    context += `[Source ${index + 1}: ${chunk.source}]\n`;
    context += `${chunk.text}\n\n`;
  });
  
  return context;
}

module.exports = {
  loadRagIndex,
  searchRelevantChunks,
  buildContext
};


