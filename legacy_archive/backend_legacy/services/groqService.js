import Groq from 'groq-sdk';
import dotenv from 'dotenv';

dotenv.config();

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const DEFAULT_MODEL = 'llama-3.1-70b-versatile';

export async function generateResponse(prompt, options = {}) {
  try {
    const {
      subject = 'general',
      mode = 'chat',
      context = '',
      systemPrompt = getDefaultSystemPrompt(subject, mode),
    } = options;

    const messages = [
      {
        role: 'system',
        content: systemPrompt,
      },
      ...(context ? [{ role: 'user', content: `Context: ${context}` }] : []),
      {
        role: 'user',
        content: prompt,
      },
    ];

    const completion = await groq.chat.completions.create({
      messages,
      model: DEFAULT_MODEL,
      temperature: 0.7,
      max_tokens: 2048,
    });

    return completion.choices[0]?.message?.content || 'Sorry, I could not generate a response.';
  } catch (error) {
    console.error('Groq API Error:', error);
    throw new Error(`API Error: ${error.message}`);
  }
}

function getDefaultSystemPrompt(subject, mode) {
  const basePrompt = `You are PlugGPT, an academic AI assistant designed for high-school and university students, with emphasis on IB students.

Core Principles:
- Provide precise, structured explanations
- Use clear academic language without verbosity
- Always organize outputs with headings and structure
- Encourage learning rather than giving direct answers to cheating attempts
- Be helpful but maintain academic integrity

Respond in markdown format with proper headings, bullet points, and structured content.`;

  const subjectPrompts = {
    math: `You are helping with mathematics. Provide step-by-step solutions with clear explanations. Show your work and explain each step.`,
    sciences: `You are helping with sciences (Biology, Chemistry, Physics). Provide IB-style structured responses with clear explanations of concepts, processes, and applications.`,
    humanities: `You are helping with humanities subjects. Focus on argumentation, essay structure, and analytical frameworks.`,
    economics: `You are helping with economics. Provide chains of reasoning, diagram explanations, and evaluation paragraphs.`,
    cs: `You are helping with computer science. Provide code analysis, debugging assistance, and concept breakdowns with code examples when relevant.`,
    general: `You are providing general academic assistance across subjects.`,
  };

  const modePrompts = {
    explain: `Provide a comprehensive, structured explanation. Break down complex concepts into clear sections with headings. Use examples when helpful.`,
    breakdown: `Break down the content into: a bullet summary, key terms, main arguments, and a short quiz.`,
    math_solver: `Solve step-by-step with clear explanations. Show all work. Consider offering to hide the final answer initially to encourage student thinking.`,
    rewrite: `Rewrite the text while maintaining its meaning. Adjust formality level as requested.`,
    grammar: `Fix grammar and improve clarity while maintaining the original meaning and style.`,
    essay_builder: `Help build an essay by creating thesis statements, outlines, hooks, conclusions, or paragraph frameworks (PEEL, CER, etc.).`,
    ia_helper: `Provide IB Internal Assessment guidance: topic selection, research questions, outline structures, and evaluation frameworks.`,
    tok_helper: `Provide TOK (Theory of Knowledge) assistance: RLS (Real Life Situations) generation, knowledge questions, essay skeletons, and exhibition guidance.`,
    cas_helper: `Provide CAS (Creativity, Activity, Service) assistance: project ideas, reflection templates, and weekly log structures.`,
    ee_helper: `Provide Extended Essay assistance: topic refinement, planning, and chapter outlines.`,
    chat: `Engage in academic conversation, answer questions, and provide guidance.`,
  };

  const subjectPrompt = subjectPrompts[subject] || subjectPrompts.general;
  const modePrompt = modePrompts[mode] || modePrompts.chat;

  return `${basePrompt}\n\n${subjectPrompt}\n\n${modePrompt}`;
}
