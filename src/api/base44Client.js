import { askGemini } from './gemini';

/**
 * A local-first mock database and AI bridge.
 * This replaces the empty placeholders with actual logic using LocalStorage and Gemini.
 */

// Helper to manage LocalStorage
const storage = {
  get: (key) => JSON.parse(localStorage.getItem(key) || '[]'),
  set: (key, data) => localStorage.setItem(key, JSON.stringify(data)),
};

export const db = {
  auth: {
    isAuthenticated: async () => true,
    me: async () => ({ id: 'user_1', name: 'User' }),
  },

  // ENTITIES (Goals, etc.)
  entities: {
    Goal: {
      list: async () => storage.get('b44_goals'),
      create: async (data) => {
        const goals = storage.get('b44_goals');
        const newGoal = { ...data, id: Math.random().toString(36).substr(2, 9), created_date: new Date().toISOString() };
        goals.push(newGoal);
        storage.set('b44_goals', goals);
        return newGoal;
      },
      update: async (id, data) => {
        const goals = storage.get('b44_goals');
        const idx = goals.findIndex(g => g.id === id);
        if (idx !== -1) {
          goals[idx] = { ...goals[idx], ...data };
          storage.set('b44_goals', goals);
        }
        return goals[idx];
      },
      delete: async (id) => {
        const goals = storage.get('b44_goals').filter(g => g.id !== id);
        storage.set('b44_goals', goals);
      }
    }
  },

  // AGENTS (Chat history & Gemini interaction)
  agents: {
    listConversations: async () => storage.get('b44_conversations'),
    getConversation: async (id) => storage.get('b44_conversations').find(c => c.id === id),
    createConversation: async ({ metadata }) => {
      const convos = storage.get('b44_conversations');
      const newConvo = { id: Math.random().toString(36).substr(2, 9), messages: [], metadata };
      convos.push(newConvo);
      storage.set('b44_conversations', convos);
      return newConvo;
    },
    addMessage: async (convo, message) => {
      const convos = storage.get('b44_conversations');
      const cIdx = convos.findIndex(c => c.id === convo.id);
      if (cIdx === -1) return;

      // 1. Add User Message
      convos[cIdx].messages.push(message);
      storage.set('b44_conversations', convos);

      // 2. Trigger Gemini Response
      // Only send the last 4 messages to save tokens and prevent "spike demand" rate limits
      const recentMessages = convos[cIdx].messages.slice(-4);
      const history = recentMessages.map(m => `${m.role}: ${m.content}`).join('\n\n');
      const aiResponseText = await askGemini(history);

      // 3. Add Assistant Message
      const assistantMsg = { role: 'assistant', content: aiResponseText };
      convos[cIdx].messages.push(assistantMsg);
      storage.set('b44_conversations', convos);

      // Trigger the subscription callback if it exists (for UI updates)
      if (window.__b44_subs?.[convo.id]) {
        window.__b44_subs[convo.id]({ messages: convos[cIdx].messages });
      }
    },
    subscribeToConversation: (id, callback) => {
      if (!window.__b44_subs) window.__b44_subs = {};
      window.__b44_subs[id] = callback;
      return () => { delete window.__b44_subs[id]; };
    }
  },

  integrations: {
    Core: {
      // Used by Goals page to generate roadmaps
      InvokeLLM: async ({ prompt }) => {
        const responseText = await askGemini(prompt + "\n\nIMPORTANT: Return ONLY raw JSON code. No markdown boxes.");
        try {
          // Clean the response if Gemini wraps it in markdown blocks
          const cleanJson = responseText.replace(/```json|```/g, '').trim();
          return JSON.parse(cleanJson);
        } catch (e) {
          console.error("Failed to parse AI Roadmap JSON", e);
          return { summary: "Error generating roadmap.", tasks: [] };
        }
      },
      UploadFile: async (file) => ({ file_url: URL.createObjectURL(file) })
    }
  }
};

export const base44 = db;
export default db;
