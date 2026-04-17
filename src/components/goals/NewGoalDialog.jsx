import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Sparkles } from 'lucide-react';
import { cn } from "@/lib/utils";

const priorities = [
  { value: 'low',    label: '🟦 Low',    desc: 'Nice to have' },
  { value: 'medium', label: '🟨 Medium', desc: 'Important' },
  { value: 'high',   label: '🟥 High',   desc: 'Critical' },
];

export default function NewGoalDialog({ open, onClose, onSubmit, isGenerating }) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    deadline: '',
    priority: 'medium',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    onSubmit(form);
  };

  const set = (key, val) => setForm(p => ({ ...p, [key]: val }));

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border/60 max-w-md w-full">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Sparkles className="h-5 w-5 text-primary" />
            Set a New Goal
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label className="text-sm text-foreground/80">Goal Title *</Label>
            <Input
              placeholder="e.g. Learn Spanish in 6 months"
              value={form.title}
              onChange={e => set('title', e.target.value)}
              className="bg-background border-border/50 focus:border-primary/50"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm text-foreground/80">Description</Label>
            <Textarea
              placeholder="What does success look like? Any specific milestones?"
              value={form.description}
              onChange={e => set('description', e.target.value)}
              className="bg-background border-border/50 focus:border-primary/50 resize-none h-20"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-sm text-foreground/80">Deadline</Label>
              <Input
                type="date"
                value={form.deadline}
                onChange={e => set('deadline', e.target.value)}
                className="bg-background border-border/50 focus:border-primary/50"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm text-foreground/80">Priority</Label>
              <Select value={form.priority} onValueChange={v => set('priority', v)}>
                <SelectTrigger className="bg-background border-border/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {priorities.map(p => (
                    <SelectItem key={p.value} value={p.value}>
                      <span>{p.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1 border-border/50">
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!form.title.trim() || isGenerating}
              className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground gap-2 shadow-lg shadow-primary/20"
            >
              {isGenerating ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Generating AI Plan...</>
              ) : (
                <><Sparkles className="h-4 w-4" /> Create & Generate Plan</>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}