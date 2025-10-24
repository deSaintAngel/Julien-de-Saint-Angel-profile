# 🚀 PROJET MIA - CHATBOT AVEC SYSTÈME PUB/CRÉDIT

## ✅ ÉTAT ACTUEL DU PROJET

### Backend (mia-backend) - PRÊT ✅
- ✅ Routes `/api/chat` (envoyer message)
- ✅ Routes `/api/chat/quota` (consulter quota)
- ✅ Routes `/api/ad/start` (démarrer pub)
- ✅ Routes `/api/ad/complete` (valider pub)
- ✅ Services RAG + Gemini + Quota + Ad
- ✅ 21 chunks exportés (299 KB)
- ✅ Configuration `.env` complète

### Frontend (mia-frontend) - PRÊT ✅
- ✅ Widget chat complet (`chat-widget.js`)
- ✅ Styles avec modal pub (`chat-widget.css`)
- ✅ Page de test locale (`test-local.html`)
- ✅ Guide d'intégration (`widget-integration.html`)

---

## 🧪 TESTS EN LOCAL

### 1️⃣ Démarrer le backend

```bash
cd mia-backend
npm start
```

**Résultat attendu :**
```
🚀 Mia Backend démarré !
📡 Serveur écoute sur le port 3000
✅ Backend prêt à recevoir des requêtes
```

### 2️⃣ Ouvrir la page de test

1. Ouvrir `mia-frontend/test-local.html` dans un navigateur
2. Cliquer sur le bouton chat 💬 en bas à droite
3. Suivre les tests indiqués sur la page

### 3️⃣ Scénario de test complet

**A) Test du système de publicité :**
1. Ouvrir le chat → Quota = 0 questions
2. Bouton pub visible : "📺 Regarder une pub (+20 questions)"
3. Cliquer sur le bouton
4. Modal de pub s'ouvre avec timer 30s
5. Attendre la fin du timer
6. Modal se ferme
7. Message système : "✅ +20 interactions débloquées ! Total: 20"
8. Quota mis à jour : "20 questions"
9. Bouton pub disparaît

**B) Test du chat :**
1. Poser une question : "Qui est Julien ?"
2. Loader : "💭 Mia réfléchit..."
3. Réponse avec contexte RAG
4. Quota décrémenté : "19 questions"
5. Envoyer plusieurs messages pour tester le décompte

**C) Test épuisement quota :**
1. Envoyer 20 messages
2. Quota = 0
3. Bouton pub réapparaît
4. Essayer d'envoyer un message → Erreur : "Plus d'interactions"

---

## 📦 DÉPLOIEMENT EN PRODUCTION

### Étape 1 : Déployer le backend sur Render

1. **Créer un compte sur Render.com**

2. **Créer un nouveau Web Service**
   - Repository : Créer un repo Git pour `mia-backend/`
   - Build Command : `npm install`
   - Start Command : `npm start`

3. **Configurer les variables d'environnement**
   ```
   GEMINI_API_KEY=AIzaSyAYhQHboDOkvo2zwDkAZC5qIXYcxKtDVKo
   BACKEND_API_KEY=6a6cd4e5f3b8a72d9e1c4f8b2a7d3e9f1c5a8b4d7e2f9a6c3b8d1e5f7a0ae1f
   JWT_SECRET=41834c5f2b9e7a3d6c1f4b8e5a2d7f9c3b6a1e4d8f2c5a9b7e3d6f1a4c8b2e5d
   ADSENSE_CLIENT_ID=ca-pub-5215342224838884
   PORT=3000
   NODE_ENV=production
   ALLOWED_ORIGINS=https://desaintangel.github.io,http://localhost:8080
   ```

4. **Déployer**
   - Render déploie automatiquement
   - Noter l'URL générée : `https://mia-backend-xxx.onrender.com`

### Étape 2 : Intégrer le widget sur GitHub Pages

1. **Modifier `chat-widget.js`**
   ```javascript
   const BACKEND_URL = 'https://mia-backend-xxx.onrender.com'; // URL Render
   ```

2. **Copier les fichiers dans votre repo GitHub**
   ```
   Julien-de-Saint-Angel-profile/
   ├── chat-widget.css         ← COPIER
   ├── chat-widget.js          ← COPIER (modifié)
   └── index.html              ← MODIFIER
   ```

3. **Modifier `index.html`**
   - Ajouter dans `<head>` :
     ```html
     <link rel="stylesheet" href="chat-widget.css">
     ```
   
   - Ajouter avant `</body>` :
     ```html
     <!-- Widget Chat Mia -->
     <div id="mia-chat-button" class="mia-chat-button">
       <span style="font-size: 30px;">💬</span>
     </div>

     <div id="mia-chat-window" class="mia-chat-window">
       <div class="mia-chat-header">
         <div>
           <strong>🤖 Mia</strong>
           <div style="font-size: 0.75rem; opacity: 0.8;">Assistante IA de Julien</div>
         </div>
         <div>
           <span id="mia-quota" style="font-size: 0.8rem; margin-right: 10px;">0 questions</span>
           <button id="mia-close-btn" class="mia-close-btn">✕</button>
         </div>
       </div>
       
       <div id="mia-chat-messages" class="mia-chat-messages"></div>
       
       <div id="mia-ad-section">
         <button id="mia-watch-ad-btn">
           📺 Regarder une pub (+20 questions)
         </button>
       </div>
       
       <div class="mia-chat-footer">
         <input 
           type="text" 
           id="mia-chat-input" 
           class="mia-chat-input" 
           placeholder="Posez votre question..."
         >
         <button id="mia-send-btn" class="mia-send-btn">➤</button>
       </div>
     </div>

     <script src="chat-widget.js"></script>
     ```

