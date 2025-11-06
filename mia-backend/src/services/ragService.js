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
 * Recherche les chunks les plus pertinents
 * Note: Pour la version simplifiée, on utilise une recherche par mots-clés
 * Pour une vraie similarité sémantique, il faudrait appeler l'API Gemini Embeddings
 */
function searchRelevantChunks(query, topK = 3) {
  // Detect if query is for English context (if query is an object with lang, or if global.lang is set)
  let lang = null;
  let actualQuery = query;
  if (typeof query === 'object' && query !== null) {
    actualQuery = query.text || '';
    lang = query.lang || null;
  }
  // Optionally, allow passing lang as a second argument in the future

  const index = loadRagIndex(lang);
  if (!index) return [];

  const queryLower = (actualQuery || '').toLowerCase();
  const scored = index.chunks
    .map(chunk => {
      const textLower = chunk.text.toLowerCase();
      // Score basique : compte les mots de la question dans le chunk
      const words = queryLower.split(/\s+/).filter(w => w.length > 3);
      let score = 0;
      words.forEach(word => {
        if (textLower.includes(word)) {
          score += 1;
        }
      });
      return { chunk, score };
    });

  // Trie par score décroissant
  scored.sort((a, b) => b.score - a.score);

  // Retourne les top K avec score > 0
  return scored
    .filter(item => item.score > 0)
    .slice(0, topK)
    .map(item => ({
      text: item.chunk.text,
      source: item.chunk.source_file,
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


