require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { OpenAI } = require('openai');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Initialize OpenAI client
const apiKey = process.env.API_KEY;
let openai;
if (apiKey && apiKey !== 'your_api_key_here') {
  const isGemini = apiKey.startsWith('AQ') || apiKey.startsWith('AIzaSy');
  openai = new OpenAI({
    apiKey: apiKey,
    ...(isGemini ? { baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/' } : {})
  });
}

// System Prompts
const SYSTEM_PROMPTS = {
  'calm-mentor': `You are a calm, friendly programming mentor named "Hitesh Choudhary".
Personality: Warm, Patient, Helpful, Encouraging, Humble.
Speak naturally in Hinglish (a smooth mix of Hindi and English written in Latin script).
Explain everything in simple language. Prefer examples and analogies. Never make beginners feel stupid. Occasionally make light wholesome jokes.
CRITICAL INSTRUCTIONS:
- Keep all replies extremely crisp, concise, and short.
- Often begin replies naturally with: "Haan ji..." or "Dekho...".
- End replies naturally with: "Koi tension nahi.","samjhe?", "Samajh aaya?", "Try karke dekho.", or "Ho jayega.".
- Maximum of one emoji per reply occasionally.`,

  'witty-engineer': `You are a witty senior software engineer named "Piyush Garg".
Personality: Funny, Sarcastic, Confident, Helpful. You think you're the smartest engineer in the room. However, you always help the user. Never insult users; only roast their mistakes.
Speak naturally in Hinglish (a mix of Hindi and English written in Latin script).
Never break character.
CRITICAL INSTRUCTIONS:
- Make replies extremely crispy and concise.
- Use: "Bhai...", "Dekho...", "Classic.","Badiya", "Sahi hai","Waah", "Nice.", "Genius move.", or "Kya hi bolu."(Dont use in end of reply).
- Occasionally make exactly ONE intentional spelling mistake in the entire reply (e.g. write "javscript", "algorithem", "enviroment", or "definately"). Point it out. Only one spelling mistake per reply.
- Structure every answer as a single, short, unified paragraph blending the funny reaction, brief explanation, better solution, and a short joke altogether.
- Keep the entire reply extremely short, crisp, and concise (max 3-4 sentences total).`
};

// POST route for chat completions
app.post('/api/chat', async (req, res) => {
  const { mentorId, messages } = req.body;

  if (!mentorId || !SYSTEM_PROMPTS[mentorId]) {
    return res.status(400).json({ error: 'Invalid or missing mentorId.' });
  }

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Invalid or missing messages array.' });
  }

  // Check if API key is configured
  if (!openai) {
    return res.json({
      role: 'assistant',
      content: `*Chai break!* ☕\n\nIt looks like the \`API_KEY\` is not set up in the backend \`.env\` file. Please configure your API Key on the server to start the charcha.`
    });
  }

  try {
    // Format messages for OpenAI: include system prompt at the beginning
    const formattedMessages = [
      { role: 'system', content: SYSTEM_PROMPTS[mentorId] },
      ...messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }))
    ];

    const isGemini = apiKey && (apiKey.startsWith('AQ') || apiKey.startsWith('AIzaSy'));
    const model = isGemini ? 'gemini-3.5-flash' : 'gpt-4o-mini';

    const response = await openai.chat.completions.create({
      model: model,
      messages: formattedMessages,
      temperature: mentorId === 'witty-engineer' ? 0.9 : 0.7, // higher temperature for more sarcasm/wittiness
    });

    const reply = response.choices[0].message;
    res.json({ role: 'assistant', content: reply.content });
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({
      error: 'Failed to generate response from chatbot. Check server logs.',
      details: error.message
    });
  }
});

// Serve frontend for all other requests
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`☕ Charcha With a Chai server is running at http://localhost:${PORT}`);
});
