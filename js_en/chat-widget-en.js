// ENGLISH version of chat-widget.js (minimal demo)
class MiaChatEN {
  constructor() {
    this.userId = 'user_' + Math.random().toString(36).substr(2, 9);
    this.isOpen = false;
    this.isLoading = false;
    this.messages = [];
    // Add welcome message in English
    window.addEventListener('DOMContentLoaded', () => {
      const messagesContainer = document.getElementById('mia-chat-messages-en');
      if (messagesContainer && messagesContainer.children.length === 0) {
        this.addMessage('bot', "👋 Hello! I'm Mia. How can I help you?");
      }
    });
  }
  async sendMessage() {
    const input = document.getElementById('mia-chat-input-en');
    const message = input.value.trim();
    if (!message || this.isLoading) return;
    this.messages.push({ type: 'user', text: message });
    this.addMessage('user', message);
    input.value = '';
    this.isLoading = true;
    const loaderId = this.addMessage('bot', '💭 Mia is thinking...');
    try {
      const response = await fetch('/api/chat-en', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: this.userId,
          message: message,
          history: this.messages.slice(-10)
        })
      });
      const data = await response.json();
      document.getElementById(loaderId)?.remove();
      if (data.success) {
        this.addMessage('bot', data.response);
        this.messages.push({ type: 'bot', text: data.response });
      } else {
        this.addMessage('bot', '❌ ' + (data.error || 'Error'));
      }
    } catch (error) {
      document.getElementById(loaderId)?.remove();
      this.addMessage('bot', '❌ Connection error');
    }
    this.isLoading = false;
  }
  addMessage(type, text) {
    const messagesContainer = document.getElementById('mia-chat-messages-en');
    const messageId = 'msg_' + Date.now();
    const messageEl = document.createElement('div');
    messageEl.id = messageId;
    messageEl.className = `mia-message mia-message-${type}`;
    if (type === 'bot') {
      messageEl.innerHTML = `<strong>🤖 Mia:</strong> ${text}`;
    } else if (type === 'user') {
      messageEl.innerHTML = `<strong>You:</strong> ${text}`;
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
window.miaChatInstanceEN = new MiaChatEN();
