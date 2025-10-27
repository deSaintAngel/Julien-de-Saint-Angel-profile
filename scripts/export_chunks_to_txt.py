import json

INPUT_PATH = '../mia-backend/data/rag_index.json'
OUTPUT_PATH = 'chunks_export.txt'
SEPARATOR = '\n--- CHUNK {id} ---\n'

def main():
    with open(INPUT_PATH, 'r', encoding='utf-8') as f:
        data = json.load(f)
    chunks = data.get('chunks', [])
    with open(OUTPUT_PATH, 'w', encoding='utf-8') as out:
        for chunk in chunks:
            out.write(SEPARATOR.format(id=chunk['id']))
            out.write(chunk['text'].strip() + '\n')
    print(f"Exported {len(chunks)} chunks to {OUTPUT_PATH}")

if __name__ == '__main__':
    main()
