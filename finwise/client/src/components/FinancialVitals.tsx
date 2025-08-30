import { motion } from "framer-motion";
import { Wallet, TrendingUp, PiggyBank, Trophy } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { useQuery } from "@tanstack/react-query";

interface Metric {
  icon: typeof Wallet;
  label: string;
  value: string;
  change: string;
  color: string;
  isPositive: boolean;
}

export function FinancialVitals() {
  const { data: profile } = useQuery({
    queryKey: ["/api/financial-profiles/sample-user-1"],
  });

  const metrics: Metric[] = [
    {
      icon: Wallet,
      label: "Cash Flow",
      value: "₹45,200",
      change: "+12% from last month",
      color: "hsl(158 64% 52%)",
      isPositive: true,
    },
    {
      icon: TrendingUp,
      label: "Savings Rate",
      value: "28%",
      change: "Above target",
      color: "hsl(221 83% 53%)",
      isPositive: true,
    },
    {
      icon: PiggyBank,
      label: "Total Savings",
      value: "₹3,24,500",
      change: "+₹8,200 this month",
      color: "hsl(46 95% 53%)",
      isPositive: true,
    },
    {
      icon: Trophy,
      label: "Goals Progress",
      value: "73%",
      change: "2 goals on track",
      color: "hsl(271 81% 56%)",
      isPositive: true,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {metrics.map((metric, index) => (
        <motion.div
          key={metric.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          data-testid={`vital-${metric.label
            .toLowerCase()
            .replace(/\s/g, "-")}`}
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
                data-testid={`value-${metric.label
                  .toLowerCase()
                  .replace(/\s/g, "-")}`}
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
