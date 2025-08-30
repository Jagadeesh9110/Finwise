import { useState } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/input";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface ScenarioResults {
  originalBudget: number;
  newBudget: number;
  savingsImpact: number;
  goalDelay: number;
  adjustments: Array<{ category: string; reduction: number }>;
}

export function ScenarioWidget() {
  const [amount, setAmount] = useState("");
  const [results, setResults] = useState<ScenarioResults | null>(null);

  const scenarioMutation = useMutation({
    mutationFn: async (expense: number) => {
      const res = await apiRequest("POST", "/api/scenarios/what-if", {
        userId: "sample-user-1",
        parameters: { expense },
      });
      return res.json();
    },
    onSuccess: (data) => {
      setResults(data);
    },
  });

  const handleCalculate = () => {
    const expense = parseInt(amount);
    if (expense > 0) {
      scenarioMutation.mutate(expense);
    }
  };

  return (
    <Card className="p-6" data-testid="scenario-widget">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">Quick Scenario</h3>
        <Button
          variant="ghost"
          className="text-primary hover:text-primary/80 text-sm font-medium"
        >
          Full View
        </Button>
      </div>

      <div className="space-y-4">
        <div className="flex space-x-2">
          <Input
            type="number"
            placeholder="Enter amount (₹)"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="flex-1"
            data-testid="input-scenario-amount"
          />
          <Button
            onClick={handleCalculate}
            disabled={scenarioMutation.isPending}
            data-testid="button-calculate-scenario"
          >
            Calculate
          </Button>
        </div>

        {scenarioMutation.isPending && (
          <motion.div
            className="text-sm text-muted-foreground"
            animate={{ opacity: [1, 0.5, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          >
            AI agents are analyzing your scenario...
          </motion.div>
        )}

        {results && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
            data-testid="scenario-results"
          >
            <div className="text-sm text-muted-foreground">
              If I spend ₹{amount}:
            </div>

            <div className="space-y-3">
              <motion.div
                className="flex justify-between items-center p-3 bg-accent rounded-lg"
                whileHover={{ scale: 1.02 }}
              >
                <span className="text-sm">Remaining Budget</span>
                <span className="font-medium text-chart-3">
                  ₹{results.newBudget.toLocaleString()}
                </span>
              </motion.div>
              <motion.div
                className="flex justify-between items-center p-3 bg-accent rounded-lg"
                whileHover={{ scale: 1.02 }}
              >
                <span className="text-sm">Savings Impact</span>
                <span className="font-medium text-chart-4">
                  ₹{results.savingsImpact.toLocaleString()}
                </span>
              </motion.div>
              <motion.div
                className="flex justify-between items-center p-3 bg-accent rounded-lg"
                whileHover={{ scale: 1.02 }}
              >
                <span className="text-sm">Goal Delay</span>
                <span className="font-medium text-chart-4">
                  +{results.goalDelay} months
                </span>
              </motion.div>
            </div>

            {results.adjustments.length > 0 && (
              <div className="border-t border-border pt-4">
                <div className="text-xs text-muted-foreground mb-2">
                  Suggested adjustments:
                </div>
                <div className="space-y-2">
                  {results.adjustments.map((adjustment, index) => (
                    <div
                      key={index}
                      className="flex items-center space-x-2 text-sm"
                    >
                      <span className="text-chart-4">−</span>
                      <span>
                        {adjustment.category}: -₹
                        {adjustment.reduction.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </Card>
  );
}
