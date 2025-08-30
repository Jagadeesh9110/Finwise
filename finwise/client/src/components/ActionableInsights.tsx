import { motion } from "framer-motion";
import { Star, BarChart3, GraduationCap } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useQuery } from "@tanstack/react-query";
import { AgentOutput } from "@shared/schema";

export function ActionableInsights() {
  const { data: insights = [] } = useQuery<AgentOutput[]>({
    queryKey: ["/api/agent-outputs/sample-user-1"],
  });

  const getInsightIcon = (agentType: string) => {
    switch (agentType) {
      case "master":
        return Star;
      case "budget":
        return BarChart3;
      case "education":
        return GraduationCap;
      default:
        return Star;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "hsl(158 64% 52%)";
      case "medium":
        return "hsl(46 95% 53%)";
      case "low":
        return "hsl(221 83% 53%)";
      default:
        return "hsl(158 64% 52%)";
    }
  };

  const handleAction = (actionType: string) => {
    // TODO: Implement action handlers
    console.log("Handling action:", actionType);
  };

  return (
    <div className="lg:col-span-2">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">AI-Generated Insights</h3>
          <Button
            variant="ghost"
            className="text-primary hover:text-primary/80 text-sm font-medium"
          >
            View All
          </Button>
        </div>

        <div className="space-y-4" data-testid="insights-container">
          {insights.map((insight, index) => {
            const Icon = getInsightIcon(insight.agentType);
            const color = getPriorityColor(insight.priority || "medium");
            const isHighPriority = insight.priority === "high";

            return (
              <motion.div
                key={insight.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`rounded-lg p-4 ${
                  isHighPriority
                    ? "bg-primary/10 border border-primary/30"
                    : "bg-accent"
                }`}
                data-testid={`insight-${insight.id}`}
              >
                <div className="flex items-start space-x-3">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: color }}
                  >
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-sm mb-1">
                      {(insight.outputData as any)?.title || "No title"}
                    </div>
                    <div className="text-sm text-muted-foreground mb-3">
                      {(insight.outputData as any)?.description ||
                        "No description"}
                    </div>
                    {insight.actionable && (
                      <Button
                        size="sm"
                        onClick={() =>
                          handleAction(
                            (insight.outputData as any)?.action || "default"
                          )
                        }
                        style={{ backgroundColor: color }}
                        className="text-white hover:opacity-90"
                        data-testid={`button-${
                          (insight.outputData as any)?.action || "default"
                        }`}
                      >
                        {(insight.outputData as any)?.action === "invest"
                          ? "Invest Now"
                          : (insight.outputData as any)?.action ===
                            "review_budget"
                          ? "Review Budget"
                          : (insight.outputData as any)?.action ===
                            "start_learning"
                          ? "Start Learning"
                          : "Take Action"}
                      </Button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
