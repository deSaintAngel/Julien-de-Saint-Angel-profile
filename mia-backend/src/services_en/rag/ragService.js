// ENGLISH version of ragService.js (minimal, to be extended)
const fs = require('fs');
const path = require('path');

let ragIndexEn = null;

function loadRagIndex() {
  if (ragIndexEn) return ragIndexEn;
  const indexPathEn = path.join(__dirname, '../../../data/rag_index_en.json');
  if (!fs.existsSync(indexPathEn)) {
    console.error('❌ EN rag_index_en.json not found!');
    return { chunks: [] };
  }
  console.log('📚 Loading EN RAG index...');
  ragIndexEn = JSON.parse(fs.readFileSync(indexPathEn, 'utf-8'));
  console.log(`✅ ${ragIndexEn.chunks.length} EN chunks loaded`);
  return ragIndexEn;
}

function searchRelevantChunks(query) {
  // Minimal: just return all chunks for demo
  const index = loadRagIndex();
  return index.chunks.slice(0, 5); // Return first 5 for demo
}

module.exports = {
  searchRelevantChunks
};
