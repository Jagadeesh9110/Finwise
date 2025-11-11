import { useState } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { Calculator, TrendingDown, TrendingUp, Target } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export default function Scenarios() {
  const [scenarioType, setScenarioType] = useState("expense");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [results, setResults] = useState<any>(null);

  const scenarioMutation = useMutation({
    mutationFn: async (params: any) => {
      const res = await apiRequest("POST", "/api/scenarios/what-if", {
        userId: "sample-user-1",
        parameters: params,
      });
      return res.json();
    },
    onSuccess: (data) => {
      setResults(data);
    },
  });

  const handleCalculate = () => {
    if (!amount) return;

    scenarioMutation.mutate({
      type: scenarioType,
      expense: scenarioType === "expense" ? parseInt(amount) : 0,
      income: scenarioType === "income" ? parseInt(amount) : 0,
      description,
    });
  };

  const scenarioTypes = [
    { value: "expense", label: "New Expense", icon: TrendingDown },
    { value: "income", label: "Income Change", icon: TrendingUp },
    { value: "investment", label: "Investment Plan", icon: Target },
  ];

  return (
    <div className="flex-1 p-6 overflow-auto" data-testid="scenarios-page">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">What-If Scenarios</h1>
          <p className="text-muted-foreground">
            Explore different financial scenarios and see their impact on your
            goals
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Scenario Input */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-6 flex items-center">
              <Calculator className="w-5 h-5 mr-2 text-primary" />
              Scenario Builder
            </h3>

            <div className="space-y-6">
              <div>
                <Label className="text-sm font-medium mb-2 block">
                  Scenario Type
                </Label>
                <Select value={scenarioType} onValueChange={setScenarioType}>
                  <SelectTrigger data-testid="select-scenario-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {scenarioTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center space-x-2">
                          <type.icon className="w-4 h-4" />
                          <span>{type.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm font-medium mb-2 block">
                  Amount (₹)
                </Label>
                <Input
                  type="number"
                  placeholder="Enter amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  data-testid="input-scenario-amount"
                />
              </div>

              <div>
                <Label className="text-sm font-medium mb-2 block">
                  Description
                </Label>
                <Input
                  placeholder="e.g., New smartphone, vacation, salary increase"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  data-testid="input-scenario-description"
                />
              </div>

              <Button
                onClick={handleCalculate}
                disabled={!amount || scenarioMutation.isPending}
                className="w-full"
                data-testid="button-calculate-scenario"
              >
                {scenarioMutation.isPending
                  ? "Analyzing..."
                  : "Calculate Impact"}
              </Button>
            </div>
          </Card>

          {/* Results */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-6">Impact Analysis</h3>

            {scenarioMutation.isPending && (
              <motion.div
                className="text-center py-8"
                animate={{ opacity: [1, 0.5, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                <div className="text-muted-foreground">
                  AI agents are processing your scenario...
                </div>
              </motion.div>
            )}

            {results && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-6"
                data-testid="scenario-results-detailed"
              >
                {/* Key Metrics */}
                <div className="grid grid-cols-1 gap-4">
                  <div className="bg-accent rounded-lg p-4">
                    <div className="text-sm text-muted-foreground mb-1">
                      Budget Impact
                    </div>
                    <div className="text-xl font-bold">
                      ₹{results.newBudget?.toLocaleString() || "0"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      from ₹{results.originalBudget?.toLocaleString() || "0"}
                    </div>
                  </div>

                  <div className="bg-accent rounded-lg p-4">
                    <div className="text-sm text-muted-foreground mb-1">
                      Savings Impact
                    </div>
                    <div
                      className={`text-xl font-bold ${
                        results.savingsImpact < 0
                          ? "text-chart-4"
                          : "text-chart-1"
                      }`}
                    >
                      {results.savingsImpact < 0 ? "−" : "+"}₹
                      {Math.abs(results.savingsImpact || 0).toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Monthly change
                    </div>
                  </div>

                  <div className="bg-accent rounded-lg p-4">
                    <div className="text-sm text-muted-foreground mb-1">
                      Goal Timeline
                    </div>
                    <div className="text-xl font-bold text-chart-4">
                      +{results.goalDelay || 0} months
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Additional delay
                    </div>
                  </div>
                </div>

                {/* Suggested Adjustments */}
                {results.adjustments && results.adjustments.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-3">Suggested Adjustments</h4>
                    <div className="space-y-2">
                      {results.adjustments.map(
                        (adjustment: any, index: number) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="flex items-center justify-between p-3 bg-accent rounded-lg"
                          >
                            <span className="text-sm">
                              {adjustment.category}
                            </span>
                            <span className="text-sm font-medium text-chart-4">
                              −₹{adjustment.reduction.toLocaleString()}
                            </span>
                          </motion.div>
                        )
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {!results && !scenarioMutation.isPending && (
              <div className="text-center py-8 text-muted-foreground">
                Enter a scenario above to see the impact analysis
              </div>
            )}
          </Card>
        </div>
      </motion.div>
    </div>
  );
}
