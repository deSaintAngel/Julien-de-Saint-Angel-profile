"""
Script pour compter les tokens dans l'export RAG
"""
import json

# Charge le fichier JSON
with open('mia-backend/data/rag_index.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# Calcule les statistiques
total_chars = sum(len(chunk['text']) for chunk in data['chunks'])
num_chunks = len(data['chunks'])

# Approximation : 1 token ≈ 4 caractères pour le français
tokens_total = total_chars // 4
tokens_per_chunk = tokens_total // num_chunks

print(f"📊 Statistiques de l'export RAG")
print(f"=" * 50)
print(f"Nombre de chunks      : {num_chunks}")
print(f"Total caractères      : {total_chars:,}")
print(f"Tokens estimés (÷4)   : ~{tokens_total:,} tokens")
print(f"Moyenne par chunk     : {total_chars // num_chunks:,} caractères (~{tokens_per_chunk} tokens)")
print(f"=" * 50)

# Contexte RAG typique : top 3 chunks
context_tokens = tokens_per_chunk * 3
print(f"\n🔍 Contexte RAG (top 3 chunks)")
print(f"Tokens de contexte    : ~{context_tokens} tokens")

# Estimation coût par requête avec Gemini 2.0 Flash
system_prompt_tokens = 200  # Estimation du prompt système
user_question_tokens = 50   # Question moyenne
response_tokens = 300       # Réponse moyenne

total_input = system_prompt_tokens + context_tokens + user_question_tokens
total_output = response_tokens
total_per_request = total_input + total_output

# Prix Gemini 2.0 Flash (gratuit jusqu'à 1500 req/jour)
# Input: $0.075 / 1M tokens
# Output: $0.30 / 1M tokens
cost_input = (total_input / 1_000_000) * 0.075
cost_output = (total_output / 1_000_000) * 0.30
cost_total = cost_input + cost_output

print(f"  - Prompt système     : ~{system_prompt_tokens} tokens")
print(f"  - Question           : ~{user_question_tokens} tokens")
print(f"  - Total INPUT        : ~{total_input} tokens")
print(f"  - Réponse (OUTPUT)   : ~{response_tokens} tokens")
print(f"  - TOTAL par requête  : ~{total_per_request} tokens")

print(f"\n💰 Coût estimé par requête (Gemini 2.0 Flash)")
print(f"  - Input  : ${cost_input:.6f}")
print(f"  - Output : ${cost_output:.6f}")
print(f"  - TOTAL  : ${cost_total:.6f} (~{cost_total * 100:.4f}¢)")

print(f"\n📈 Budget de 1€/mois")
queries_per_euro = 1.0 / cost_total
print(f"  - Nombre de requêtes : ~{int(queries_per_euro):,}")
print(f"  - Par jour (30j)     : ~{int(queries_per_euro / 30)}")

print(f"\n🎁 Offre gratuite Gemini")
print(f"  - 1500 requêtes/jour GRATUITES")
print(f"  - 45,000 requêtes/mois GRATUITES")
print(f"  - Suffisant pour commencer sans coût !")


