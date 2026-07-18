"""
Construction de l'index RAG de Mia.

Principe (adapté à une recherche par mots-clés, sans embeddings) :
- On lit UNIQUEMENT les fichiers curés du dossier ``data/corpus/`` (le LaTeX brut
  de la thèse n'est plus indexé : il ajoutait du bruit).
- Chaque section commençant par ``## `` devient UN chunk cohérent (un concept).
  Les titres de niveau ``# `` servent de simples séparateurs de dossier logique.
- On ne coupe jamais au milieu d'une phrase : si une section dépasse MAX_CHARS,
  on la redécoupe sur des frontières de paragraphe / phrase.
- Une éventuelle ligne ``Mots-clés:`` / ``Keywords:`` est extraite dans un champ
  ``keywords`` (et conservée dans le texte) pour améliorer le rappel.

Sortie : ``data/rag_index.json`` (FR) et ``data/rag_index_en.json`` (EN),
au format ``{"chunks": [...]}`` compatible avec ragService.js.
"""

import os
import json
import re

BASE_DIR = os.path.dirname(__file__)
CORPUS_DIR = os.path.join(BASE_DIR, '../data/corpus')
OUT_DIR = os.path.join(BASE_DIR, '../data')

MAX_CHARS = 1800   # taille max d'un chunk avant redécoupage
MIN_CHARS = 40     # en dessous, on ignore (titres orphelins)

KEYWORDS_RE = re.compile(r'^(?:mots[- ]?cl[ée]s?|keywords?)\s*:\s*(.+)$',
                         re.IGNORECASE | re.MULTILINE)


def split_long(text):
    """Redécoupe un texte trop long sur des frontières propres (paragraphe puis phrase)."""
    if len(text) <= MAX_CHARS:
        return [text]
    pieces = []
    paragraphs = re.split(r'\n\s*\n', text)
    buf = ''
    for p in paragraphs:
        if len(buf) + len(p) + 2 <= MAX_CHARS:
            buf = (buf + '\n\n' + p) if buf else p
            continue
        if buf:
            pieces.append(buf)
            buf = ''
        if len(p) <= MAX_CHARS:
            buf = p
        else:
            # paragraphe géant : on coupe sur les fins de phrase
            sentences = re.split(r'(?<=[.!?])\s+', p)
            sbuf = ''
            for s in sentences:
                if len(sbuf) + len(s) + 1 <= MAX_CHARS:
                    sbuf = (sbuf + ' ' + s) if sbuf else s
                else:
                    if sbuf:
                        pieces.append(sbuf)
                    sbuf = s
            if sbuf:
                buf = sbuf
    if buf:
        pieces.append(buf)
    return pieces


def extract_header(chunk_text):
    """Renvoie le titre (première ligne ## ...) nettoyé, ou ''."""
    first = chunk_text.strip().splitlines()[0] if chunk_text.strip() else ''
    return re.sub(r'^#+\s*', '', first).strip()


def build_rag_index(suffix):
    chunks = []
    if not os.path.isdir(CORPUS_DIR):
        raise SystemExit(f"Dossier corpus introuvable : {CORPUS_DIR}")

    files = sorted(f for f in os.listdir(CORPUS_DIR) if f.endswith('.txt'))
    for fname in files:
        is_en = fname.endswith('_en.txt')
        if suffix == '_en' and not is_en:
            continue
        if suffix == '' and is_en:
            continue

        with open(os.path.join(CORPUS_DIR, fname), 'r', encoding='utf-8') as f:
            text = f.read()

        # Découpe : chaque ligne commençant par '## ' ouvre un nouveau chunk.
        # (Les lignes '# ' de niveau 1 sont des titres de regroupement : on les
        #  garde collées au chunk suivant.)
        sections = re.split(r'(?m)^(?=##\s)', text)
        chunk_index = 0
        for sec in sections:
            sec = sec.strip()
            # On n'indexe que les vraies sections '## ...'. Le contenu placé avant
            # la première (typiquement le titre de fichier de niveau '# ') est ignoré.
            if not sec.startswith('##'):
                continue
            if len(sec) < MIN_CHARS:
                continue
            header = extract_header(sec)
            kw_match = KEYWORDS_RE.search(sec)
            keywords = kw_match.group(1).strip() if kw_match else ''
            for piece in split_long(sec):
                piece = piece.strip()
                if len(piece) < MIN_CHARS:
                    continue
                chunks.append({
                    'id': f'{fname}_chunk_{chunk_index}',
                    'text': piece,
                    'source_file': fname,
                    'header': header,
                    'keywords': keywords,
                    'chunk_index': chunk_index,
                    'embedding': [],
                })
                chunk_index += 1

    outpath = os.path.join(OUT_DIR, f'rag_index{suffix}.json')
    with open(outpath, 'w', encoding='utf-8') as f:
        json.dump({'chunks': chunks}, f, ensure_ascii=False, indent=2)
    print(f'Index RAG genere : {outpath} ({len(chunks)} chunks)')


if __name__ == '__main__':
    build_rag_index('')      # Francais
    build_rag_index('_en')   # Anglais
