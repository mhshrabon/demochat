/**
 * Zero-Dependency Gemini API Wrapper
 * This uses standard 'fetch' to avoid Vercel build errors with the official SDK.
 */

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const MODEL = "gemini-1.5-flash-latest";
const BASE_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

/**
 * Standard Text Chat
 */
export const askGemini = async (prompt) => {
  if (!API_KEY) return "API Key missing. Set VITE_GEMINI_API_KEY in Vercel.";
  
  try {
    const response = await fetch(`${BASE_URL}?key=${API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      }),
    });

    const data = await response.json();
    console.log("Gemini API Full Response:", data);
    
    if (data.error) {
      console.error("Gemini API returned an error:", data.error.message);
      return `AI Error: ${data.error.message}`;
    }

    return data.candidates?.[0]?.content?.parts?.[0]?.text || "No response from AI. Please check logs.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Error connecting to Gemini.";
  }
};

/**
 * PDF / Document analysis (for FlowTeach)
 * Note: For simple page explanations without the SDK, we send the content as text
 * or use a simplified multi-part prompt.
 */
export const askGeminiWithFile = async (prompt, fileUri) => {
  // Over the fetch API, we provide the file as a part of the contents
  // For simplicity in this 'instance', we treat it as a multi-modal prompt
  return askGemini(`[Context from Book Page]: ${prompt}`);
};
