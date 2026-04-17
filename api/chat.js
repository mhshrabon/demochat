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

  // 2. Shuffle keys randomly to distribute load
  const shuffledKeys = keys.sort(() => 0.5 - Math.random());

  // Vercel Free Tier limits functions to exactly 10 seconds.
  // We can only try a maximum of 3 keys per request before Vercel forcefully kills the server.
  const maxTries = Math.min(3, shuffledKeys.length);
  const keysToTry = shuffledKeys.slice(0, maxTries);

  // 3. Try each key until one works
  // Restricted to 2.5 and 3.0 models as requested based on regional availability
  const fallbackModels = ["gemini-3.1-pro", "gemini-3.0-flash", "gemini-2.5-pro", "gemini-2.5-flash"];

  for (const key of keysToTry) {
    const genAI = new GoogleGenerativeAI(key);

    for (const modelName of fallbackModels) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });

        let result;
        if (fileUri) {
          result = await model.generateContent([
            { fileData: { mimeType: "application/pdf", fileUri: fileUri } },
            { text: prompt },
          ]);
        } else {
          result = await model.generateContent(prompt);
        }

        const text = result.response.text();
        return res.status(200).json({ reply: text });

      } catch (error) {
        console.error(`Model ${modelName} failed:`, error.message);

        // "not found" means the API key doesn't have access to this specific model (like 2.5). Try the next model!
        if (error.message.includes("not found") || error.message.includes("v1beta")) {
          continue;
        }

        // If it's a rate limit / quota error, try the next model/key
        if (error.message.includes("429") || error.message.toLowerCase().includes("quota") || error.message.toLowerCase().includes("demand")) {
          continue;
        }

        // Skip to the next key for any other unknown errors
        break;
      }
    }
  }

  // If the code reaches here, ALL keys and models have been tried and ALL of them failed.
  return res.status(429).json({ error: '⚠️ All API keys and models are currently at maximum capacity. Please wait 30 seconds!' });
}
