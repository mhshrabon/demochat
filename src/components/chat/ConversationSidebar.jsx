import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Plus, MessageSquare, Trash2, MoreHorizontal, PanelLeftClose, PanelLeft } from 'lucide-react';
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from 'date-fns';

export default function ConversationSidebar({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewChat,
  onDeleteConversation,
  isOpen,
  onToggle
}) {
  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        className="fixed top-4 left-4 z-50 p-2 rounded-lg bg-card border border-border/50 hover:bg-secondary transition-colors"
      >
        <PanelLeft className="h-5 w-5 text-muted-foreground" />
      </button>
    );
  }

  const grouped = groupConversations(conversations);

  return (
    <div className="w-72 h-full bg-card/50 border-r border-border/50 flex flex-col shrink-0">
      {/* Header */}
      <div className="p-4 flex items-center justify-between border-b border-border/30">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-primary/30 to-accent/30 border border-primary/20 flex items-center justify-center">
            <span className="text-xs font-bold text-primary">M</span>
          </div>
          <span className="font-semibold text-sm text-foreground">MagpAI</span>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={onNewChat} className="h-8 w-8 text-muted-foreground hover:text-primary">
            <Plus className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onToggle} className="h-8 w-8 text-muted-foreground">
            <PanelLeftClose className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto py-2 px-2 space-y-4">
        {grouped.map(group => (
          <div key={group.label}>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-medium px-2 mb-1.5">{group.label}</p>
            <div className="space-y-0.5">
              {group.items.map(conv => (
                <div
                  key={conv.id}
                  onClick={() => onSelectConversation(conv.id)}
                  className={cn(
                    "group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all text-sm",
                    activeConversationId === conv.id
                      ? "bg-primary/10 text-foreground border border-primary/20"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                  )}
                >
                  <MessageSquare className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate flex-1">{conv.metadata?.name || 'New Chat'}</span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-secondary rounded"
                        onClick={e => e.stopPropagation()}
                      >
                        <MoreHorizontal className="h-3.5 w-3.5" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-36">
                      <DropdownMenuItem
                        className="text-accent focus:text-accent"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteConversation(conv.id);
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          </div>
        ))}

        {conversations.length === 0 && (
          <div className="text-center py-8">
            <p className="text-xs text-muted-foreground/50">No conversations yet</p>
          </div>
        )}
      </div>
    </div>
  );
}

function groupConversations(conversations) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const weekAgo = new Date(today.getTime() - 7 * 86400000);

  const groups = { Today: [], Yesterday: [], 'This Week': [], Earlier: [] };

  const sorted = [...conversations].sort((a, b) =>
    new Date(b.created_date || 0) - new Date(a.created_date || 0)
  );

  sorted.forEach(conv => {
    const d = new Date(conv.created_date || 0);
    if (d >= today) groups.Today.push(conv);
    else if (d >= yesterday) groups.Yesterday.push(conv);
    else if (d >= weekAgo) groups['This Week'].push(conv);
    else groups.Earlier.push(conv);
  });

  return Object.entries(groups)
    .filter(([, items]) => items.length > 0)
    .map(([label, items]) => ({ label, items }));
}