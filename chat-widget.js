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
    adBtn.addEventListener('click', () => this.startAd());
    
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
    quotaEl.textContent = `${this.quota} question${this.quota > 1 ? 's' : ''}`;
    
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
  adBtn.textContent = '📺 Regarder une pub (+50 questions)';
      }
      
    } catch (error) {
      console.error('Erreur startAd:', error);
      const adBtn = document.getElementById('mia-watch-ad-btn');
      adBtn.disabled = false;
  adBtn.textContent = '📺 Regarder une pub (+50 questions)';
    }
  }
  
  showAdModal(duration, credits) {
    const modal = document.createElement('div');
    modal.id = 'mia-ad-modal';
    modal.innerHTML = `
      <div class="mia-ad-overlay"></div>
      <div class="mia-ad-content">
        <h3>📺 Publicité</h3>
        <p>Regardez pour débloquer <strong>+${credits} interactions</strong></p>
        <!-- Script Adsterra Social Bar -->
        <script type='text/javascript' src='//pl27920867.effectivegatecpm.com/51/2f/16/512f163770f940d9d0d467c5be6d2245.js'></script>
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
        this.addMessage('system', `✅ ${data.message}`);
      } else {
        this.addMessage('system', '❌ ' + (data.error || 'Erreur'));
      }
      
      const adBtn = document.getElementById('mia-watch-ad-btn');
      adBtn.disabled = false;
      adBtn.textContent = '📺 Regarder une pub (+20 questions)';
      
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
      this.addMessage('system', '❌ Plus d\'interactions. Regardez une publicité.');
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


