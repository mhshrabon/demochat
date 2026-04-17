import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
// Using the official SDK handles all endpoint translation flawlessly
const genAI = new GoogleGenerativeAI(API_KEY || "dummy_key");

export const askGemini = async (prompt) => {
  if (!API_KEY) return "API Key missing. Set VITE_GEMINI_API_KEY in Vercel.";
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error("Gemini Error:", error);
    return `AI Error: ${error.message}`;
  }
};

export const askGeminiWithFile = async (prompt, fileUri) => {
  if (!API_KEY) return "API Key missing.";
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent([
      { fileData: { mimeType: "application/pdf", fileUri: fileUri } },
      { text: prompt },
    ]);
    return result.response.text();
  } catch (error) {
    console.error("Gemini Error:", error);
    return `AI Error: ${error.message}`;
  }
};
