import os
import json

DATA_DIR = os.path.join(os.path.dirname(__file__), '..', 'mia-backend', 'data')
OUTPUT_FILE = os.path.join(DATA_DIR, 'rag_index.json')
CHUNK_SIZE = 500  # caractères

# Liste des fichiers à ignorer
IGNORE_FILES = {'rag_index.json'}

def chunk_text(text, chunk_size):
    # Découpe le texte en morceaux de chunk_size caractères
    return [text[i:i+chunk_size] for i in range(0, len(text), chunk_size)]

def main():
    rag_chunks = []
    for fname in os.listdir(DATA_DIR):
        if fname.endswith('.txt') and fname not in IGNORE_FILES:
            fpath = os.path.join(DATA_DIR, fname)
            with open(fpath, 'r', encoding='utf-8') as f:
                content = f.read()
                chunks = chunk_text(content, CHUNK_SIZE)
                for idx, chunk in enumerate(chunks):
                    rag_chunks.append({
                        'source_file': fname,
                        'chunk_id': f"{fname}_{idx}",
                        'text': chunk.strip()
                    })
    rag_index = {
        'chunks': rag_chunks,
        'metadata': {
            'total_chunks': len(rag_chunks),
            'chunk_size': CHUNK_SIZE,
            'exported_at': __import__('datetime').datetime.now().isoformat()
        }
    }
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as out:
        json.dump(rag_index, out, ensure_ascii=False, indent=2)
    print(f"✅ Export RAG terminé : {OUTPUT_FILE} ({len(rag_chunks)} chunks)")

if __name__ == '__main__':
    main()


