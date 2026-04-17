import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { MessageSquare, Calendar, Sparkles, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from "@/lib/utils";
import ReactMarkdown from 'react-markdown';

const priorityColors = {
  low:    'bg-blue-500/10 text-blue-400 border-blue-500/20',
  medium: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  high:   'bg-accent/10 text-accent border-accent/20',
};

export default function GoalDetailDrawer({ goal, open, onClose, onTaskToggle, onChat }) {
  if (!goal) return null;

  const completedTasks = goal.roadmap?.filter(t => t.completed).length || 0;
  const totalTasks = goal.roadmap?.length || 0;

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="bg-card border-border/50 w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="mb-6">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <Badge className={cn("text-xs border px-2 py-0.5", priorityColors[goal.priority])}>
              {goal.priority} priority
            </Badge>
            <Badge className="text-xs border px-2 py-0.5 bg-primary/10 text-primary border-primary/20">
              {goal.status}
            </Badge>
          </div>
          <SheetTitle className="text-xl text-foreground leading-snug">{goal.title}</SheetTitle>
          {goal.description && (
            <p className="text-muted-foreground text-sm mt-1">{goal.description}</p>
          )}
        </SheetHeader>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-background rounded-xl p-3 border border-border/30 text-center">
            <p className="text-2xl font-bold text-primary">{goal.progress || 0}%</p>
            <p className="text-xs text-muted-foreground mt-0.5">Progress</p>
          </div>
          <div className="bg-background rounded-xl p-3 border border-border/30 text-center">
            <p className="text-2xl font-bold text-foreground">{completedTasks}/{totalTasks}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Tasks Done</p>
          </div>
          <div className="bg-background rounded-xl p-3 border border-border/30 text-center">
            <p className="text-2xl font-bold text-foreground">
              {goal.deadline ? format(new Date(goal.deadline), 'MMM d') : '—'}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">Deadline</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <Progress value={goal.progress || 0} className="h-2 bg-secondary" />
        </div>

        {/* AI Summary */}
        {goal.ai_summary && (
          <div className="mb-6 bg-primary/5 border border-primary/20 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-primary">AI Strategy</span>
            </div>
            <div className="text-sm text-foreground/80 leading-relaxed">
              <ReactMarkdown>{goal.ai_summary}</ReactMarkdown>
            </div>
          </div>
        )}

        {/* Roadmap Tasks */}
        {totalTasks > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              AI Roadmap ({completedTasks}/{totalTasks} completed)
            </h3>
            <div className="space-y-2">
              {goal.roadmap.map((task, idx) => (
                <div
                  key={task.id || idx}
                  className={cn(
                    "flex items-start gap-3 p-3 rounded-xl border transition-all",
                    task.completed
                      ? "bg-primary/5 border-primary/20"
                      : "bg-background border-border/30 hover:border-primary/20"
                  )}
                >
                  <Checkbox
                    checked={task.completed}
                    onCheckedChange={(checked) => onTaskToggle(goal.id, idx, checked)}
                    className="mt-0.5 border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                  />
                  <div className="flex-1 min-w-0">
                    <p className={cn("text-sm", task.completed && "line-through text-muted-foreground")}>
                      {task.task}
                    </p>
                    {task.timeline && (
                      <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> {task.timeline}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Chat Button */}
        <Button
          onClick={() => onChat(goal)}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground gap-2 shadow-lg shadow-primary/20 rounded-xl"
        >
          <MessageSquare className="h-4 w-4" />
          Chat with AI to Plan This Goal
        </Button>
      </SheetContent>
    </Sheet>
  );
}