// Version ENGLISH of chat.js
const express = require('express');
const router = express.Router();

const groqService = require('../services_en/groqService');
const ragService = require('../services_en/rag/ragService');

// POST /api/chat-en
router.post('/', async (req, res) => {
  try {
    const { userId, message, history } = req.body;
    if (!message || message.trim().length === 0) {
      return res.status(400).json({
        error: 'Empty message',
        message: 'Please ask a question'
      });
    }
    // RAG context
    let ragPassages = '';
    let ragResults = [];
    try {
      ragResults = ragService.searchRelevantChunks({ text: message });
      if (Array.isArray(ragResults) && ragResults.length > 0) {
        ragPassages = ragResults.map((p, i) => `RAG Passage ${i+1}:\nSource: ${p.source}\n${p.text}`).join('\n\n');
      }
    } catch (e) {
      console.warn('Could not get RAG passages:', e.message);
    }
    // History context
    let formattedHistory = '';
    if (Array.isArray(history) && history.length > 0) {
      formattedHistory = history.map((msg, idx) => {
        const role = msg.type === 'user' ? 'User' : 'Mia';
        return `${role}: ${msg.text}`;
      }).join('\n');
    }
    // Build full context
    const context = [
      ragPassages ? '--- Relevant RAG Passages ---\n' + ragPassages : '',
      '--- Conversation History ---',
      formattedHistory
    ].join('\n\n');
    // Generate response with EN prompt
    const groqResult = await groqService.generateResponse(message, context);
    if (!groqResult || !groqResult.response) {
      return res.status(500).json({
        error: 'An error occurred, please try again...',
        message: 'Sorry, technical issue.'
      });
    }
    res.json({
      success: true,
      response: groqResult.response,
      userId: userId || null
    });
  } catch (error) {
    res.status(500).json({
      error: 'Server error',
      message: 'An unexpected error occurred.'
    });
  }
});

module.exports = router;
