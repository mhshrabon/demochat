import { motion } from 'framer-motion';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Calendar, MessageSquare, MoreHorizontal, CheckCircle2, Pause, Play, Trash2, Flag } from 'lucide-react';
import { format, isPast } from 'date-fns';
import { cn } from "@/lib/utils";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";

const priorityConfig = {
  low:    { color: 'bg-blue-500/10 text-blue-400 border-blue-500/20',    dot: 'bg-blue-400' },
  medium: { color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20', dot: 'bg-yellow-400' },
  high:   { color: 'bg-accent/10 text-accent border-accent/20',           dot: 'bg-accent' },
};

const statusConfig = {
  active:    { color: 'bg-primary/10 text-primary border-primary/20',   label: 'Active' },
  completed: { color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', label: 'Completed' },
  paused:    { color: 'bg-muted text-muted-foreground border-border',   label: 'Paused' },
};

export default function GoalCard({ goal, onChat, onUpdateStatus, onDelete, onOpen, index }) {
  const completedTasks = goal.roadmap?.filter(t => t.completed).length || 0;
  const totalTasks = goal.roadmap?.length || 0;
  const isOverdue = goal.deadline && isPast(new Date(goal.deadline)) && goal.status !== 'completed';

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="group bg-card border border-border/50 rounded-2xl p-5 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all cursor-pointer"
      onClick={() => onOpen(goal)}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <Badge className={cn("text-xs border px-2 py-0.5", priorityConfig[goal.priority]?.color)}>
              <span className={cn("w-1.5 h-1.5 rounded-full mr-1.5 inline-block", priorityConfig[goal.priority]?.dot)} />
              {goal.priority}
            </Badge>
            <Badge className={cn("text-xs border px-2 py-0.5", statusConfig[goal.status]?.color)}>
              {statusConfig[goal.status]?.label}
            </Badge>
            {isOverdue && (
              <Badge className="text-xs border px-2 py-0.5 bg-accent/10 text-accent border-accent/20">
                Overdue
              </Badge>
            )}
          </div>
          <h3 className="font-semibold text-foreground text-base leading-snug truncate">{goal.title}</h3>
          {goal.description && (
            <p className="text-muted-foreground text-sm mt-1 line-clamp-2">{goal.description}</p>
          )}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost" size="icon"
              className="h-8 w-8 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={e => e.stopPropagation()}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            {goal.status !== 'completed' && (
              <DropdownMenuItem onClick={e => { e.stopPropagation(); onUpdateStatus(goal.id, 'completed'); }}>
                <CheckCircle2 className="h-3.5 w-3.5 mr-2 text-primary" /> Mark Complete
              </DropdownMenuItem>
            )}
            {goal.status === 'active' && (
              <DropdownMenuItem onClick={e => { e.stopPropagation(); onUpdateStatus(goal.id, 'paused'); }}>
                <Pause className="h-3.5 w-3.5 mr-2" /> Pause Goal
              </DropdownMenuItem>
            )}
            {goal.status === 'paused' && (
              <DropdownMenuItem onClick={e => { e.stopPropagation(); onUpdateStatus(goal.id, 'active'); }}>
                <Play className="h-3.5 w-3.5 mr-2 text-primary" /> Resume Goal
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-accent focus:text-accent"
              onClick={e => { e.stopPropagation(); onDelete(goal.id); }}
            >
              <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Progress */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
          <span>{totalTasks > 0 ? `${completedTasks}/${totalTasks} tasks` : 'No tasks yet'}</span>
          <span className="font-medium text-foreground">{goal.progress || 0}%</span>
        </div>
        <Progress value={goal.progress || 0} className="h-1.5 bg-secondary" />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          {goal.deadline && (
            <>
              <Calendar className="h-3.5 w-3.5" />
              <span className={cn(isOverdue && "text-accent")}>
                {format(new Date(goal.deadline), 'MMM d, yyyy')}
              </span>
            </>
          )}
        </div>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 px-2.5 text-xs text-primary hover:bg-primary/10 gap-1.5"
          onClick={e => { e.stopPropagation(); onChat(goal); }}
        >
          <MessageSquare className="h-3 w-3" />
          Chat with AI
        </Button>
      </div>
    </motion.div>
  );
}