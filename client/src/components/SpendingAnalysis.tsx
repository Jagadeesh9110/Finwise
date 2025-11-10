import { motion } from "framer-motion";
import { Card } from "@/components/ui/Card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { Utensils, Car, Film, ShoppingBag } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { IFinancialProfile } from "@/types";

interface SpendingCategory {
  name: string;
  amount: number;
  percentage: number;
  icon: typeof Utensils;
  color: string;
  budgetUsed: number;
}

export function SpendingAnalysis() {
  const { user } = useAuth();
  const userId = user?.id || localStorage.getItem("userId");

  const { data: profile } = useQuery<IFinancialProfile>({
    queryKey: [`/api/financial-profiles/${userId}`],
    enabled: !!userId,
  });

  // Calculate spending from transactions
  const calculateSpending = () => {
    if (!profile?.transactions) return { total: 0, categories: [] };

    const expenses = profile.transactions.filter(t => t.type === 'expense');
    const total = expenses.reduce((sum, t) => sum + Math.abs(t.amount), 0);
    
    // Group by category
    const categoryMap = new Map<string, number>();
    expenses.forEach(t => {
      const current = categoryMap.get(t.category) || 0;
      categoryMap.set(t.category, current + Math.abs(t.amount));
    });

    return { total, categoryMap };
  };

  const spending = calculateSpending();
  const totalSpending = spending.total || 42800; // Fallback to default
  const spendingChange = 8;

  const categories: SpendingCategory[] = [
    {
      name: "Food & Dining",
      amount: 12500,
      percentage: 29,
      icon: Utensils,
      color: "hsl(158 64% 52%)",
      budgetUsed: 78,
    },
    {
      name: "Transportation",
      amount: 8900,
      percentage: 21,
      icon: Car,
      color: "hsl(221 83% 53%)",
      budgetUsed: 65,
    },
    {
      name: "Entertainment",
      amount: 6200,
      percentage: 14,
      icon: Film,
      color: "hsl(46 95% 53%)",
      budgetUsed: 45,
    },
    {
      name: "Shopping",
      amount: 15200,
      percentage: 36,
      icon: ShoppingBag,
      color: "hsl(0 84% 60%)",
      budgetUsed: 95,
    },
  ];

  return (
    <Card className="p-6" data-testid="spending-analysis">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">Spending Analysis</h3>
        <Select defaultValue="this-month">
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="this-month">This Month</SelectItem>
            <SelectItem value="last-month">Last Month</SelectItem>
            <SelectItem value="last-3-months">Last 3 Months</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Total Spending */}
      <div className="chart-container rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <motion.div
              className="text-2xl font-bold"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              ₹{totalSpending.toLocaleString()}
            </motion.div>
            <div className="text-sm text-muted-foreground">Total Spending</div>
          </div>
          <div className="text-right">
            <motion.div
              className="text-lg font-semibold text-chart-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              +{spendingChange}%
            </motion.div>
            <div className="text-xs text-muted-foreground">vs last month</div>
          </div>
        </div>
      </div>

      {/* Spending Categories */}
      <div className="space-y-3">
        {categories.map((category, index) => (
          <motion.div
            key={category.name}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 + 0.7 }}
            className="flex justify-between items-center p-3 bg-accent rounded-lg hover:bg-accent/80 transition-colors cursor-pointer"
            whileHover={{ scale: 1.02 }}
            data-testid={`category-${category.name.toLowerCase().replace(/\s/g, "-")}`}
          >
            <div className="flex items-center space-x-3">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${category.color}20` }}
              >
                <category.icon
                  className="w-4 h-4"
                  style={{ color: category.color }}
                />
              </div>
              <div>
                <div className="font-medium text-sm">{category.name}</div>
                <div className="text-xs text-muted-foreground">
                  ₹{category.amount.toLocaleString()} • {category.percentage}%
                </div>
              </div>
            </div>
            <div className="w-16 bg-muted rounded-full h-2">
              <motion.div
                className="h-2 rounded-full"
                style={{ backgroundColor: category.color }}
                initial={{ width: 0 }}
                animate={{ width: `${category.budgetUsed}%` }}
                transition={{ delay: index * 0.2 + 1, duration: 1 }}
              />
            </div>
          </motion.div>
        ))}
      </div>
    </Card>
  );
}