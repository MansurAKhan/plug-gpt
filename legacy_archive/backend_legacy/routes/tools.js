import express from 'express';
import { generateResponse } from '../services/groqService.js';

const router = express.Router();

router.post('/explain', async (req, res) => {
  try {
    const { topic, subject = 'general', level = 'high-school' } = req.body;
    const prompt = `Explain the topic "${topic}" at ${level} level. Provide a structured explanation with clear headings.`;
    
    const response = await generateResponse(prompt, {
      subject,
      mode: 'explain',
    });

    res.json({ result: response });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/breakdown', async (req, res) => {
  try {
    const { content, subject = 'general' } = req.body;
    const prompt = `Break down the following content:\n\n${content}\n\nProvide: bullet summary, key terms, main arguments, and a short quiz.`;
    
    const response = await generateResponse(prompt, {
      subject,
      mode: 'breakdown',
    });

    res.json({ result: response });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/math-solve', async (req, res) => {
  try {
    const { problem, hideAnswer = false } = req.body;
    const prompt = `Solve this math problem step-by-step: ${problem}\n\nShow all work clearly.${hideAnswer ? ' Do not reveal the final answer until the student requests it.' : ''}`;
    
    const response = await generateResponse(prompt, {
      subject: 'math',
      mode: 'math_solver',
    });

    res.json({ result: response });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/rewrite', async (req, res) => {
  try {
    const { text, style = 'neutral' } = req.body;
    const prompt = `Rewrite the following text in a ${style} style while maintaining its meaning:\n\n${text}`;
    
    const response = await generateResponse(prompt, {
      mode: 'rewrite',
    });

    res.json({ result: response });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/grammar-fix', async (req, res) => {
  try {
    const { text } = req.body;
    const prompt = `Fix grammar and improve clarity of this text while maintaining the original meaning:\n\n${text}`;
    
    const response = await generateResponse(prompt, {
      mode: 'grammar',
    });

    res.json({ result: response });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/essay-builder', async (req, res) => {
  try {
    const { type, topic, subject } = req.body;
    const prompt = `Help me build an essay ${type} for the topic: "${topic}". Subject: ${subject || 'general'}.`;
    
    const response = await generateResponse(prompt, {
      subject: subject || 'general',
      mode: 'essay_builder',
    });

    res.json({ result: response });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/ib-tool', async (req, res) => {
  try {
    const { tool, topic, subject } = req.body;
    // tool can be: ia, tok, cas, ee
    
    const promptMap = {
      ia: `Help me with my IB Internal Assessment on "${topic}" in ${subject}. Provide topic refinement, research question ideas, outline structure, and evaluation frameworks.`,
      tok: `Help me with my TOK ${topic || 'essay/exhibition'}. Provide RLS ideas, knowledge questions, essay structure, or exhibition guidance as needed.`,
      cas: `Help me with CAS. ${topic ? `Focus on: ${topic}` : 'Provide project ideas, reflection templates, and weekly log structures.'}`,
      ee: `Help me with my Extended Essay on "${topic}" in ${subject}. Provide topic refinement, planning advice, and chapter outlines.`,
    };

    const prompt = promptMap[tool] || promptMap.ia;
    
    const response = await generateResponse(prompt, {
      subject: subject || 'general',
      mode: `${tool}_helper`,
    });

    res.json({ result: response });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export { router as toolRoutes };
