"""
Script pour exporter l'index RAG de Mia en fichier JSON
À exécuter une seule fois pour préparer les données pour le backend Node.js
"""
import os
import sys
import json

# Ajoute le dossier parent au path pour importer les modules Mia
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from Mia.ui.rag_system import MiaRAG

def export_rag_to_json(output_file='mia-backend/data/rag_index.json'):
    """
    Exporte l'index RAG (chunks + métadonnées + embeddings) en JSON
    """
    print("🔄 Chargement du système RAG...")
    data_dir = os.path.join(os.path.dirname(__file__), '..', 'Mia', 'data')
    rag = MiaRAG(data_dir)
    
    print("🔄 Récupération de tous les documents indexés...")
    # Récupère tous les documents de la collection ChromaDB
    all_docs = rag.collection.get(
        include=['documents', 'metadatas', 'embeddings']
    )
    
    # Prépare les données pour l'export
    export_data = {
        'chunks': [],
        'metadata': {
            'total_chunks': len(all_docs['ids']),
            'model': 'paraphrase-multilingual-MiniLM-L12-v2',
            'exported_at': str(os.path.getmtime(data_dir))
        }
    }
    
    # Convertit en format JSON-friendly
    for i, doc_id in enumerate(all_docs['ids']):
        # Convertit l'embedding NumPy array en liste Python
        embedding = all_docs['embeddings'][i]
        if hasattr(embedding, 'tolist'):
            embedding = embedding.tolist()  # NumPy array → liste
        
        chunk_data = {
            'id': doc_id,
            'text': all_docs['documents'][i],
            'metadata': all_docs['metadatas'][i],
            'embedding': embedding  # Liste de floats
        }
        export_data['chunks'].append(chunk_data)
    
    # Crée le dossier de sortie si nécessaire
    os.makedirs(os.path.dirname(output_file), exist_ok=True)
    
    # Sauvegarde en JSON
    print(f"💾 Sauvegarde dans {output_file}...")
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(export_data, f, ensure_ascii=False, indent=2)
    
    print(f"✅ Export terminé ! {len(export_data['chunks'])} chunks exportés.")
    print(f"📊 Taille du fichier : {os.path.getsize(output_file) / 1024:.2f} KB")

if __name__ == '__main__':
    export_rag_to_json()
