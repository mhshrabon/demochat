const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useState, useRef, forwardRef, useImperativeHandle } from 'react';
import { Button } from "@/components/ui/button";
import { Send, Image, X, Loader2, Mic, MicOff, Globe } from 'lucide-react';

import { cn } from "@/lib/utils";

const ChatInput = forwardRef(function ChatInput({ onSend, disabled }, ref) {
  useImperativeHandle(ref, () => ({
    focus: () => textareaRef.current?.focus()
  }));
  const [message, setMessage] = useState('');
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [lang, setLang] = useState('en-US'); // Default English
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const recognitionRef = useRef(null);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice recognition is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = lang; // 'en-US' or 'bn-BD'
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setMessage(prev => (prev ? prev + ' ' + transcript : transcript));
      setIsListening(false);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;
    recognition.start();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if ((!message.trim() && attachedFiles.length === 0) || disabled) return;
    onSend(message.trim(), attachedFiles.map(f => f.url));
    setMessage('');
    setAttachedFiles([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleTextareaChange = (e) => {
    setMessage(e.target.value);
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = 'auto';
      ta.style.height = Math.min(ta.scrollHeight, 150) + 'px';
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await db.integrations.Core.UploadFile({ file });
    setAttachedFiles(prev => [...prev, { name: file.name, url: file_url }]);
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = (index) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="px-4 pb-4 pt-2">
      <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
        {attachedFiles.length > 0 && (
          <div className="flex gap-2 mb-2 flex-wrap">
            {attachedFiles.map((file, i) => (
              <div key={i} className="flex items-center gap-1.5 bg-secondary/80 border border-border/50 rounded-lg px-3 py-1.5 text-xs text-foreground/80">
                <Image className="h-3 w-3 text-primary" />
                <span className="truncate max-w-[150px]">{file.name}</span>
                <button type="button" onClick={() => removeFile(i)} className="hover:text-accent transition-colors">
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="relative flex items-end gap-2 bg-card border border-border/60 rounded-2xl p-2 focus-within:border-primary/40 transition-colors">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileUpload}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-9 w-9 shrink-0 text-muted-foreground hover:text-primary"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Image className="h-4 w-4" />}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={cn("h-9 w-9 shrink-0 transition-colors", isListening ? "text-red-500 animate-pulse" : "text-muted-foreground hover:text-primary")}
            onClick={toggleListening}
          >
            {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </Button>
          <button
            type="button"
            onClick={() => setLang(lang === 'en-US' ? 'bn-BD' : 'en-US')}
            className="h-7 px-1.5 rounded bg-secondary/50 text-[10px] font-bold text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
          >
            <Globe className="h-3 w-3" />
            {lang === 'en-US' ? 'EN' : 'BN'}
          </button>
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            placeholder="Ask MagpAI anything..."
            rows={1}
            className="flex-1 bg-transparent border-0 outline-none resize-none text-sm text-foreground placeholder:text-muted-foreground py-2 px-1 max-h-[150px]"
            disabled={disabled}
          />
          <Button
            type="submit"
            size="icon"
            disabled={(!message.trim() && attachedFiles.length === 0) || disabled}
            className={cn(
              "h-9 w-9 shrink-0 rounded-xl transition-all",
              message.trim() || attachedFiles.length > 0
                ? "bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20"
                : "bg-secondary text-muted-foreground"
            )}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-center text-[10px] text-muted-foreground/50 mt-2">
          MagpAI may produce inaccurate information. Verify important details.
        </p>
      </form>
    </div>
  );
});

export default ChatInput;