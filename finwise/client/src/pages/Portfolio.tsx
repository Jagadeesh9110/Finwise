import { motion } from "framer-motion";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import {
  TrendingUp,
  TrendingDown,
  Plus,
  MoreHorizontal,
  Target,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

export default function Portfolio() {
  const performanceData = [
    { month: "Jan", value: 420000 },
    { month: "Feb", value: 435000 },
    { month: "Mar", value: 455000 },
    { month: "Apr", value: 448000 },
    { month: "May", value: 465000 },
    { month: "Jun", value: 485200 },
  ];

  const allocationData = [
    { name: "Equity", value: 60, amount: 291120, color: "hsl(158 64% 52%)" },
    { name: "Debt", value: 25, amount: 121300, color: "hsl(221 83% 53%)" },
    { name: "Gold", value: 10, amount: 48520, color: "hsl(46 95% 53%)" },
    { name: "Cash", value: 5, amount: 24260, color: "hsl(0 84% 60%)" },
  ];

  const holdings = [
    {
      name: "HDFC Index Fund",
      type: "Equity",
      amount: 120000,
      returns: 8.2,
      change: 2.1,
    },
    {
      name: "SBI Small Cap Fund",
      type: "Equity",
      amount: 85000,
      returns: 15.7,
      change: -0.8,
    },
    {
      name: "ICICI Debt Fund",
      type: "Debt",
      amount: 75000,
      returns: 6.8,
      change: 0.3,
    },
    {
      name: "Gold ETF",
      type: "Commodity",
      amount: 45000,
      returns: 4.2,
      change: 1.2,
    },
    {
      name: "Liquid Fund",
      type: "Cash",
      amount: 25000,
      returns: 3.5,
      change: 0.1,
    },
  ];

  return (
    <div className="flex-1 p-6 overflow-auto" data-testid="portfolio-page">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-6xl mx-auto"
      >
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Investment Portfolio</h1>
            <p className="text-muted-foreground">
              Monitor and optimize your investment strategy
            </p>
          </div>
          <Button
            className="bg-primary text-primary-foreground"
            data-testid="button-add-investment"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Investment
          </Button>
        </div>

        {/* Portfolio Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Total Value</span>
              <TrendingUp className="w-4 h-4 text-chart-1" />
            </div>
            <motion.div
              className="text-3xl font-bold text-chart-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              ₹4,85,200
            </motion.div>
            <div className="text-sm text-muted-foreground mt-1">
              +₹12,400 today
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">
                Total Returns
              </span>
              <TrendingUp className="w-4 h-4 text-chart-1" />
            </div>
            <motion.div
              className="text-3xl font-bold text-chart-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              +12.5%
            </motion.div>
            <div className="text-sm text-muted-foreground mt-1">This year</div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Monthly SIP</span>
              <Target className="w-4 h-4 text-chart-2" />
            </div>
            <motion.div
              className="text-3xl font-bold text-chart-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
            >
              ₹15,000
            </motion.div>
            <div className="text-sm text-muted-foreground mt-1">
              Auto-invested
            </div>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid grid-cols-4 w-full max-w-lg">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="holdings">Holdings</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="analysis">Analysis</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Asset Allocation */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-6">Asset Allocation</h3>
                <div className="h-64 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={allocationData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                      >
                        {allocationData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  {allocationData.map((item) => (
                    <div
                      key={item.name}
                      className="flex items-center space-x-2"
                    >
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <div className="text-sm">
                        <span className="font-medium">{item.name}</span>
                        <span className="text-muted-foreground ml-1">
                          ({item.value}%)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Performance Chart */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-6">
                  Portfolio Performance
                </h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={performanceData}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="hsl(217 32% 17%)"
                      />
                      <XAxis dataKey="month" stroke="hsl(215 20% 65%)" />
                      <YAxis stroke="hsl(215 20% 65%)" />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke="hsl(158 64% 52%)"
                        strokeWidth={3}
                        dot={{ fill: "hsl(158 64% 52%)", strokeWidth: 2, r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="holdings" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Your Holdings</h3>
              <Button variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Holding
              </Button>
            </div>

            <div className="space-y-3">
              {holdings.map((holding, index) => (
                <motion.div
                  key={holding.name}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  data-testid={`holding-detail-${holding.name
                    .toLowerCase()
                    .replace(/\s/g, "-")}`}
                >
                  <Card className="p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold">{holding.name}</h4>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-sm text-muted-foreground">
                              {holding.type}
                            </div>
                            <div className="font-medium">
                              ₹{holding.amount.toLocaleString()}
                            </div>
                          </div>
                          <div className="text-right">
                            <div
                              className={`font-medium ${
                                holding.returns > 0
                                  ? "text-chart-1"
                                  : "text-chart-4"
                              }`}
                            >
                              {holding.returns > 0 ? "+" : ""}
                              {holding.returns}%
                            </div>
                            <div
                              className={`text-sm flex items-center ${
                                holding.change > 0
                                  ? "text-chart-1"
                                  : "text-chart-4"
                              }`}
                            >
                              {holding.change > 0 ? (
                                <TrendingUp className="w-3 h-3 mr-1" />
                              ) : (
                                <TrendingDown className="w-3 h-3 mr-1" />
                              )}
                              {holding.change > 0 ? "+" : ""}
                              {holding.change}%
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="performance">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-6">
                Performance Analytics
              </h3>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={performanceData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="hsl(217 32% 17%)"
                    />
                    <XAxis dataKey="month" stroke="hsl(215 20% 65%)" />
                    <YAxis stroke="hsl(215 20% 65%)" />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="hsl(158 64% 52%)"
                      strokeWidth={3}
                      dot={{ fill: "hsl(158 64% 52%)", strokeWidth: 2, r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="analysis">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-6">
                AI Portfolio Analysis
              </h3>
              <div className="space-y-4">
                <div className="bg-accent rounded-lg p-4">
                  <h4 className="font-medium mb-2">Risk Assessment</h4>
                  <p className="text-sm text-muted-foreground">
                    Your portfolio has a moderate risk profile with good
                    diversification. Consider increasing debt allocation for
                    better stability.
                  </p>
                </div>
                <div className="bg-accent rounded-lg p-4">
                  <h4 className="font-medium mb-2">Rebalancing Suggestion</h4>
                  <p className="text-sm text-muted-foreground">
                    Your equity allocation is slightly high. Consider moving 5%
                    to debt funds to maintain your target allocation.
                  </p>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}
