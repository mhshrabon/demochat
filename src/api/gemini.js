import { GoogleGenerativeAI } from "@google/generative-ai";

// Accessing the API key from Vercel/Vite environment variables
// IMPORTANT: For Vite apps, the variable must be named VITE_GEMINI_API_KEY in Vercel
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

if (!API_KEY) {
  console.error("Gemini API Key is missing! Please set VITE_GEMINI_API_KEY in your .env or Vercel dashboard.");
}

const genAI = new GoogleGenerativeAI(API_KEY);

/**
 * Sends a message to Gemini and returns the response.
 * @param {string} prompt - The user's question or command.
 * @returns {Promise<string>} - The AI's response text.
 */
export const askGemini = async (prompt) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    return "Sorry, I couldn't process that request right now.";
  }
};

/**
 * Handles PDF/Document processing (for FlowTeach page specific requests)
 * @param {string} prompt - The question about the document.
 * @param {string} fileUri - The URI of the uploaded file in Gemini File API.
 */
export const askGeminiWithFile = async (prompt, fileUri) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent([
      {
        fileData: {
          mimeType: "application/pdf",
          fileUri: fileUri
        }
      },
      { text: prompt },
    ]);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error calling Gemini with file:", error);
    return "Error analyzing the book.";
  }
};
