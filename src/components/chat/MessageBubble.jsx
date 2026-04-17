import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Button } from "@/components/ui/button";
import { Copy, Zap, CheckCircle2, AlertCircle, Loader2, ChevronRight, Clock, Check } from 'lucide-react';
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const FunctionDisplay = ({ toolCall }) => {
  const [expanded, setExpanded] = useState(false);
  const name = toolCall?.name || 'Function';
  const status = toolCall?.status || 'pending';
  const results = toolCall?.results;

  const parsedResults = (() => {
    if (!results) return null;
    try { return typeof results === 'string' ? JSON.parse(results) : results; }
    catch { return results; }
  })();

  const isError = results && (
    (typeof results === 'string' && /error|failed/i.test(results)) ||
    (parsedResults?.success === false)
  );

  const isWebSearch = name?.toLowerCase().includes('search') || name?.toLowerCase().includes('web');

  const statusConfig = {
    pending: { icon: Clock, color: 'text-muted-foreground', text: 'Pending' },
    running: { icon: Loader2, color: 'text-primary', text: isWebSearch ? 'Searching web... ✓' : 'Running...', spin: true },
    in_progress: { icon: Loader2, color: 'text-primary', text: isWebSearch ? 'Thinking...' : 'Processing...', spin: true },
    completed: isError
      ? { icon: AlertCircle, color: 'text-accent', text: 'Failed' }
      : { icon: CheckCircle2, color: 'text-primary', text: isWebSearch ? 'Search complete ✓' : 'Complete ✓' },
    success: { icon: CheckCircle2, color: 'text-primary', text: isWebSearch ? 'Search complete ✓' : 'Complete ✓' },
    failed: { icon: AlertCircle, color: 'text-accent', text: 'Failed' },
    error: { icon: AlertCircle, color: 'text-accent', text: 'Failed' }
  }[status] || { icon: Zap, color: 'text-muted-foreground', text: '' };

  const Icon = statusConfig.icon;
  const formattedName = isWebSearch ? 'Web Search' : name.split('.').reverse().join(' ').toLowerCase();

  return (
    <div className="mt-2 text-xs">
      <button
        onClick={() => setExpanded(!expanded)}
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border/50 transition-all",
          "hover:bg-secondary/50",
          expanded ? "bg-secondary/50 border-border" : "bg-card"
        )}
      >
        <Icon className={cn("h-3 w-3", statusConfig.color, statusConfig.spin && "animate-spin")} />
        <span className="text-foreground/80">{formattedName}</span>
        {statusConfig.text && (
          <span className={cn("text-muted-foreground", isError && "text-accent")}>
            • {statusConfig.text}
          </span>
        )}
        {!statusConfig.spin && (toolCall.arguments_string || results) && (
          <ChevronRight className={cn("h-3 w-3 text-muted-foreground transition-transform ml-auto",
            expanded && "rotate-90")} />
        )}
      </button>

      {expanded && !statusConfig.spin && (
        <div className="mt-1.5 ml-3 pl-3 border-l-2 border-primary/30 space-y-2">
          {toolCall.arguments_string && (
            <div>
              <div className="text-xs text-muted-foreground mb-1">Parameters:</div>
              <pre className="bg-background rounded-md p-2 text-xs text-foreground/70 whitespace-pre-wrap">
                {(() => {
                  try { return JSON.stringify(JSON.parse(toolCall.arguments_string), null, 2); }
                  catch { return toolCall.arguments_string; }
                })()}
              </pre>
            </div>
          )}
          {parsedResults && (
            <div>
              <div className="text-xs text-muted-foreground mb-1">Result:</div>
              <pre className="bg-background rounded-md p-2 text-xs text-foreground/70 whitespace-pre-wrap max-h-48 overflow-auto">
                {typeof parsedResults === 'object' ? JSON.stringify(parsedResults, null, 2) : parsedResults}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default function MessageBubble({ message }) {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={cn("flex gap-3 group", isUser ? "justify-end" : "justify-start")}>
      {!isUser && (
        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/30 flex items-center justify-center mt-0.5 shrink-0">
          <span className="text-xs font-bold text-primary">M</span>
        </div>
      )}
      <div className={cn("max-w-[85%] min-w-0", isUser && "flex flex-col items-end")}>
        {message.content && (
          <div className={cn(
            "rounded-2xl px-4 py-3 relative",
            isUser
              ? "bg-gradient-to-r from-primary/20 to-primary/10 border border-primary/20 text-foreground"
              : "bg-card border border-border/50 text-foreground"
          )}>
            {isUser ? (
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
            ) : (
              <div className="chat-markdown">
                <ReactMarkdown
                  className="text-sm max-w-none"
                  components={{
                    code: ({ inline, className, children, ...props }) => {
                      const match = /language-(\w+)/.exec(className || '');
                      return !inline && match ? (
                        <div className="relative group/code">
                          <pre className="bg-background text-foreground/90 rounded-lg p-3 overflow-x-auto my-2 border border-border/50">
                            <code className={cn(className, "font-mono text-xs")} {...props}>{children}</code>
                          </pre>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover/code:opacity-100"
                            onClick={() => {
                              navigator.clipboard.writeText(String(children).replace(/\n$/, ''));
                              toast.success('Code copied');
                            }}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <code className="font-mono">{children}</code>
                      );
                    },
                    a: ({ children, ...props }) => (
                      <a {...props} target="_blank" rel="noopener noreferrer">{children}</a>
                    ),
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              </div>
            )}

            {!isUser && (
              <button
                onClick={handleCopy}
                className="absolute -bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity bg-card border border-border rounded-md p-1 hover:bg-secondary"
              >
                {copied ? <Check className="h-3 w-3 text-primary" /> : <Copy className="h-3 w-3 text-muted-foreground" />}
              </button>
            )}
          </div>
        )}

        {message.tool_calls?.length > 0 && (
          <div className="space-y-1 mt-1">
            {message.tool_calls.map((toolCall, idx) => (
              <FunctionDisplay key={idx} toolCall={toolCall} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}