4. **Commit et push**
   ```bash
   git add .
   git commit -m "Ajout widget chat Mia avec système pub/crédit"
   git push origin main
   ```

5. **Tester en ligne**
   - Ouvrir https://desaintangel.github.io/Julien-de-Saint-Angel-profile/
   - Tester toutes les fonctionnalités

---

## 🔧 CONFIGURATION

### Backend (`.env`)
```env
GEMINI_API_KEY=AIzaSyAYhQHboDOkvo2zwDkAZC5qIXYcxKtDVKo
BACKEND_API_KEY=6a6cd4e5f3b8a72d9e1c4f8b2a7d3e9f1c5a8b4d7e2f9a6c3b8d1e5f7a0ae1f
JWT_SECRET=41834c5f2b9e7a3d6c1f4b8e5a2d7f9c3b6a1e4d8f2c5a9b7e3d6f1a4c8b2e5d
ADSENSE_CLIENT_ID=ca-pub-5215342224838884
PORT=3000
NODE_ENV=development
ALLOWED_ORIGINS=https://desaintangel.github.io,http://localhost:8080
```

### Frontend (chat-widget.js)
```javascript
const BACKEND_URL = 'http://localhost:3000'; // Local
// const BACKEND_URL = 'https://mia-backend-xxx.onrender.com'; // Production
const BACKEND_API_KEY = '6a6cd4e5f3b8a72d9e1c4f8b2a7d3e9f1c5a8b4d7e2f9a6c3b8d1e5f7a0ae1f';
```

### Paramètres système
- **Durée pub** : 30 secondes (`adService.js`)
- **Crédits par pub** : 20 interactions (`adService.js`)
- **Quota initial** : 0 (`quotaService.js`)
- **Stockage quota** : En mémoire (se réinitialise au redémarrage serveur)

---

## 📊 ARCHITECTURE

```
┌─────────────────────────────────────────┐
│  UTILISATEUR                            │
│  https://desaintangel.github.io/...    │
└──────────────┬──────────────────────────┘
               │
               │ 1. Clique sur 💬
               │
               ▼
┌─────────────────────────────────────────┐
│  FRONTEND (GitHub Pages)                │
│  - chat-widget.js                       │
│  - Affichage quota                      │
│  - Modal pub (30s)                      │
└──────────────┬──────────────────────────┘
               │
               │ 2. fetch() API
               │
               ▼
┌─────────────────────────────────────────┐
│  BACKEND (Render)                       │
│  - Vérifie quota                        │
│  - Recherche RAG (21 chunks)           │
│  - Appelle Gemini API                  │
│  - Retourne réponse + quota            │
└──────────────┬──────────────────────────┘
               │
               │ 3. Gemini API
               │
               ▼
┌─────────────────────────────────────────┐
│  GEMINI 2.0 FLASH EXPERIMENTAL          │
│  - Génère réponse avec contexte RAG    │
│  - GRATUIT: 1,500 req/jour             │
└─────────────────────────────────────────┘
```

---

## 📈 COÛTS

### Gemini API (gratuit tier)
- **1,500 requêtes/jour** = 45,000/mois
- **Coût si dépassement** : ~$0.0002/requête
- **Budget 1€/mois** : ~4,390 requêtes supplémentaires

### Render (backend)
- **Plan gratuit** : 750h/mois
- **Sommeil auto** : Après 15min d'inactivité
- **Réveil** : ~30s au premier appel

### GitHub Pages (frontend)
- **Gratuit** : Bande passante illimitée
- **Domaine** : .github.io gratuit

---

## 🐛 DÉPANNAGE

### Backend ne démarre pas
```bash
cd mia-backend
npm install
npm start
```

### Erreur CORS
- Vérifier `ALLOWED_ORIGINS` dans `.env`
- Ajouter l'origine du frontend

### Quota ne se met pas à jour
- Vider le localStorage du navigateur
- Redémarrer le backend (quota en mémoire)

### Pub ne crédite pas
- Ouvrir la console (F12)
- Vérifier les logs réseau
- Vérifier que l'adId est bien envoyé

---

## 📞 SUPPORT

**Développeur** : Julien De Saint Angel  
**Email** : [votre email]  
**GitHub** : https://github.com/deSaintAngel

---

## 📝 LICENCE

MIT License - Utilisez et modifiez librement ce code.


