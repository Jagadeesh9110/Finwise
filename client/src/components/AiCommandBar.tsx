import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wand2, Send, X, Copy, CheckCircle } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useMutation } from "@tanstack/react-query";
import { processAICommand } from "@/lib/apiClient";
import { useToast } from "@/hooks/useToast";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface AICommandBarProps {
  onCommand?: (command: string) => void;
}

interface AIResponse {
  response: string;
  analysis_type?: string;
  agents_involved?: string[];
  timestamp: Date;
}

export function AICommandBar({ onCommand }: AICommandBarProps) {
  const [command, setCommand] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [aiResponse, setAiResponse] = useState<AIResponse | null>(null);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const suggestions = [
    "Show me my spending pattern this month",
    "Can I afford a vacation worth ₹1,00,000?",
    "Optimize my investment portfolio",
    "What if I buy a new phone for ₹50,000?",
    "How can I reduce my monthly expenses?",
  ];

  const processCommandMutation = useMutation({
    mutationFn: async (command: string) => {
      return await processAICommand(command);
    },
    onSuccess: (data) => {
      setAiResponse({
        response: data.response || "Analysis complete",
        analysis_type: data.analysis_type,
        agents_involved: data.agents_involved,
        timestamp: new Date()
      });
      onCommand?.(command);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to process command. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (command.trim()) {
      processCommandMutation.mutate(command);
      setCommand("");
      setShowSuggestions(false);
    } else {
      setAiResponse(null);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setCommand(suggestion);
    setShowSuggestions(false);
  };

  const handleClearResponse = () => {
    setAiResponse(null);
  };

  const handleCopyResponse = () => {
    if (aiResponse?.response) {
      navigator.clipboard.writeText(aiResponse.response);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Custom components for ReactMarkdown to ensure consistent styling
  const markdownComponents = {
    h1: ({children}: any) => (
      <h1 className="text-xl font-bold text-foreground mb-3 mt-4">{children}</h1>
    ),
    h2: ({children}: any) => (
      <h2 className="text-lg font-semibold text-foreground mb-2 mt-3">{children}</h2>
    ),
    h3: ({children}: any) => (
      <h3 className="text-base font-semibold text-foreground mb-2 mt-3">{children}</h3>
    ),
    p: ({children}: any) => (
      <p className="text-sm text-foreground leading-relaxed mb-3">{children}</p>
    ),
    ul: ({children}: any) => (
      <ul className="list-disc list-inside space-y-1 my-3 ml-4 text-foreground">{children}</ul>
    ),
    ol: ({children}: any) => (
      <ol className="list-decimal list-inside space-y-1 my-3 ml-4 text-foreground">{children}</ol>
    ),
    li: ({children}: any) => (
      <li className="text-sm text-foreground leading-relaxed">{children}</li>
    ),
    strong: ({children}: any) => (
      <strong className="font-semibold text-foreground">{children}</strong>
    ),
    em: ({children}: any) => (
      <em className="italic text-foreground">{children}</em>
    ),
    blockquote: ({children}: any) => (
      <blockquote className="border-l-4 border-primary/30 pl-4 py-2 my-3 text-muted-foreground italic">
        {children}
      </blockquote>
    ),
    code: ({inline, className, children}: any) => {
      return inline ? (
        <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono text-foreground">
          {children}
        </code>
      ) : (
        <code className="block bg-muted p-3 rounded text-xs font-mono text-foreground overflow-x-auto my-3">
          {children}
        </code>
      );
    },
    pre: ({children}: any) => (
      <pre className="bg-muted p-3 rounded overflow-x-auto my-3">{children}</pre>
    ),
    hr: () => <hr className="border-t border-border my-4" />,
    a: ({href, children}: any) => (
      <a 
        href={href} 
        target="_blank" 
        rel="noopener noreferrer" 
        className="text-primary hover:text-primary/80 underline"
      >
        {children}
      </a>
    ),
    table: ({children}: any) => (
      <div className="overflow-x-auto my-4">
        <table className="min-w-full divide-y divide-border">
          {children}
        </table>
      </div>
    ),
    thead: ({children}: any) => (
      <thead className="bg-muted">{children}</thead>
    ),
    tbody: ({children}: any) => (
      <tbody className="divide-y divide-border">{children}</tbody>
    ),
    tr: ({children}: any) => <tr>{children}</tr>,
    th: ({children}: any) => (
      <th className="px-3 py-2 text-left text-xs font-medium text-foreground uppercase tracking-wider">
        {children}
      </th>
    ),
    td: ({children}: any) => (
      <td className="px-3 py-2 text-sm text-foreground whitespace-nowrap">
        {children}
      </td>
    ),
  };

  return (
    <div className="relative">
      {/* Command Input Bar */}
      <motion.div
        className="relative"
        whileHover={{ scale: 1.01 }}
        transition={{ type: "spring", stiffness: 300 }}
        data-testid="ai-command-bar"
      >
        <div className="gradient-border rounded-lg p-1">
          <form
            onSubmit={handleSubmit}
            className="flex items-center bg-background rounded-md p-3"
          >
            <div className="flex items-center space-x-3 flex-1">
              <motion.div
                className="w-8 h-8 bg-primary rounded-full flex items-center justify-center"
                animate={processCommandMutation.isPending ? {
                  opacity: [1, 0.5, 1],
                } : {}}
                transition={{ duration: 1.5, repeat: Infinity }}
                data-testid="ai-thinking-indicator"
              >
                <Wand2 className="w-4 h-4 text-primary-foreground" />
              </motion.div>
              <Input
                type="text"
                placeholder="Ask me anything about your finances... (e.g., 'What if I buy a new phone for ₹50,000?')"
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                className="flex-1 bg-transparent border-none outline-none focus-visible:ring-0"
                data-testid="input-ai-command"
              />
              <Button
                type="submit"
                className="bg-primary text-primary-foreground hover:opacity-90"
                disabled={processCommandMutation.isPending}
                data-testid="button-submit-command"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </form>
        </div>
      </motion.div>

      {/* AI Response Section - Expandable */}
      <AnimatePresence>
        {(processCommandMutation.isPending || aiResponse) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="mt-4 overflow-hidden"
          >
            <Card className="p-4 bg-accent/50 border-accent">
              {/* Loading State */}
              {processCommandMutation.isPending && (
                <div className="flex items-center space-x-3">
                  <div className="flex space-x-1">
                    <motion.div
                      className="w-2 h-2 bg-primary rounded-full"
                      animate={{ y: [0, -10, 0] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                    />
                    <motion.div
                      className="w-2 h-2 bg-primary rounded-full"
                      animate={{ y: [0, -10, 0] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                    />
                    <motion.div
                      className="w-2 h-2 bg-primary rounded-full"
                      animate={{ y: [0, -10, 0] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                    />
                  </div>
                  <span className="text-sm text-muted-foreground">
                    AI agents are analyzing your request...
                  </span>
                </div>
              )}

              {/* AI Response */}
              {!processCommandMutation.isPending && aiResponse && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  {/* Response Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                        <Wand2 className="w-4 h-4 text-primary-foreground" />
                      </div>
                      <div>
                        <p className="text-xs font-medium">AI Financial Assistant</p>
                        {aiResponse.agents_involved && aiResponse.agents_involved.length > 0 && (
                          <p className="text-xs text-muted-foreground">
                            via {aiResponse.agents_involved.join(", ")}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCopyResponse}
                        className="h-8 w-8 p-0"
                        title="Copy response"
                      >
                        {copied ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleClearResponse}
                        className="h-8 w-8 p-0"
                        title="Clear response"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Response Content with Markdown Rendering */}
                  <div className="prose prose-sm dark:prose-invert max-w-none 
                    prose-headings:font-bold 
                    prose-p:leading-relaxed 
                    prose-a:text-primary hover:prose-a:text-primary/80
                    prose-code:text-xs
                    prose-pre:bg-muted
                    prose-blockquote:border-l-primary
                    [&>*]:text-foreground
                    [&_strong]:text-foreground
                    [&_em]:text-foreground
                    [&_code]:text-foreground">
                    <ReactMarkdown 
                      remarkPlugins={[remarkGfm]}
                      components={markdownComponents}
                    >
                      {aiResponse.response}
                    </ReactMarkdown>
                  </div>

                  {/* Response Footer */}
                  {aiResponse.analysis_type && (
                    <div className="mt-4 pt-3 border-t border-border">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Analysis type: {aiResponse.analysis_type.replace(/_/g, " ")}</span>
                        <span>{new Date(aiResponse.timestamp).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI Suggestions Dropdown */}
      {showSuggestions && !processCommandMutation.isPending && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="absolute top-full left-0 right-0 mt-2 z-10"
          data-testid="ai-suggestions"
        >
          <Card className="p-3">
            <div className="text-xs text-muted-foreground mb-2">
              Quick suggestions:
            </div>
            <div className="space-y-1">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full text-left p-2 hover:bg-accent rounded text-sm transition-colors"
                  data-testid={`suggestion-${index}`}
                >
                  "{suggestion}"
                </button>
              ))}
            </div>
          </Card>
        </motion.div>
      )}
    </div>
  );
}