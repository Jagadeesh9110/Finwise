import { motion } from "framer-motion";
import { Wallet, TrendingUp, PiggyBank, Trophy } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { IFinancialProfile } from "@/types";

interface Metric {
  icon: typeof Wallet;
  label: string;
  value: string;
  change: string;
  color: string;
  isPositive: boolean;
}

export function FinancialVitals() {
  const { user } = useAuth();
  const userId = user?.id || localStorage.getItem("userId");

  const { data: profile } = useQuery<IFinancialProfile>({
    queryKey: [`/api/financial-profiles`, userId],
    enabled: !!userId,
  });

  // Calculate metrics from profile data
  const calculateMetrics = (): Metric[] => {
    if (!profile) {
      return [
        {
          icon: Wallet,
          label: "Cash Flow",
          value: "₹0",
          change: "No data",
          color: "hsl(158 64% 52%)",
          isPositive: true,
        },
        {
          icon: TrendingUp,
          label: "Savings Rate",
          value: "0%",
          change: "No data",
          color: "hsl(221 83% 53%)",
          isPositive: true,
        },
        {
          icon: PiggyBank,
          label: "Total Savings",
          value: "₹0",
          change: "No data",
          color: "hsl(46 95% 53%)",
          isPositive: true,
        },
        {
          icon: Trophy,
          label: "Goals Progress",
          value: "0%",
          change: "No goals",
          color: "hsl(271 81% 56%)",
          isPositive: true,
        },
      ];
    }

    const monthlyIncome = profile.annual_income / 12;
    const monthlyExpenses = profile.monthly_expenses;
    const cashFlow = monthlyIncome - monthlyExpenses;
    const savingsRate = monthlyIncome > 0 ? ((cashFlow / monthlyIncome) * 100).toFixed(1) : "0";
    
    // Calculate goals progress
    let totalGoalTarget = 0;
    let totalGoalCurrent = 0;
    profile.goals?.forEach((goal) => {
      totalGoalTarget += goal.target || 0;
      totalGoalCurrent += goal.current || 0;
    });
    const goalsProgress = totalGoalTarget > 0 ? ((totalGoalCurrent / totalGoalTarget) * 100).toFixed(0) : "0";

    return [
      {
        icon: Wallet,
        label: "Cash Flow",
        value: `₹${cashFlow.toLocaleString('en-IN')}`,
        change: cashFlow > 0 ? "Positive cash flow" : "Negative cash flow",
        color: "hsl(158 64% 52%)",
        isPositive: cashFlow > 0,
      },
      {
        icon: TrendingUp,
        label: "Savings Rate",
        value: `${savingsRate}%`,
        change: parseFloat(savingsRate) > 20 ? "Above target" : "Below target",
        color: "hsl(221 83% 53%)",
        isPositive: parseFloat(savingsRate) > 20,
      },
      {
        icon: PiggyBank,
        label: "Total Savings",
        value: `₹${(profile.savings || 0).toLocaleString('en-IN')}`,
        change: "Current balance",
        color: "hsl(46 95% 53%)",
        isPositive: true,
      },
      {
        icon: Trophy,
        label: "Goals Progress",
        value: `${goalsProgress}%`,
        change: `${profile.goals?.filter((g) => (g.current / g.target) > 0.5).length || 0} goals on track`,
        color: "hsl(271 81% 56%)",
        isPositive: parseFloat(goalsProgress) > 50,
      },
    ];
  };

  const metrics = calculateMetrics();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {metrics.map((metric, index) => (
        <motion.div
          key={metric.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          data-testid={`vital-${metric.label.toLowerCase().replace(/\s/g, "-")}`}
        >
          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
            <div className="flex items-center justify-between mb-4">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${metric.color}20` }}
              >
                <metric.icon
                  className="w-5 h-5"
                  style={{ color: metric.color }}
                />
              </div>
              <span className="text-xs text-muted-foreground">
                {metric.label}
              </span>
            </div>
            <div className="space-y-1">
              <motion.div
                className="text-2xl font-bold"
                style={{ color: metric.color }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.2 + 0.5 }}
                data-testid={`value-${metric.label.toLowerCase().replace(/\s/g, "-")}`}
              >
                {metric.value}
              </motion.div>
              <div className="text-xs text-muted-foreground">
                {metric.change}
              </div>
            </div>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}