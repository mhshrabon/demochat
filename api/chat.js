import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  // We only accept POST requests for chatting
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { prompt, fileUri } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  // 1. Gather dynamically ALL keys that start with GEMINI_KEY_
  const envKeys = Object.keys(process.env)
    .filter(k => k.startsWith('GEMINI_KEY_'))
    .map(k => process.env[k]);

  // Add the old VITE key as a fallback, and filter out any empty arrays
  const keys = [...envKeys, process.env.VITE_GEMINI_API_KEY].filter(Boolean);

  if (keys.length === 0) {
    return res.status(500).json({ error: 'No API keys configured on Vercel.' });
  }

  // 2. Pick a random key exactly as we planned
  const randomKey = keys[Math.floor(Math.random() * keys.length)];

  // 3. Initialize Gemini securely on the server
  const genAI = new GoogleGenerativeAI(randomKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  try {
    let result;
    if (fileUri) {
      // FlowTeach Document Analysis
      result = await model.generateContent([
        { fileData: { mimeType: "application/pdf", fileUri: fileUri } },
        { text: prompt },
      ]);
    } else {
      // Standard Chat
      result = await model.generateContent(prompt);
    }
    
    const text = result.response.text();
    return res.status(200).json({ reply: text });

  } catch (error) {
    console.error("Serverless Gemini Error:", error);
    
    // If the random key hits a rate limit
    if (error.message.includes("429") || error.message.toLowerCase().includes("quota") || error.message.toLowerCase().includes("demand")) {
      return res.status(429).json({ error: '⚠️ The AI is experiencing a high volume of requests. Try again and a new key will be randomly selected!' });
    }
    
    return res.status(500).json({ error: `AI Error: ${error.message}` });
  }
}
