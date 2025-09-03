import { useState } from "react";
import { motion } from "framer-motion";
import { Wand2, Send } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/useToast";

interface AICommandBarProps {
  onCommand?: (command: string) => void;
}

export function AICommandBar({ onCommand }: AICommandBarProps) {
  const [command, setCommand] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
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
      const res = await apiRequest("POST", "/api/ai/process-command", {
        command,
        userId: "sample-user-1", // TODO: Get from auth context
      });
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "AI Response",
        description: data.response,
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
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setCommand(suggestion);
    setShowSuggestions(false);
  };

  return (
    <div className="relative">
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
                animate={{
                  opacity: [1, 0.5, 1],
                }}
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

      {/* AI Suggestions Dropdown */}
      {showSuggestions && (
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
