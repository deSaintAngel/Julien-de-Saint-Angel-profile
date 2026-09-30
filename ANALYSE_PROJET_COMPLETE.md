# 📊 ANALYSE COMPLÈTE DU PROJET MIA + PORTFOLIO

**Date d'analyse :** 24 octobre 2025  
**Localisation :** `C:\Users\julien_orbitalis\Documents\`

---

## 🎯 VUE D'ENSEMBLE

### Projets identifiés

1. **`projet_MIA_dialogue/`** (3.7 MB) - Projet principal de l'agent conversationnel Mia
2. **`Julien-de-Saint-Angel-profile/`** (0.7 MB) - Site portfolio GitHub Pages

---

## 📁 STRUCTURE DÉTAILLÉE

### 1️⃣ PROJET_MIA_DIALOGUE

```
projet_MIA_dialogue/
├── Mia/                                    # ❓ Projet Python original (à analyser)
│   └── (structure à déterminer)
│
├── mia-backend/                            # ✅ Backend Node.js (3.6 MB)
│   ├── src/
│   │   ├── middleware/
│   │   │   └── auth.js                    # Vérification API Key
│   │   ├── routes/
│   │   │   ├── chat.js                    # Endpoint principal /api/chat
│   │   │   └── credit.js                  # Endpoint /api/credit (pub)
│   │   ├── services/
│   │   │   ├── geminiService.js           # Intégration Gemini API
│   │   │   ├── quotaService.js            # Gestion quotas en mémoire
│   │   │   └── ragService.js              # Recherche sémantique RAG
│   │   └── server.js                      # Serveur Express principal
│   │
│   ├── data/
│   │   └── rag_index.json                 # ✅ Export RAG (300 KB, 21 chunks)
│   │
│   ├── node_modules/                      # 103 packages npm
│   ├── package.json                       # Dépendances : Express, Gemini, CORS
│   ├── .env                               # ✅ Configuré avec clés API
│   ├── .env.example                       # Template configuration
│   └── README.md                          # Guide déploiement Render
│
├── mia-frontend/                           # Templates frontend (27 KB)
│   ├── chat-widget.css                    # Styles widget chat
│   ├── chat-widget.js                     # Logique JavaScript
│   ├── chat-widget.html                   # Instructions intégration
│   └── README.md                          # Guide intégration GitHub Pages
│
├── scripts/                                # Scripts utilitaires (5 KB)
│   ├── export_rag_to_json.py             # ✅ Export ChromaDB → JSON
│   └── count_tokens.py                    # ✅ Analyse tokens/coûts
│
└── Julien-de-Saint-Angel-profile-main/    # ❌ Copie en double (à supprimer)
    └── (ancien fichier ZIP décompressé)
