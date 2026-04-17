import db from '../api/base44Client';

import { useState, useEffect, useRef, useCallback } from 'react';

import MessageBubble from '../components/chat/MessageBubble';
import ChatInput from '../components/chat/ChatInput';
import WelcomeScreen from '../components/chat/WelcomeScreen';
import ConversationSidebar from '../components/chat/ConversationSidebar';
import ThinkingIndicator from '../components/chat/ThinkingIndicator';

const AGENT_NAME = 'magpai'; // v2

export default function Chat({ onGoToGoals, onGoToFlowTeach, initialPrompt, onInitialPromptConsumed }) {
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const messagesEndRef = useRef(null);
  const unsubRef = useRef(null);
  const chatInputRef = useRef(null);

  useEffect(() => { loadConversations(); }, []);

  // Handle incoming prompt from Goals page
  useEffect(() => {
    if (initialPrompt) {
      handleQuickAction(initialPrompt);
      onInitialPromptConsumed?.();
    }
  }, [initialPrompt]);

  const loadConversations = async () => {
    setIsLoading(true);
    const convos = await db.agents.listConversations({ agent_name: AGENT_NAME });
    setConversations(convos || []);
    setIsLoading(false);
  };

  useEffect(() => {
    if (unsubRef.current) { unsubRef.current(); unsubRef.current = null; }
    if (activeConversation?.id) {
      const unsub = db.agents.subscribeToConversation(activeConversation.id, (data) => {
        setMessages(data.messages || []);
        const lastMsg = data.messages?.[data.messages.length - 1];
        if (lastMsg && lastMsg.role === 'assistant') setIsSending(false);
      });
      unsubRef.current = unsub;
    }
    return () => { if (unsubRef.current) { unsubRef.current(); unsubRef.current = null; } };
  }, [activeConversation?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleNewChat = useCallback(() => {
    if (unsubRef.current) { unsubRef.current(); unsubRef.current = null; }
    setActiveConversation(null);
    setMessages([]);
    setIsSending(false);
    setTimeout(() => chatInputRef.current?.focus(), 50);
  }, []);

  const handleSelectConversation = useCallback(async (id) => {
    const conv = await db.agents.getConversation(id);
    setActiveConversation(conv);
    setMessages(conv.messages || []);
  }, []);

  const handleDeleteConversation = useCallback(async (id) => {
    setConversations(prev => prev.filter(c => c.id !== id));
    if (activeConversation?.id === id) { setActiveConversation(null); setMessages([]); }
    await loadConversations();
  }, [activeConversation?.id]);

  const handleSendMessage = useCallback(async (content, fileUrls) => {
    if (!activeConversation) {
      const conv = await db.agents.createConversation({ agent_name: AGENT_NAME, metadata: { name: content.slice(0, 50) } });
      setActiveConversation(conv);
      setMessages([]);
      await loadConversations();
      await new Promise(r => setTimeout(r, 100));
      setIsSending(true);
      const msg = { role: 'user', content };
      if (fileUrls?.length > 0) msg.file_urls = fileUrls;
      await db.agents.addMessage(conv, msg);
      return;
    }
    setIsSending(true);
    const msg = { role: 'user', content };
    if (fileUrls?.length > 0) msg.file_urls = fileUrls;
    await db.agents.addMessage(activeConversation, msg);
    if (messages.length === 0) {
      await loadConversations();
    }
  }, [activeConversation, messages.length]);

  const handleQuickAction = useCallback(async (prompt) => {
    const conv = await db.agents.createConversation({ agent_name: AGENT_NAME, metadata: { name: prompt.slice(0, 50) } });
    setActiveConversation(conv);
    setMessages([]);
    await loadConversations();
    await new Promise(r => setTimeout(r, 300));
    setIsSending(true);
    await db.agents.addMessage(conv, { role: 'user', content: prompt });
  }, []);

  const showWelcome = !activeConversation;

  return (
    <div className="flex flex-1 overflow-hidden">
      <ConversationSidebar
        conversations={conversations}
        activeConversationId={activeConversation?.id}
        onSelectConversation={handleSelectConversation}
        onNewChat={handleNewChat}
        onDeleteConversation={handleDeleteConversation}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />
      <div className="flex-1 flex flex-col min-w-0">
        {showWelcome ? (
          <>
            <WelcomeScreen onNewChat={handleNewChat} onQuickAction={handleQuickAction} onGoToGoals={onGoToGoals} onGoToFlowTeach={onGoToFlowTeach} />
            <ChatInput ref={chatInputRef} onSend={handleSendMessage} disabled={false} />
          </>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto">
              <div className="max-w-3xl mx-auto py-6 px-4 space-y-5">
                {messages.map((msg, idx) => (
                  <MessageBubble key={idx} message={msg} />
                ))}
                {isSending && messages[messages.length - 1]?.role !== 'assistant' && <ThinkingIndicator />}
                <div ref={messagesEndRef} />
              </div>
            </div>
            <ChatInput ref={chatInputRef} onSend={handleSendMessage} disabled={isSending} />
          </>
        )}
      </div>
    </div>
  );
}
