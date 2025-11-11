import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose
} from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge"; 
import { useQuery } from "@tanstack/react-query";
import { IAgentOutput } from "@/types";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Loader2 } from "lucide-react";
import { useLocation } from "wouter";

// Re-using the markdown styles from AICommandBar for consistency
const markdownComponents = {
  h1: ({children}: any) => <h1 className="text-xl font-bold mb-3 mt-4">{children}</h1>,
  h2: ({children}: any) => <h2 className="text-lg font-semibold mb-2 mt-3">{children}</h2>,
  p: ({children}: any) => <p className="leading-relaxed mb-3">{children}</p>,
  ul: ({children}: any) => <ul className="list-disc list-inside space-y-1 my-3 ml-4">{children}</ul>,
  ol: ({children}: any) => <ol className="list-decimal list-inside space-y-1 my-3 ml-4">{children}</ol>,
  li: ({children}: any) => <li className="leading-relaxed">{children}</li>,
  blockquote: ({children}: any) => <blockquote className="border-l-4 border-primary/30 pl-4 py-2 my-3 text-muted-foreground italic">{children}</blockquote>,
  code: ({inline, children}: any) => inline ? <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">{children}</code> : <code className="block bg-muted p-3 rounded text-xs font-mono overflow-x-auto my-3">{children}</code>,
  pre: ({children}: any) => <pre className="bg-muted p-3 rounded overflow-x-auto my-3">{children}</pre>,
};

interface InsightDetailModalProps {
  insightId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export function InsightDetailModal({ insightId, isOpen, onClose }: InsightDetailModalProps) {
  const [, navigate] = useLocation();

  const { data: insight, isLoading } = useQuery<IAgentOutput>({
    queryKey: [`/api/agent-outputs`, insightId], // Fetches /api/agent-outputs/:id
    enabled: !!insightId && isOpen,
  });

  const handleAction = () => {
    if (!insight?.outputData?.actionType) return;
    
    const actionType = insight.outputData.actionType;
    const actionRouteMap: Record<string, string> = {
      "invest": "/portfolio",
      "review_budget": "/scenarios",
      "start_learning": "/financial-story",
      "optimize_spending": "/scenarios",
      "manage_debt": "/scenarios",
      "increase_savings": "/scenarios",
      "review": "/dashboard"
    };
    const route = actionRouteMap[actionType] || "/dashboard";
    onClose(); 
    navigate(route);
  };

  const getActionText = (actionType: string | undefined) => {
    switch (actionType) {
      case "invest": return "View Portfolio";
      case "review_budget": return "Review Budget";
      case "start_learning": return "Start Learning";
      case "optimize_spending": return "Optimize Spending";
      case "manage_debt": return "Manage Debt";
      case "increase_savings": return "Increase Savings";
      default: return "Take Action";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] flex flex-col">
        {isLoading && (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}
        {!isLoading && insight && (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl">{insight.outputData.title}</DialogTitle>
              <DialogDescription>
                {insight.outputData.description}
              </DialogDescription>
              <div className="flex gap-2 pt-2">
                <Badge variant="outline">{insight.agentType}</Badge>
                {insight.priority && <Badge variant={insight.priority === 'high' ? 'destructive' : 'secondary'}>{insight.priority} priority</Badge>}
              </div>
            </DialogHeader>

            {/* This is where the long markdown "response" is rendered */}
            <div className="flex-1 overflow-y-auto pr-6 text-sm">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={markdownComponents}
              >
                {insight.outputData.response || "No detailed analysis available."}
              </ReactMarkdown>
            </div>

            <DialogFooter className="pt-4 border-t">
              <DialogClose asChild>
                <Button variant="outline">Close</Button>
              </DialogClose>
              {insight.actionable && insight.outputData.actionType && (
                <Button onClick={handleAction}>
                  {getActionText(insight.outputData.actionType)}
                </Button>
              )}
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}