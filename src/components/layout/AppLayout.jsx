import db from '../../api/base44Client';

import { useState, useEffect } from 'react';
import { MessageSquare, Target, GraduationCap, BookOpen, Sun, Moon } from 'lucide-react';
import { cn } from "@/lib/utils";

export default function AppLayout({ activeTab, onTabChange, children }) {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    }
  }, [isDark]);

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Top Nav */}
      <header className="shrink-0 border-b border-border/40 bg-card/60 backdrop-blur-sm px-4 h-14 flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <img src="https://media.db.com/images/public/69d22c2b0c2c3109e3707efc/65c0d6401_copy.png" alt="MagpAI Logo" className="h-7 w-7 object-contain" />
          <span className="font-bold text-sm text-foreground tracking-tight">MagpAI</span>
        </div>

        {/* Tab Toggle */}
        <div className="flex items-center gap-1 bg-secondary/50 border border-border/30 rounded-xl p-1">
          <button
            onClick={() => onTabChange('chat')}
            className={cn(
              "flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all",
              activeTab === 'chat'
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <MessageSquare className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Chat AI</span>
          </button>
          <button
            onClick={() => onTabChange('goals')}
            className={cn(
              "flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all",
              activeTab === 'goals'
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Target className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Goals</span>
          </button>
          <button
            onClick={() => onTabChange('tutor')}
            className={cn(
              "flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all",
              activeTab === 'tutor'
                ? "bg-yellow-500 text-black shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <GraduationCap className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Tutor</span>
          </button>
          <button
            onClick={() => onTabChange('flowteach')}
            className={cn(
              "flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all",
              activeTab === 'flowteach'
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <BookOpen className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">FlowTeach</span>
          </button>
        </div>

        <div className="flex items-center justify-end w-24">
          <button
            onClick={() => setIsDark(!isDark)}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </div>
      </header>

      {/* Page Content */}
      <div className="flex-1 flex overflow-hidden">
        {children}
      </div>
    </div>
  );
}
