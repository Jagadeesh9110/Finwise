import { motion } from "framer-motion";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { TrendingUp } from "lucide-react";

interface Holding {
  name: string;
  category: string;
  value: number;
  returns: number;
}

export function InvestmentPortfolio() {
  const totalValue = 485200;
  const totalReturns = 12.5;

  const allocations = [
    { name: "Equity", percentage: 60, color: "hsl(158 64% 52%)" },
    { name: "Debt", percentage: 25, color: "hsl(221 83% 53%)" },
    { name: "Gold", percentage: 10, color: "hsl(46 95% 53%)" },
    { name: "Cash", percentage: 5, color: "hsl(0 84% 60%)" },
  ];

  const holdings: Holding[] = [
    {
      name: "HDFC Index Fund",
      category: "Large Cap",
      value: 120000,
      returns: 8.2,
    },
    {
      name: "SBI Small Cap Fund",
      category: "Small Cap",
      value: 85000,
      returns: 15.7,
    },
    { name: "ICICI Debt Fund", category: "Debt", value: 75000, returns: 6.8 },
    { name: "Gold ETF", category: "Commodity", value: 45000, returns: 4.2 },
  ];

  return (
    <Card className="p-6" data-testid="investment-portfolio">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">Investment Portfolio</h3>
        <Button
          variant="ghost"
          className="text-primary hover:text-primary/80 text-sm font-medium"
        >
          Manage
        </Button>
      </div>

      {/* Portfolio Summary */}
      <div className="chart-container rounded-lg p-4 mb-6 relative overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <div>
            <motion.div
              className="text-2xl font-bold text-chart-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              ₹{totalValue.toLocaleString()}
            </motion.div>
            <div className="text-sm text-muted-foreground">
              Total Portfolio Value
            </div>
          </div>
          <div className="text-right">
            <motion.div
              className="text-lg font-semibold text-chart-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
            >
              +{totalReturns}%
            </motion.div>
            <div className="text-xs text-muted-foreground">This year</div>
          </div>
        </div>

        {/* Portfolio Allocation */}
        <div className="grid grid-cols-2 gap-4">
          {allocations.map((allocation, index) => (
            <motion.div
              key={allocation.name}
              className="space-y-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 + 1 }}
              data-testid={`allocation-${allocation.name.toLowerCase()}`}
            >
              <div className="flex items-center space-x-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: allocation.color }}
                />
                <span className="text-sm">
                  {allocation.name} ({allocation.percentage}%)
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Top Holdings */}
      <div className="space-y-3">
        <div className="text-sm font-medium text-muted-foreground">
          Top Holdings
        </div>
        <div className="space-y-2">
          {holdings.map((holding, index) => (
            <motion.div
              key={holding.name}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 + 1.5 }}
              className="flex justify-between items-center p-2 hover:bg-accent rounded transition-colors cursor-pointer"
              whileHover={{ scale: 1.02 }}
              data-testid={`holding-${holding.name
                .toLowerCase()
                .replace(/\s/g, "-")}`}
            >
              <div>
                <div className="font-medium text-sm">{holding.name}</div>
                <div className="text-xs text-muted-foreground">
                  {holding.category} • ₹{holding.value.toLocaleString()}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-chart-1">
                  +{holding.returns}%
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </Card>
  );
}
