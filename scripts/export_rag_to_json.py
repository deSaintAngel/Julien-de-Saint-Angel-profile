"""
Script pour exporter l'index RAG de Mia en fichier JSON
À exécuter une seule fois pour préparer les données pour le backend Node.js
"""
import os
import sys
import json

# Ajoute le dossier parent au path pour importer les modules Mia
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))



def export_rag_to_json(output_file='mia-backend/data/rag_index.json'):
    """
    Exporte l'index RAG (chunks + métadonnées + embeddings) en JSON
    """
    print("🔄 Lecture des fichiers texte dans mia-backend/data ...")
    data_dir = os.path.join(os.path.dirname(__file__), '..', 'mia-backend', 'data')
    txt_files = [f for f in os.listdir(data_dir) if f.endswith('.txt')]

    export_data = {
        'chunks': [],
        'metadata': {
            'total_chunks': len(txt_files),
            'model': 'none',
            'exported_at': str(os.path.getmtime(data_dir))
        }
    }


    chunk_size = 500
    for fname in txt_files:
        fpath = os.path.join(data_dir, fname)
        with open(fpath, 'r', encoding='utf-8') as f:
            text = f.read()
        # Découpe le texte en chunks de 500 caractères
        for i in range(0, len(text), chunk_size):
            chunk_text = text[i:i+chunk_size]
            chunk_data = {
                'id': f"{fname}_chunk_{i//chunk_size+1}",
                'text': chunk_text,
                'metadata': {'source_file': fname, 'chunk_index': i//chunk_size+1},
                'embedding': []
            }
            export_data['chunks'].append(chunk_data)

    os.makedirs(os.path.dirname(output_file), exist_ok=True)
    print(f"💾 Sauvegarde dans {output_file} ...")
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(export_data, f, ensure_ascii=False, indent=2)

    print(f"✅ Export terminé ! {len(export_data['chunks'])} fichiers exportés.")
    print(f"📊 Taille du fichier : {os.path.getsize(output_file) / 1024:.2f} KB")

if __name__ == '__main__':
    export_rag_to_json()


