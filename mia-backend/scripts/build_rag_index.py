import os
import json
import re

# Configuration
DATA_DIR = os.path.join(os.path.dirname(__file__), '../data')
CHUNK_SIZE = 1200  # caractères par chunk (ajuster si besoin)

# Génère un index RAG pour une langue donnée (suffixe: '' ou '_en')
def build_rag_index(suffix):
    chunks = []
    for fname in os.listdir(DATA_DIR):
        if fname.endswith(f'{suffix}.txt'):
            path = os.path.join(DATA_DIR, fname)
            with open(path, 'r', encoding='utf-8') as f:
                text = f.read()
            # Découpage par section (## ou #) ou par taille
            sections = re.split(r'(^#+ .*$)', text, flags=re.MULTILINE)
            buffer = ''
            chunk_index = 0
            for part in sections:
                if part.strip().startswith('#'):
                    if buffer.strip():
                        # Ajoute le chunk précédent
                        chunks.append({
                            'id': f'{fname}_chunk_{chunk_index}',
                            'text': buffer.strip(),
                            'source_file': fname,
                            'chunk_index': chunk_index,
                            'embedding': []
                        })
                        chunk_index += 1
                        buffer = ''
                    buffer += part + '\n'
                else:
                    buffer += part
                    # Si trop long, découpe
                    while len(buffer) > CHUNK_SIZE:
                        cut = buffer[:CHUNK_SIZE]
                        chunks.append({
                            'id': f'{fname}_chunk_{chunk_index}',
                            'text': cut.strip(),
                            'source_file': fname,
                            'chunk_index': chunk_index,
                            'embedding': []
                        })
                        chunk_index += 1
                        buffer = buffer[CHUNK_SIZE:]
            if buffer.strip():
                chunks.append({
                    'id': f'{fname}_chunk_{chunk_index}',
                    'text': buffer.strip(),
                    'source_file': fname,
                    'chunk_index': chunk_index,
                    'embedding': []
                })
    # Écriture du fichier d'index
    outname = f'rag_index{suffix}.json'
    outpath = os.path.join(DATA_DIR, outname)
    with open(outpath, 'w', encoding='utf-8') as f:
        json.dump({'chunks': chunks}, f, ensure_ascii=False, indent=2)
    print(f'Index RAG généré : {outpath} ({len(chunks)} chunks)')

if __name__ == '__main__':
    build_rag_index('')      # Français
    build_rag_index('_en')   # Anglais
