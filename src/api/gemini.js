/**
 * Secure Frontend Gemini client.
 * This now forwards all requests to your Vercel backend (`/api/chat.js`)
 * so your API keys are never exposed in the browser.
 */

export const askGemini = async (prompt) => {
  try {
    const response = await fetch('/api/chat', {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    });

    const data = await response.json();

    if (data.error) {
      return data.error; // Returns the rate-limit or error message from the backend
    }

    return data.reply || "No response from AI.";
  } catch (error) {
    console.error("Frontend HTTP Error:", error);
    return "Error communicating with the secure backend.";
  }
};

export const askGeminiWithFile = async (prompt, fileUri) => {
  try {
    const response = await fetch('/api/chat', {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, fileUri }),
    });

    const data = await response.json();

    if (data.error) {
      return data.error;
    }

    return data.reply || "No response from AI.";
  } catch (error) {
    console.error("Frontend HTTP Error:", error);
    return "Error communicating with the secure backend.";
  }
};
