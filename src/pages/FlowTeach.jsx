import db from '../api/base44Client';

import { useState, useEffect, useRef, useCallback } from 'react';

import MessageBubble from '../components/chat/MessageBubble';
import ChatInput from '../components/chat/ChatInput';
import ThinkingIndicator from '../components/chat/ThinkingIndicator';
import { BookOpen, ChevronDown } from 'lucide-react';

const AGENT_NAME = 'magpai';

const CLASSES = ['Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12'];
const SUBJECTS = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'History', 'Geography', 'Computer Science'];

// FlowTeach Tutor Agent identity (mirrors Agents.tutor from the JS logic)
const TUTOR_AGENT = {
  name: "FlowTeach Tutor",
  prefix: "### 🎓 Your AI Tutor\n",
  getExtra: (t) =>
    `\n\n**Resources for you:**\n- 📺 [YouTube Tutorial](https://www.youtube.com/results?search_query=${encodeURIComponent(t)})\n- 📖 [Wikipedia Study](https://en.wikipedia.org/wiki/${encodeURIComponent(t)})`
};

const FLOWTEACH_PROMPT = (cls, subject, topic) =>
  `${TUTOR_AGENT.prefix}You are the ${TUTOR_AGENT.name} — a curriculum-aligned teacher for ${cls}, subject: ${subject}.\n` +
  `Follow a structured lesson format: Intro → Concept → Examples → Practice → Summary.\n` +
  `Include practice questions at the end. Be encouraging and age-appropriate for ${cls} students.\n\n` +
  `Now teach: **${topic}**\n\n` +
  `After your lesson, always end with these resource links:\n` +
  `📺 **Watch Video:** [YouTube Tutorial](https://www.youtube.com/results?search_query=${encodeURIComponent(topic)}+${encodeURIComponent(subject)}+tutorial)\n` +
  `🌐 **Read More:** [Wikipedia](https://en.wikipedia.org/wiki/${encodeURIComponent(topic)})`;

export default function FlowTeach() {
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
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

  const startLesson = useCallback(async (topic) => {
    const conv = await db.agents.createConversation({
      agent_name: AGENT_NAME,
      metadata: { name: `${selectedClass} ${selectedSubject}: ${topic.slice(0, 30)}` }
    });
    setConversation(conv);
    setMessages([]);
    await new Promise(r => setTimeout(r, 100));
    setIsSending(true);
    await db.agents.addMessage(conv, {
      role: 'user',
      content: FLOWTEACH_PROMPT(selectedClass, selectedSubject, topic)
    });
  }, [selectedClass, selectedSubject]);

  const handleSend = useCallback(async (content, fileUrls) => {
    if (!conversation) {
      await startLesson(content);
      return;
    }
    setIsSending(true);
    const msg = { role: 'user', content };
    if (fileUrls?.length > 0) msg.file_urls = fileUrls;
    await db.agents.addMessage(conversation, msg);
  }, [conversation, startLesson]);

  const handleReset = () => {
    if (unsubRef.current) { unsubRef.current(); unsubRef.current = null; }
    setConversation(null);
    setMessages([]);
    setIsSending(false);
  };

  const canStart = selectedClass && selectedSubject;

  return (
    <div className="flex-1 flex flex-col min-w-0">
      {!conversation ? (
        <div className="flex-1 flex flex-col items-center justify-center px-4">
          <div className="max-w-lg w-full text-center space-y-8">
            <div className="space-y-3">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/30 flex items-center justify-center mx-auto">
                <BookOpen className="h-7 w-7 text-primary" />
              </div>
              <h1 className="text-3xl font-bold text-foreground">
                <span className="text-primary">FlowTeach</span>
              </h1>
              <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                Select your class and subject, then ask me to teach any topic — I'll follow your curriculum.
              </p>
            </div>

            {/* Class & Subject Selectors */}
            <div className="grid grid-cols-2 gap-3">
              <div className="relative">
                <select
                  value={selectedClass}
                  onChange={e => setSelectedClass(e.target.value)}
                  className="w-full appearance-none bg-card border border-border/60 text-foreground rounded-xl px-4 py-3 pr-9 text-sm outline-none focus:border-primary/50 cursor-pointer"
                >
                  <option value="">Select Class</option>
                  {CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              </div>
              <div className="relative">
                <select
                  value={selectedSubject}
                  onChange={e => setSelectedSubject(e.target.value)}
                  className="w-full appearance-none bg-card border border-border/60 text-foreground rounded-xl px-4 py-3 pr-9 text-sm outline-none focus:border-primary/50 cursor-pointer"
                >
                  <option value="">Select Subject</option>
                  {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>

            {canStart && (
              <div className="grid grid-cols-2 gap-3">
                {['Newton\'s Laws of Motion', 'Quadratic Equations', 'Photosynthesis', 'Create a Study Plan'].map((topic, i) => (
                  <button
                    key={i}
                    onClick={() => startLesson(topic)}
                    className="px-4 py-3.5 rounded-xl bg-card border border-border/40 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary hover:border-primary/30 transition-all text-left"
                  >
                    {topic}
                  </button>
                ))}
              </div>
            )}

            {!canStart && (
              <p className="text-xs text-muted-foreground/60">Select a class and subject to get started</p>
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto py-6 px-4 space-y-5">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-primary text-sm font-medium">
                <BookOpen className="h-4 w-4" />
                {selectedClass} · {selectedSubject}
              </div>
              <button onClick={handleReset} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                New Lesson
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
