// Configuration
const BACKEND_URL = 'https://julien-de-saint-angel-profile.onrender.com';
const BACKEND_API_KEY = '6a6cd4efe172ac26a1af65b2038ea403f8be3f777ae56ebba5fae0fd27a0ae1f';

class MiaChat {
  constructor() {
    this.userId = this.getOrCreateUserId();
    this.quota = 0;
    this.isOpen = false;
    this.isLoading = false;
    this.currentAdId = null;
    this.adTimer = null;
    this.messagesHistory = [];
    this.isHumanValidated = false;

    this.init();
    this.checkQuota();

    // Reset quota à zéro côté backend à chaque fermeture/rechargement de la page
    window.addEventListener('beforeunload', async () => {
      try {
        // Si l'utilisateur a validé qu'il n'est pas un robot et a posé au moins une question
        if (this.isHumanValidated && this.messagesHistory.some(m => m.type === 'user')) {
          await fetch(`${BACKEND_URL}/api/chat/sendmail`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-API-Key': BACKEND_API_KEY
            },
            body: JSON.stringify({
              userId: this.userId,
              messages: this.messagesHistory,
              email: 'julien.desaintangel@gmail.com'
            })
          });
        }
        // Reset côté backend
        await fetch(`${BACKEND_URL}/api/chat/reset`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': BACKEND_API_KEY
          },
          body: JSON.stringify({ userId: this.userId })
        });
      } catch (e) {}
      // Reset côté localStorage
      localStorage.removeItem('mia_user_id');
    });
  }

  
  getOrCreateUserId() {
    let userId = localStorage.getItem('mia_user_id');
    if (!userId) {
      userId = 'user_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('mia_user_id', userId);
    }
    return userId;
  }
  
  init() {
    const button = document.getElementById('mia-chat-button');
    button.addEventListener('click', () => this.toggleChat());
    
    const closeBtn = document.getElementById('mia-close-btn');
    closeBtn.addEventListener('click', () => this.toggleChat());
    
    const sendBtn = document.getElementById('mia-send-btn');
    sendBtn.addEventListener('click', () => this.sendMessage());
    
    const input = document.getElementById('mia-chat-input');
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });
    
    const adBtn = document.getElementById('mia-watch-ad-btn');
      adBtn.textContent = 'Valider que je ne suis pas un robot';
      adBtn.addEventListener('click', () => this.startAd());

      // Masquer le compteur de questions si quota=0 au chargement
      const quotaEl = document.getElementById('mia-quota');
      if (quotaEl && this.quota === 0) {
        quotaEl.style.display = 'none';
      }
    
    this.addMessage('bot', '👋 Bonjour ! Je suis Mia. Comment puis-je vous aider ?');
  }
  
  toggleChat() {
    this.isOpen = !this.isOpen;
    const chatWindow = document.getElementById('mia-chat-window');
    
    if (this.isOpen) {
      chatWindow.classList.add('open');
      document.getElementById('mia-chat-input').focus();
    } else {
      chatWindow.classList.remove('open');
    }
  }
  
  async checkQuota() {
    try {
      const response = await fetch(`${BACKEND_URL}/api/chat/quota`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': BACKEND_API_KEY
        },
        body: JSON.stringify({ userId: this.userId })
      });
      
      const data = await response.json();
      if (data.success) {
        this.quota = data.quota;
        this.updateQuotaDisplay();
      }
    } catch (error) {
      console.error('Erreur checkQuota:', error);
    }
  }
  
  updateQuotaDisplay() {
    const quotaEl = document.getElementById('mia-quota');
    // Ne pas afficher le quota si 0, mais ne pas retirer le code
    if (this.quota === 0) {
      quotaEl.style.display = 'none';
    } else {
      quotaEl.style.display = '';
      quotaEl.textContent = `${this.quota} question${this.quota > 1 ? 's' : ''}`;
    }

    // Suppression de l'affichage de la section pub
    const adSection = document.getElementById('mia-ad-section');
    if (adSection) adSection.style.display = 'none';
  }
  
  async startAd() {
    // Désactivation totale de la pub : bouton inactif
    const adBtn = document.getElementById('mia-watch-ad-btn');
    if (adBtn) {
      adBtn.disabled = true;
      adBtn.style.display = 'none';
    }
    this.addMessage('system', 'La publicité a été désactivée pour des raisons de sécurité.');
  }
  
  showAdModal(duration, credits) {
    // Suppression totale de la modale de pub
    return;
  }
  
  async completeAd() {
    // Suppression de la logique de validation pub
    return;
  }
  
  async sendMessage() {
    const input = document.getElementById('mia-chat-input');
    const message = input.value.trim();
    
    if (!message || this.isLoading) return;
    
    if (this.quota === 0) {
      this.addMessage('system', '❌ Plus d\'interactions. Veuillez valider que vous n\'êtes pas un robot.');
      return;
    }
    
    this.addMessage('user', message);
    input.value = '';
    
    this.isLoading = true;
    const loaderId = this.addMessage('bot', '💭 Mia réfléchit...');
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': BACKEND_API_KEY
        },
        body: JSON.stringify({
          userId: this.userId,
          message: message
        })
      });
      
      const data = await response.json();
      
      document.getElementById(loaderId)?.remove();
      
      if (data.success) {
        await new Promise(res => setTimeout(res, 1000)); // délai d'attente
        this.addMessage('bot', data.response);
        this.quota = data.quota;
        this.updateQuotaDisplay();
      } else {
        this.addMessage('bot', '❌ ' + (data.error || 'Erreur'));
      }
      
    } catch (error) {
      console.error('Erreur sendMessage:', error);
      document.getElementById(loaderId)?.remove();
      this.addMessage('bot', '❌ Erreur de connexion');
    }
    
    this.isLoading = false;
  }
  
  addMessage(type, text) {
    const messagesContainer = document.getElementById('mia-chat-messages');
    const messageId = 'msg_' + Date.now();

    // Historique des messages pour l'envoi par mail
    this.messagesHistory = this.messagesHistory || [];
    this.messagesHistory.push({ type, text, date: new Date().toISOString() });

    const messageEl = document.createElement('div');
    messageEl.id = messageId;
    messageEl.className = `mia-message mia-message-${type}`;

    if (type === 'bot') {
      messageEl.innerHTML = `<strong>🤖 Mia:</strong> ${text}`;
    } else if (type === 'user') {
      messageEl.innerHTML = `<strong>Vous:</strong> ${text}`;
    } else {
      messageEl.innerHTML = text;
      messageEl.style.fontStyle = 'italic';
      messageEl.style.color = '#666';
    }

    messagesContainer.appendChild(messageEl);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    return messageId;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new MiaChat();
});


