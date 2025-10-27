import os
import re
import json

# Dossier contenant les fichiers texte à indexer
DATA_DIR = os.path.join(os.path.dirname(__file__), '..', 'mia-backend', 'data')
OUTPUT_FILE = os.path.join(DATA_DIR, 'rag_index.json')

# Titres de sections typiques à détecter (à adapter selon tes fichiers)
SECTION_PATTERNS = [
    r'^\s*(FORMATION|CONTRIBUTIONS SCIENTIFIQUES|EXPÉRIENCE PROFESSIONNELLE|COMPÉTENCES|PARCOURS ACADÉMIQUE|CHAPITRES|RÉSUMÉ|OBJECTIFS SCIENTIFIQUES|CONTRIBUTIONS PRINCIPALES|APPLICATIONS|ENCADREMENT|TITRE|RÉSULTATS CLÉS|SOUTENANCE|UNIVERSITÉ|LABORATOIRE|EXAMINATEURS|DIRECTEUR DE THÈSE|DIRECTRICE DE LABORATOIRE|RAPPORT(EUR|EURS)?|STAGE|ENSEIGNANT|PROFESSEUR|PUBLICATIONS|DÉFINITION|PROPRIÉTÉ|SECTION|SUBSECTION|ANNEXE|CONCLUSION|INTRODUCTION|COUVERTURE|QUATRIEME|MAIN|CORPUS FONDAMENTAL)\s*:?\s*$',
    r'^\s*[A-ZÉÈÀÙÂÊÎÔÛÇ\- ]{4,}\s*:?\s*$',  # Titres en majuscules (fallback)
    r'^\s*\d+\.\s',                          # Listes numérotées
    r'^\s*-\s',                                # Listes à puces
    r'^---+$',                                   # Séparateurs
]

# Fonction pour détecter un séparateur de section
def is_section_title(line):
    for pat in SECTION_PATTERNS:
        if re.match(pat, line):
            return True
    return False

def split_into_chunks(text):
    lines = text.split('\n')
    chunks = []
    current_chunk = []
    max_chunk_size = 1000  # max chars per chunk
    def flush_chunk(force=False):
        nonlocal current_chunk
        if current_chunk:
            chunk = '\n'.join(current_chunk).strip()
            if chunk and (force or len(chunk) > 20):
                while len(chunk) > max_chunk_size:
                    # Try to split on paragraph or sentence
                    split_idx = chunk.rfind('\n\n', 0, max_chunk_size)
                    if split_idx == -1:
                        split_idx = chunk.rfind('.', 0, max_chunk_size)
                    # Si aucun séparateur trouvé ou trop proche du début, on coupe à max_chunk_size
                    if split_idx == -1 or split_idx < int(0.3 * max_chunk_size):
                        split_idx = max_chunk_size
                    part = chunk[:split_idx].strip()
                    if not part or len(chunk) == len(part):
                        # Sécurité : si rien n'avance, on évite la boucle infinie
                        break
                    chunks.append(part)
                    chunk = chunk[split_idx:].strip()
                if chunk:
                    chunks.append(chunk)
            current_chunk = []

    for idx, line in enumerate(lines):
        # Split on section titles
        if is_section_title(line):
            flush_chunk()
            current_chunk = [line]
            continue
        # Split on empty line (paragraph)
        if line.strip() == '':
            flush_chunk()
            continue
        # Split on list items
        if re.match(r'^\s*([-*•]|\d+\.)\s+', line):
            flush_chunk()
            current_chunk = [line]
            continue
        current_chunk.append(line)
        # If chunk is getting too big, flush
        if sum(len(l) for l in current_chunk) > max_chunk_size:
            flush_chunk()
    # Dernier chunk
    flush_chunk(force=True)
    return chunks

def main():
    txt_files = [f for f in os.listdir(DATA_DIR) if f.endswith('.txt')]
    export_data = {
        'chunks': [],
        'metadata': {
            'total_chunks': 0,
            'model': 'none',
            'exported_at': str(int(os.path.getmtime(DATA_DIR)))
        }
    }
    for fname in txt_files:
        fpath = os.path.join(DATA_DIR, fname)
        with open(fpath, 'r', encoding='utf-8') as f:
            text = f.read()
        chunks = split_into_chunks(text)
        for i, chunk in enumerate(chunks):
            export_data['chunks'].append({
                'id': f'{fname}_chunk_{i}',
                'text': chunk,
                'source_file': fname,
                'chunk_index': i,
                'embedding': []
            })
    export_data['metadata']['total_chunks'] = len(export_data['chunks'])
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(export_data, f, ensure_ascii=False, indent=2)
    print(f'✅ {len(export_data["chunks"])} chunks exportés dans {OUTPUT_FILE}')

if __name__ == '__main__':
    main()