```

### 2️⃣ JULIEN-DE-SAINT-ANGEL-PROFILE (Site Portfolio)

```
Julien-de-Saint-Angel-profile/
├── assets/
│   ├── images/
│   │   ├── julien.png
│   │   └── im_n.jpg
│   └── pdf/
│       ├── cv_julien_de_saint_angel_2026.pdf
│       └── cv_julien_de_saint_angel_2026_en.pdf
│
├── css/
│   └── style.css
│
├── js/
│   └── main.js
│
├── index.html                             # ✅ Page principale (propre)
├── README.md                              # Description du site
├── robots.txt                             # SEO
├── sitemap.xml                            # SEO
├── google3121db8c9700cbc4.html           # Vérification Google
└── .gitignore                             # ✅ Créé (ignore package-lock.json)
```

---

## 🔧 CONFIGURATION ACTUELLE

### Backend (mia-backend)

**Environnement (.env) :**
- ✅ `GEMINI_API_KEY` : Configurée
- ✅ `BACKEND_API_KEY` : Configurée (6a6cd4e...)
- ✅ `JWT_SECRET` : Configurée
- ✅ `ADSENSE_CLIENT_ID` : ca-pub-5215342224838884
- ✅ `PORT` : 3000
- ✅ `NODE_ENV` : development
- ✅ `ALLOWED_ORIGINS` : GitHub Pages + localhost

**Dépendances installées :**
- Express (serveur web)
- @google/generative-ai (Gemini API)
- cors (gestion CORS)
- dotenv (variables d'environnement)
- uuid (génération IDs)
- + 98 autres dépendances

**Base RAG :**
- ✅ Fichier : `data/rag_index.json` (300 KB)
- ✅ Chunks : 21 documents
- ✅ Tokens : ~11,119 tokens total
- ✅ Modèle embeddings : paraphrase-multilingual-MiniLM-L12-v2

### Frontend (GitHub Pages)

**État :**
- ✅ Site en ligne : https://desaintangel.github.io/Julien-de-Saint-Angel-profile/
- ✅ Version propre (sans widget chat)
- ✅ Git synchronisé
- ✅ Structure professionnelle (assets/, css/, js/)

---

## 📊 STATISTIQUES

### Tokens & Coûts (Gemini 2.0 Flash)

| Métrique | Valeur |
|----------|--------|
| **Chunks totaux** | 21 |
| **Caractères totaux** | 44,476 |
| **Tokens estimés** | ~11,119 tokens |
| **Tokens par chunk** | ~529 tokens/chunk |
| **Contexte RAG (top 3)** | ~1,587 tokens |
| **Coût par requête** | ~$0.000228 (0.02¢) |
| **Budget 1€/mois** | ~4,390 requêtes/mois |
| **Offre gratuite Gemini** | 1,500 req/jour = 45,000/mois |

---

## ✅ CE QUI FONCTIONNE

1. **Backend Node.js**
   - ✅ Code complet et structuré
   - ✅ Dépendances installées
   - ✅ Configuration .env complète
   - ✅ Export RAG fonctionnel
   - ✅ Serveur démarre sans erreur

2. **Site Portfolio**
   - ✅ En ligne sur GitHub Pages
   - ✅ Design professionnel
   - ✅ SEO configuré
   - ✅ Git propre et synchronisé

3. **Scripts utilitaires**
   - ✅ Export RAG → JSON fonctionnel
   - ✅ Analyse tokens/coûts fonctionnelle

---

## ⚠️ POINTS D'ATTENTION

### À vérifier / compléter

1. **Projet Python Mia original**
   - ❓ Structure du dossier `Mia/` non documentée
   - ❓ Point d'entrée (app.py ?) à identifier
   - ❓ Système RAG Python (ChromaDB) à analyser
   - ❓ Interface Tkinter mentionnée mais non vérifiée

2. **Fichiers en double**
   - ❌ `Julien-de-Saint-Angel-profile-main/` dans `projet_MIA_dialogue/`
   - → À supprimer (copie inutile)

3. **Widget chat**
   - 🔄 Code créé mais retiré du site
   - → Décision : garder pour déploiement futur ou archiver

---

## 🎯 ARCHITECTURE TECHNIQUE

### Stack Technologique

**Backend :**
- Node.js + Express
- Gemini 2.0 Flash API
- RAG : Recherche par mots-clés dans JSON
- Quota : Système en mémoire (non persistant)
- Sécurité : API Key + CORS

**Frontend (Portfolio) :**
- HTML/CSS/JavaScript vanilla
- Responsive design
- SEO optimisé

**Frontend (Widget chat - non déployé) :**
- JavaScript vanilla
- CSS avec animations
- Système de quotas côté client
- Intégration pub (AdSense)

**Python (Mia original) :**
- ChromaDB (base vectorielle)
- Sentence Transformers (embeddings)
- Ollama Gemma 2B (LLM local)
- Tkinter (interface graphique)

---

## 🚀 PROCHAINES ÉTAPES POSSIBLES

### Option A : Déploiement complet du chatbot

1. Déployer backend sur Render
2. Réintégrer widget dans le site
3. Tester et optimiser
4. Intégrer vraies publicités (AdSense/AdMob)

### Option B : Analyser le projet Python Mia

1. Explorer structure du dossier `Mia/`
2. Identifier fichiers principaux
3. Documenter architecture Python
4. Tester interface Tkinter

### Option C : Optimisations

1. Améliorer recherche RAG (embeddings côté backend)
2. Ajouter persistance quotas (Redis/Database)
3. Monitoring et logs
4. Tests automatisés

---

## 📞 INFORMATIONS CLÉS

**APIs configurées :**
- Gemini API Key : AIzaSyA...KtDVKo
- Backend API Key : 6a6cd4e...7a0ae1f
- JWT Secret : 41834c5...64a6c4d2
- AdSense Client : ca-pub-5215342224838884

**URLs :**
- Site GitHub Pages : https://desaintangel.github.io/Julien-de-Saint-Angel-profile/
- Backend local : http://localhost:3000
- Backend production : (À déployer sur Render)

**Git :**
- Repo : https://github.com/deSaintAngel/Julien-de-Saint-Angel-profile
- Branch : main
- Dernier commit : Nettoyage fichiers (55907ff)

---

## 💡 RECOMMANDATIONS

1. **Supprimer** `projet_MIA_dialogue/Julien-de-Saint-Angel-profile-main/`
2. **Documenter** la structure du projet Python Mia original
3. **Décider** si déploiement du widget chat ou archivage
4. **Sauvegarder** les clés API en lieu sûr (gestionnaire mots de passe)
5. **Tester** le projet Python Mia pour comprendre son fonctionnement

---

*Analyse générée automatiquement le 24 octobre 2025*


