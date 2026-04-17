const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useState, useEffect, useRef, useCallback } from 'react';

import MessageBubble from '../components/chat/MessageBubble';
import ChatInput from '../components/chat/ChatInput';
import ThinkingIndicator from '../components/chat/ThinkingIndicator';
import { GraduationCap } from 'lucide-react';

const AGENT_NAME = 'magpai';

// FlowTeach Tutor Agent identity (mirrors Agents.tutor from the JS logic)
const TUTOR_AGENT = {
  name: "FlowTeach Tutor",
  prefix: "### 🎓 Your AI Tutor\n",
  getExtra: (t) =>
    `\n\n**Resources for you:**\n- 📺 [YouTube Tutorial](https://www.youtube.com/results?search_query=${encodeURIComponent(t)})\n- 📖 [Wikipedia Study](https://en.wikipedia.org/wiki/${encodeURIComponent(t)})`
};

const buildTutorPrompt = (topic) =>
  `${TUTOR_AGENT.prefix}You are the ${TUTOR_AGENT.name}. Explain concepts step-by-step using simple language. ` +
  `Always check understanding. Use analogies and examples. Be encouraging and patient.\n\n` +
  `Student question: **${topic}**\n\n` +
  `After your explanation, always end with these resource links:\n` +
  `📺 **Watch Video:** [YouTube Tutorial](https://www.youtube.com/results?search_query=${encodeURIComponent(topic)}+tutorial)\n` +
  `🌐 **Read More:** [Wikipedia](https://en.wikipedia.org/wiki/${encodeURIComponent(topic)})`;

const quickStarters = [
  { icon: '📐', label: 'Explain a math concept', prompt: 'Can you explain the Pythagorean theorem step by step?' },
  { icon: '⚗️', label: 'Science topic', prompt: 'Explain photosynthesis in simple terms' },
  { icon: '📜', label: 'History lesson', prompt: 'Explain the causes of World War 1 simply' },
  { icon: '💻', label: 'Coding basics', prompt: 'Explain what a function is in programming, for a beginner' },
];

export default function Tutor() {
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef(null);
  const unsubRef = useRef(null);

  useEffect(() => {
    if (unsubRef.current) { unsubRef.current(); unsubRef.current = null; }
    if (conversation?.id) {
      const unsub = db.agents.subscribeToConversation(conversation.id, (data) => {
        setMessages(data.messages || []);
        const last = data.messages?.[data.messages.length - 1];
        if (last?.role === 'assistant') setIsSending(false);
      });
      unsubRef.current = unsub;
    }
    return () => { if (unsubRef.current) { unsubRef.current(); unsubRef.current = null; } };
  }, [conversation?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const startSession = useCallback(async (prompt) => {
    const conv = await db.agents.createConversation({
      agent_name: AGENT_NAME,
      metadata: { name: `Tutor: ${prompt.slice(0, 40)}` }
    });
    setConversation(conv);
    setMessages([]);
    await new Promise(r => setTimeout(r, 100));
    setIsSending(true);
    await db.agents.addMessage(conv, {
      role: 'user',
      content: buildTutorPrompt(prompt)
    });
  }, []);

  const handleSend = useCallback(async (content, fileUrls) => {
    if (!conversation) {
      await startSession(content);
      return;
    }
    setIsSending(true);
    const msg = { role: 'user', content };
    if (fileUrls?.length > 0) msg.file_urls = fileUrls;
    await db.agents.addMessage(conversation, msg);
  }, [conversation, startSession]);

  const handleReset = () => {
    if (unsubRef.current) { unsubRef.current(); unsubRef.current = null; }
    setConversation(null);
    setMessages([]);
    setIsSending(false);
  };

  return (
    <div className="flex-1 flex flex-col min-w-0">
      {!conversation ? (
        <div className="flex-1 flex flex-col items-center justify-center px-4">
          <div className="max-w-lg w-full text-center space-y-8">
            <div className="space-y-3">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 border border-yellow-500/30 flex items-center justify-center mx-auto">
                <GraduationCap className="h-7 w-7 text-yellow-400" />
              </div>
              <h1 className="text-3xl font-bold text-foreground">
                Your <span className="text-yellow-400">AI Tutor</span>
              </h1>
              <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                I'll explain any topic step-by-step, use examples, and check your understanding as we go.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {quickStarters.map((s, i) => (
                <button
                  key={i}
                  onClick={() => startSession(s.prompt)}
                  className="px-4 py-3.5 rounded-xl bg-card border border-border/40 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary hover:border-yellow-500/30 transition-all text-left flex items-center gap-2.5"
                >
                  <span className="text-lg">{s.icon}</span>
                  <span>{s.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto py-6 px-4 space-y-5">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-yellow-400 text-sm font-medium">
                <GraduationCap className="h-4 w-4" />
                Tutor Mode Active
              </div>
              <button onClick={handleReset} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                New Session
              </button>
            </div>
            {messages.map((msg, idx) => (
              <MessageBubble key={idx} message={msg} />
            ))}
            {isSending && messages[messages.length - 1]?.role !== 'assistant' && <ThinkingIndicator />}
            <div ref={messagesEndRef} />
          </div>
        </div>
      )}
      <ChatInput onSend={handleSend} disabled={isSending} />
    </div>
  );
}