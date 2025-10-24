# 🚀 Mia Backend - Déploiement sur Render

Ce backend Node.js gère les requêtes du chatbot Mia : vérification des quotas, recherche RAG, appels à l'API Gemini.

## 📋 Prérequis

- Node.js 18+ installé
- Compte Render (gratuit) : https://render.com/
- Clé API Google Gemini : https://ai.google.dev/
- Base de connaissances RAG exportée (fichier `rag_index.json`)

## 🛠️ Installation locale

### 1. Installer les dépendances

```bash
cd mia-backend
npm install
```

### 2. Exporter l'index RAG

Depuis le dossier racine du projet, exécutez le script Python pour exporter votre base ChromaDB :

```bash
python scripts/export_rag_to_json.py
```

Cela créera le fichier `mia-backend/rag_index.json` contenant vos documents et embeddings.

### 3. Configurer les variables d'environnement

Copiez `.env.example` vers `.env` :

```bash
cp .env.example .env
```

Éditez le fichier `.env` et remplissez les valeurs :

```env
# Clé API Google Gemini (obtenue sur https://ai.google.dev/)
GEMINI_API_KEY=votre_clé_gemini_ici

# Clé secrète pour sécuriser l'accès au backend (générez une chaîne aléatoire)
BACKEND_API_KEY=votre_clé_backend_secrète_ici

# Origines autorisées pour CORS (séparez par des virgules)
ALLOWED_ORIGINS=http://localhost:3000,https://votre-site.github.io

# Port du serveur (3000 par défaut)
PORT=3000
```

**💡 Générer une clé secrète :** Utilisez cette commande Node.js :
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 4. Tester en local

```bash
npm start
```

Le serveur démarre sur `http://localhost:3000`. Testez l'endpoint health :

```bash
curl http://localhost:3000/health
```

Vous devriez recevoir : `{"status":"ok","timestamp":"..."}`

### 5. Tester l'endpoint chat

```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -H "X-API-Key: votre_clé_backend_secrète_ici" \
  -d '{"userId":"test123","message":"Qui est Julien ?"}'
```

## ☁️ Déploiement sur Render

### 1. Créer un compte Render

Allez sur https://render.com/ et créez un compte gratuit (avec GitHub ou email).

### 2. Créer un nouveau Web Service

1. Connectez votre repo GitHub à Render
2. Cliquez sur **New** → **Web Service**
3. Sélectionnez votre dépôt `projet_MIA_dialogue`
4. Configurez le service :

   - **Name** : `mia-backend` (ou votre choix)
   - **Region** : `Frankfurt (EU Central)` (ou le plus proche de vous)
   - **Branch** : `main`
   - **Root Directory** : `mia-backend`
   - **Runtime** : `Node`
   - **Build Command** : `npm install`
   - **Start Command** : `npm start`
   - **Plan** : `Free` (0$/mois, suffisant pour démarrer)

### 3. Ajouter les variables d'environnement

Dans l'onglet **Environment** du service Render, ajoutez :

| Key | Value |
|-----|-------|
| `GEMINI_API_KEY` | Votre clé API Gemini |
| `BACKEND_API_KEY` | Votre clé secrète backend |
| `ALLOWED_ORIGINS` | `https://desaintangel.github.io` (votre site GitHub Pages) |
| `PORT` | `3000` |
| `NODE_ENV` | `production` |

### 4. Déployer

Cliquez sur **Create Web Service**. Render va :
- Cloner votre repo
- Installer les dépendances
- Lancer le serveur

⏳ Le déploiement prend 2-5 minutes. Une fois terminé, vous aurez une URL type :
```
https://mia-backend-xxxx.onrender.com
```

### 5. Tester le déploiement

Testez l'endpoint health :
```bash
curl https://mia-backend-xxxx.onrender.com/health
```

Testez l'endpoint chat :
```bash
curl -X POST https://mia-backend-xxxx.onrender.com/api/chat \
  -H "Content-Type: application/json" \
  -H "X-API-Key: votre_clé_backend_secrète_ici" \
  -d '{"userId":"test123","message":"Qui est Julien ?"}'
```

## 🔄 Mises à jour

Render redéploie automatiquement à chaque push sur la branche `main`. Pour forcer un redéploiement manuel :
- Allez dans le dashboard Render
- Cliquez sur **Manual Deploy** → **Deploy latest commit**

## 📊 Surveiller les logs

Dans le dashboard Render, onglet **Logs**, vous verrez en temps réel :
- Les requêtes reçues
- Les erreurs éventuelles
- Les appels Gemini et quotas

## 🔐 Sécurité

- ✅ **API Key obligatoire** : Toutes les routes sont protégées par `X-API-Key`
- ✅ **CORS configuré** : Seules les origines autorisées peuvent appeler l'API
- ✅ **Pas de données sensibles** : Les quotas sont en mémoire, rien n'est stocké
- ⚠️ **HTTPS uniquement** : En production, utilisez toujours HTTPS (Render le fournit gratuitement)

**Important :** Ne commitez JAMAIS le fichier `.env` sur GitHub ! Il est déjà dans `.gitignore`.

## 🐛 Dépannage

### Erreur "GEMINI_API_KEY non définie"
- Vérifiez que la variable est bien définie dans Render (onglet Environment)
- Redéployez après l'ajout de variables

### Erreur CORS
- Ajoutez l'origine de votre site frontend dans `ALLOWED_ORIGINS`
- Format : `https://votre-site.github.io` (sans slash final)
- Séparez plusieurs origines par des virgules

### Erreur 401 Unauthorized
- Vérifiez que `X-API-Key` dans le frontend correspond à `BACKEND_API_KEY` du backend

### Fichier rag_index.json manquant
- Exécutez `python scripts/export_rag_to_json.py` avant de déployer
- Commitez le fichier `mia-backend/rag_index.json` sur GitHub

### Plan gratuit Render en veille
- Le plan gratuit se met en veille après 15 min d'inactivité
- La première requête après la veille prend ~30 secondes (cold start)
- Solution : passer au plan payant (~7$/mois) ou accepter les délais

## 💰 Coûts

- **Render** : 0$/mois (plan gratuit, 750h/mois)
- **Gemini 2.0 Flash** : ~0,0025$ par requête (2500 tokens)
- **Budget de 1€/mois** : ~400 requêtes/mois

## 📞 Support

Pour toute question :
1. Consultez les logs Render
2. Vérifiez la configuration des variables d'environnement
3. Testez en local d'abord avec `npm start`

---

🎉 **Backend prêt !** Prochaine étape : intégrer le widget frontend (voir `mia-frontend/README.md`)


