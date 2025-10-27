// Fonction globale pour ouvrir la fenêtre Mia depuis le menu
window.openMiaChat = function() {
  // On cherche l'instance MiaChat existante
  if (window.miaChatInstance && typeof window.miaChatInstance.toggleChat === 'function') {
    // Si déjà ouvert, ne rien faire, sinon ouvrir
    if (!window.miaChatInstance.isOpen) {
      window.miaChatInstance.toggleChat();
    }
  } else {
    // Sinon, créer une nouvelle instance et ouvrir
    window.miaChatInstance = new MiaChat();
    window.miaChatInstance.toggleChat();
  }
}
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
    
    this.init();
    this.checkQuota();

    // Reset quota à zéro côté backend à chaque fermeture/rechargement de la page
    window.addEventListener('beforeunload', async () => {
      try {
        await fetch(`${BACKEND_URL}/api/chat/reset`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': BACKEND_API_KEY
          },
          body: JSON.stringify({ userId: this.userId })
        });
      } catch (e) {}
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
      // Réinitialise la validation et le quota à chaque ouverture du chat
      localStorage.removeItem('mia_quota');
      localStorage.removeItem('mia_validated');
      sessionStorage.removeItem('mia_quota');
      sessionStorage.removeItem('mia_validated');
      this.quota = 0;
      this.updateQuotaDisplay();
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
    if (this.quota === 0) {
      quotaEl.style.display = 'none';
    } else {
      quotaEl.style.display = '';
      quotaEl.textContent = `${this.quota} question${this.quota > 1 ? 's' : ''}`;
    }

    const adSection = document.getElementById('mia-ad-section');
    if (this.quota === 0) {
      adSection.style.display = 'block';
    } else {
      adSection.style.display = 'none';
    }
  }
  
  async startAd() {
    try {
      const adBtn = document.getElementById('mia-watch-ad-btn');
      adBtn.disabled = true;
      adBtn.textContent = 'Chargement...';

      const response = await fetch(`${BACKEND_URL}/api/ad/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': BACKEND_API_KEY
        },
        body: JSON.stringify({ userId: this.userId })
      });

      const data = await response.json();

      if (data.success) {
        this.currentAdId = data.adId;
        this.showAdModal(data.duration, data.credits);
      } else {
        this.addMessage('system', '❌ ' + (data.error || 'Erreur'));
        adBtn.disabled = false;
        adBtn.textContent = 'Valider que je ne suis pas un robot';
      }

    } catch (error) {
      console.error('Erreur startAd:', error);
      const adBtn = document.getElementById('mia-watch-ad-btn');
      adBtn.disabled = false;
      adBtn.textContent = 'Valider que je ne suis pas un robot';
    }
  }
  
  showAdModal(duration, credits) {
    const modal = document.createElement('div');
    modal.id = 'mia-ad-modal';
    modal.innerHTML = `
      <div class="mia-ad-overlay"></div>
      <div class="mia-ad-content">
        <p style="margin:10px 0; text-align:center;">🔒 Validation en cours...</p>
        <div class="mia-ad-timer">
          <div class="mia-ad-progress"></div>
          <span id="mia-ad-countdown">2s</span>
        </div>
        <button id="mia-ad-close-btn" disabled style="margin-top:10px;">Veuillez patienter...</button>
        <p class="mia-ad-note" id="mia-ad-note">⏳ Veuillez patienter 2 secondes puis cliquez sur Fermer.</p>
      </div>
    `;
    document.body.appendChild(modal);

    let remaining = 2000;
    const countdown = document.getElementById('mia-ad-countdown');
    const progress = document.querySelector('.mia-ad-progress');
    const closeBtn = document.getElementById('mia-ad-close-btn');
    const note = document.getElementById('mia-ad-note');

    closeBtn.style.background = '#4caf50';
    closeBtn.style.color = '#fff';
    closeBtn.style.border = 'none';
    closeBtn.style.borderRadius = '8px';
    closeBtn.style.padding = '10px 32px';
    closeBtn.style.fontSize = '1.1em';
    closeBtn.style.fontWeight = 'bold';
    closeBtn.style.boxShadow = '0 2px 8px #0001';
    closeBtn.style.transition = 'opacity 0.2s, background 0.2s';
    
    closeBtn.disabled = true;
    closeBtn.textContent = 'Veuillez patienter...';

    this.adTimer = setInterval(() => {
      remaining -= 1000;
      countdown.textContent = Math.ceil(remaining / 1000) + 's';
      progress.style.width = ((2000 - remaining) / 2000 * 100) + '%';
      if (remaining <= 0) {
        clearInterval(this.adTimer);
        closeBtn.disabled = false;
        closeBtn.textContent = 'Fermer';
        countdown.textContent = '0s';
        if (note) note.style.display = 'none';
      }
    }, 1000);

    closeBtn.addEventListener('click', () => {
      this.completeAd();
    });
  }
  
  async completeAd() {
    try {
      const response = await fetch(`${BACKEND_URL}/api/ad/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': BACKEND_API_KEY
        },
        body: JSON.stringify({ 
          userId: this.userId,
          adId: this.currentAdId
        })
      });

      const data = await response.json();

      const modal = document.getElementById('mia-ad-modal');
      if (modal) modal.remove();

      if (data.success) {
        this.quota = data.totalQuota;
        this.updateQuotaDisplay();
      } else {
        this.addMessage('system', '❌ ' + (data.error || 'Erreur'));
      }

      const adBtn = document.getElementById('mia-watch-ad-btn');
      adBtn.disabled = false;
      adBtn.textContent = 'Valider que je ne suis pas un robot';

    } catch (error) {
      console.error('Erreur completeAd:', error);
      const modal = document.getElementById('mia-ad-modal');
      if (modal) modal.remove();
    }
  }
  
  async sendMessage() {
    const input = document.getElementById('mia-chat-input');
    const message = input.value.trim();
    
    if (!message || this.isLoading) return;
    
    if (this.quota === 0) {
      this.addMessage('system', '❌ Plus d\'interactions. Veuillez valider que vous n\'êtes pas un robot.');
      return;
    }
    // Ajout du message utilisateur à l'historique
    if (!this.messages) this.messages = [];
    this.messages.push({ role: 'user', text: message });
    // On limite à 10 messages (5 paires)
    if (this.messages.length > 10) this.messages = this.messages.slice(-10);
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
          message: message,
          history: this.messages.slice(-10) // 5 dernières paires (10 messages)
        })
      });
      
      const data = await response.json();
      
      document.getElementById(loaderId)?.remove();
      
      if (data.success) {
        await new Promise(res => setTimeout(res, 1000));
        this.addMessage('bot', data.response);
        // Ajout de la réponse de Mia à l'historique
        this.messages.push({ role: 'bot', text: data.response });
        if (this.messages.length > 10) this.messages = this.messages.slice(-10);
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
  window.miaChatInstance = new MiaChat();
});
