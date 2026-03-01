import express from 'express';
import { generateResponse } from '../services/groqService.js';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { message, subject = 'general', mode = 'chat', context = '' } = req.body;

    if (!message || message.trim() === '') {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Check for academic integrity violations
    const isCheatingAttempt = checkForCheatingAttempt(message);
    if (isCheatingAttempt) {
      return res.json({
        message: `I understand you're looking for help. Instead of providing a direct answer, let me guide you:\n\n- What specific part are you struggling with?\n- What have you tried so far?\n- What concepts or methods might apply here?\n\nI'm here to help you learn and understand, not to do the work for you. Let's work through this step by step!`,
      });
    }

    const response = await generateResponse(message, {
      subject,
      mode,
      context,
    });

    res.json({ message: response });
  } catch (error) {
    console.error('Chat route error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

function checkForCheatingAttempt(message) {
  const cheatingKeywords = [
    'do my homework',
    'write my essay',
    'complete my assignment',
    'solve this for me without explanation',
    'give me the answer',
    'do this for me',
  ];

  const lowerMessage = message.toLowerCase();
  return cheatingKeywords.some(keyword => lowerMessage.includes(keyword));
}

export { router as chatRoutes };
