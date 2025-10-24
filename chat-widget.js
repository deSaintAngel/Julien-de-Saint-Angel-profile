// Configuration
const BACKEND_URL = 'http://127.0.0.1:3001';
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
        <div class="mia-ad-timer">
          <div class="mia-ad-progress"></div>
          <span id="mia-ad-countdown">${Math.ceil(duration / 1000)}s</span>
        </div>
        <p class="mia-ad-note">⏳ Veuillez patienter...</p>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    let remaining = duration;
    const countdown = document.getElementById('mia-ad-countdown');
    const progress = document.querySelector('.mia-ad-progress');
    
    this.adTimer = setInterval(() => {
      remaining -= 1000;
      countdown.textContent = Math.ceil(remaining / 1000) + 's';
      progress.style.width = ((duration - remaining) / duration * 100) + '%';
      
      if (remaining <= 0) {
        clearInterval(this.adTimer);
        this.completeAd();
      }
    }, 1000);
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


