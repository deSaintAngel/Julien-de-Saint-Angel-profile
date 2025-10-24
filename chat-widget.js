// Configuration
const BACKEND_URL = 'http://localhost:3000';
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
  
