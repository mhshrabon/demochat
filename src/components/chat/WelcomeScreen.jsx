import db from '../../api/base44Client';

import { Button } from "@/components/ui/button";
import { Plus, Target, BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';

const quickActions = [
  { icon: '🎯', label: 'Set a life goal', prompt: 'Help me set and plan a meaningful life goal' },
  { icon: '💡', label: 'Ask anything', prompt: 'Tell me something interesting I might not know' },
  { icon: '📊', label: 'Track my progress', prompt: 'How can I track and measure my progress effectively?' },
  { icon: '🔍', label: 'Search the web', prompt: 'Search the web for the latest news today' },
];

export default function WelcomeScreen({ onNewChat, onQuickAction, onGoToGoals, onGoToFlowTeach }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-lg w-full text-center space-y-8"
      >
        <div className="space-y-4">
          <div className="h-16 w-16 flex items-center justify-center mx-auto">
            <img src="https://media.db.com/images/public/69d22c2b0c2c3109e3707efc/65c0d6401_copy.png" alt="MagpAI Logo" className="h-16 w-16 object-contain" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            Hey, I'm <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">MagpAI</span>
          </h1>
          <p className="text-muted-foreground text-base leading-relaxed max-w-md mx-auto">
            Your high-performance AI assistant. Ask me anything, and I'll provide accurate, well-structured solutions.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap justify-center">
          <Button
            onClick={onNewChat}
            className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all gap-2 px-6 h-11"
          >
            <Plus className="h-4 w-4" />
            Start New Chat
          </Button>
          <Button
            onClick={onGoToGoals}
            variant="outline"
            className="border-primary/30 text-primary hover:bg-primary/10 rounded-xl gap-2 px-6 h-11"
          >
            <Target className="h-4 w-4" />
            My Goals
          </Button>
          <Button
            onClick={onGoToFlowTeach}
            variant="outline"
            className="border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10 rounded-xl gap-2 px-6 h-11"
          >
            <BookOpen className="h-4 w-4" />
            Your AI Tutor
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2">
          {quickActions.map((action, i) => (
            <motion.button
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * (i + 1) }}
              onClick={() => onQuickAction(action.prompt)}
              className="px-4 py-3.5 rounded-xl bg-card border border-border/40 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary hover:border-border/80 transition-all text-left flex items-center gap-2.5"
            >
              <span className="text-lg">{action.icon}</span>
              <span>{action.label}</span>
            </motion.button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
