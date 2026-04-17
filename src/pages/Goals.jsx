import db from '../api/base44Client';

import { useState, useEffect, useCallback } from 'react';

import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Plus, Target, Sparkles, TrendingUp, CheckCircle2, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import GoalCard from '../components/goals/GoalCard';
import NewGoalDialog from '../components/goals/NewGoalDialog';
import GoalDetailDrawer from '../components/goals/GoalDetailDrawer';

const AGENT_NAME = 'magpai';

export default function Goals({ onNavigateToChat }) {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewGoal, setShowNewGoal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => { fetchGoals(); }, []);

  const fetchGoals = async () => {
    setLoading(true);
    const data = await db.entities.Goal.list('-created_date');
    setGoals(data || []);
    setLoading(false);
  };

  const handleCreateGoal = useCallback(async (form) => {
    setIsGenerating(true);
    // Create goal first
    const newGoal = await db.entities.Goal.create({
      title: form.title,
      description: form.description,
      deadline: form.deadline,
      priority: form.priority,
      status: 'active',
      progress: 0,
      roadmap: [],
    });

    // Generate AI roadmap
    const prompt = `Create a detailed step-by-step roadmap for this goal:
Title: ${form.title}
Description: ${form.description || 'No description provided'}
Deadline: ${form.deadline || 'No specific deadline'}
Priority: ${form.priority}

Return a JSON with:
- summary: A brief motivating strategy paragraph (2-3 sentences)
- tasks: Array of 5-8 tasks, each with: { task: string, timeline: string }`;

    const result = await db.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          summary: { type: 'string' },
          tasks: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                task: { type: 'string' },
                timeline: { type: 'string' }
              }
            }
          }
        }
      }
    });

    const roadmap = (result.tasks || []).map((t, i) => ({
      id: `task-${i}`,
      task: t.task,
      timeline: t.timeline,
      completed: false,
    }));

    await db.entities.Goal.update(newGoal.id, {
      ai_summary: result.summary,
      roadmap,
    });

    setIsGenerating(false);
    setShowNewGoal(false);
    toast.success('Goal created with AI roadmap!');
    fetchGoals();
  }, []);

  const handleUpdateStatus = useCallback(async (id, status) => {
    await db.entities.Goal.update(id, { status });
    setGoals(prev => prev.map(g => g.id === id ? { ...g, status } : g));
    toast.success(`Goal marked as ${status}`);
  }, []);

  const handleDelete = useCallback(async (id) => {
    await db.entities.Goal.delete(id);
    setGoals(prev => prev.filter(g => g.id !== id));
    toast.success('Goal deleted');
  }, []);

  const handleTaskToggle = useCallback(async (goalId, taskIdx, checked) => {
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;
    const newRoadmap = goal.roadmap.map((t, i) => i === taskIdx ? { ...t, completed: checked } : t);
    const completed = newRoadmap.filter(t => t.completed).length;
    const progress = newRoadmap.length > 0 ? Math.round((completed / newRoadmap.length) * 100) : 0;
    const status = progress === 100 ? 'completed' : goal.status === 'completed' ? 'active' : goal.status;
    const updated = { ...goal, roadmap: newRoadmap, progress, status };
    await db.entities.Goal.update(goalId, { roadmap: newRoadmap, progress, status });
    setGoals(prev => prev.map(g => g.id === goalId ? updated : g));
    if (selectedGoal?.id === goalId) setSelectedGoal(updated);
  }, [goals, selectedGoal]);

  const handleOpenGoal = (goal) => {
    setSelectedGoal(goal);
    setDrawerOpen(true);
  };

  const handleChatAboutGoal = useCallback(async (goal) => {
    setDrawerOpen(false);
    const prompt = `I want to plan my goal: "${goal.title}". ${goal.description ? `Details: ${goal.description}.` : ''} ${goal.deadline ? `Deadline: ${goal.deadline}.` : ''} Please help me create a detailed action plan, identify challenges, and suggest strategies for success.`;
    onNavigateToChat(prompt);
  }, [onNavigateToChat]);

  const filterGoals = (tab) => {
    if (tab === 'all') return goals;
    return goals.filter(g => g.status === tab);
  };

  const stats = {
    active: goals.filter(g => g.status === 'active').length,
    completed: goals.filter(g => g.status === 'completed').length,
    avgProgress: goals.length > 0 ? Math.round(goals.reduce((s, g) => s + (g.progress || 0), 0) / goals.length) : 0,
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Target className="h-6 w-6 text-primary" />
              Goals Dashboard
            </h1>
            <p className="text-muted-foreground text-sm mt-0.5">Track your goals with AI-powered roadmaps</p>
          </div>
          <Button
            onClick={() => setShowNewGoal(true)}
            className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 shadow-lg shadow-primary/20 rounded-xl"
          >
            <Plus className="h-4 w-4" />
            New Goal
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { icon: Target, label: 'Active Goals',     value: stats.active,      color: 'text-primary', bg: 'bg-primary/10' },
            { icon: CheckCircle2, label: 'Completed',  value: stats.completed,   color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
            { icon: TrendingUp, label: 'Avg Progress', value: `${stats.avgProgress}%`, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
          ].map(({ icon: Icon, label, value, color, bg }) => (
            <div key={label} className="bg-card border border-border/40 rounded-xl p-4 flex items-center gap-3">
              <div className={`p-2.5 rounded-lg ${bg}`}>
                <Icon className={`h-4 w-4 ${color}`} />
              </div>
              <div>
                <p className="text-xl font-bold text-foreground">{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="active">
          <TabsList className="bg-secondary/50 border border-border/30 mb-5 w-full sm:w-auto">
            {['active', 'completed', 'paused', 'all'].map(tab => (
              <TabsTrigger key={tab} value={tab} className="capitalize data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                {tab}
                <span className="ml-1.5 text-xs opacity-70">({filterGoals(tab).length})</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {['active', 'completed', 'paused', 'all'].map(tab => (
            <TabsContent key={tab} value={tab}>
              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : filterGoals(tab).length === 0 ? (
                <EmptyState tab={tab} onNew={() => setShowNewGoal(true)} />
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  <AnimatePresence>
                    {filterGoals(tab).map((goal, i) => (
                      <GoalCard
                        key={goal.id}
                        goal={goal}
                        index={i}
                        onChat={handleChatAboutGoal}
                        onUpdateStatus={handleUpdateStatus}
                        onDelete={handleDelete}
                        onOpen={handleOpenGoal}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>

      <NewGoalDialog
        open={showNewGoal}
        onClose={() => setShowNewGoal(false)}
        onSubmit={handleCreateGoal}
        isGenerating={isGenerating}
      />

      <GoalDetailDrawer
        goal={selectedGoal}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onTaskToggle={handleTaskToggle}
        onChat={handleChatAboutGoal}
      />
    </div>
  );
}

function EmptyState({ tab, onNew }) {
  const msgs = {
    active:    { emoji: '🎯', title: 'No active goals yet', sub: 'Set your first goal and let AI build your roadmap.' },
    completed: { emoji: '🏆', title: 'No completed goals', sub: 'Keep working — your achievements will appear here.' },
    paused:    { emoji: '⏸️', title: 'No paused goals',   sub: 'Goals you pause will show up here.' },
    all:       { emoji: '✨', title: 'No goals yet',        sub: 'Create your first goal to get started.' },
  };
  const { emoji, title, sub } = msgs[tab] || msgs.all;
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center py-20 text-center"
    >
      <div className="text-5xl mb-4">{emoji}</div>
      <h3 className="text-lg font-semibold text-foreground mb-1">{title}</h3>
      <p className="text-muted-foreground text-sm mb-6 max-w-xs">{sub}</p>
      {(tab === 'active' || tab === 'all') && (
        <Button onClick={onNew} className="bg-primary hover:bg-primary/90 gap-2 rounded-xl shadow-lg shadow-primary/20">
          <Plus className="h-4 w-4" /> Set a Goal
        </Button>
      )}
    </motion.div>
  );
}
