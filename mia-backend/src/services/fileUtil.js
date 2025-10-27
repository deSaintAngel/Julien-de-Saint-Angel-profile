const fs = require('fs');
const path = require('path');

// Utilitaire pour lire un fichier texte de façon synchrone (UTF-8)
function readTextFileSync(relPath) {
  // Lecture depuis le dossier racine `mia-backend/data` (projet root)
  const absPath = path.join(__dirname, '..', '..', 'data', relPath);
  return fs.readFileSync(absPath, 'utf8');
}

module.exports = { readTextFileSync };