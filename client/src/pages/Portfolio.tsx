import { useState, useMemo } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/Dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import {
  TrendingUp,
  TrendingDown,
  Plus,
  MoreHorizontal,
  Target,
  Loader2,
  Wand2, // For AI Analysis tab
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
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/useToast";
import { apiClient } from "@/lib/apiClient";
import { queryClient } from "@/lib/queryClient";
import { IFinancialProfile, ITransaction, IAgentOutput } from "@/types";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
};

export default function Portfolio() {
  const { user } = useAuth();
  const userId = user?.id || localStorage.getItem("userId");
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newInvestment, setNewInvestment] = useState({
    name: "",
    type: "Equity", 
    amount: 0,
    date: new Date().toISOString().split('T')[0], // Add date field
  });

  // Query 1: Get the user's financial profile (for transactions)
  const { data: profile, isLoading: isLoadingProfile } = useQuery<IFinancialProfile>({
    queryKey: [`/api/financial-profiles`, userId],
    enabled: !!userId,
  });

  // Query 2: Get AI insights for the 'Analysis' tab
  const { data: insights, isLoading: isLoadingInsights } = useQuery<IAgentOutput[]>({
    queryKey: [`/api/agent-outputs/user`, userId],
    enabled: !!userId,
  });

  const addInvestmentMutation = useMutation({
    mutationFn: async (investment: typeof newInvestment) => {

      return await apiClient<IFinancialProfile>(
        `/financial-profiles/${userId}/investments`, 
        {
          method: "POST",
          body: JSON.stringify({
            name: investment.name,
            type: investment.type, 
            amount: investment.amount,
            date: investment.date,
          }),
        }
      );
    },
    onSuccess: () => {
      toast({
        title: "Investment Added",
        description: "Your investment has been recorded successfully.",
      });
      setIsAddDialogOpen(false);
      setNewInvestment({ name: "", type: "Equity", amount: 0, date: new Date().toISOString().split('T')[0] });
      queryClient.invalidateQueries({ queryKey: [`/api/financial-profiles`, userId] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add investment. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleAddInvestment = () => {
    if (newInvestment.name && newInvestment.amount > 0) {
      addInvestmentMutation.mutate(newInvestment);
    }
  };

  const portfolioData = useMemo(() => {
    if (!profile?.transactions) {
      return { totalValue: 0, dynamicHoldings: [], dynamicAllocations: [] };
    }

    const investmentTransactions = profile.transactions.filter(
      (t) => t.type === "investment"
    );

    const totalValue = investmentTransactions.reduce(
      (sum, t) => sum + t.amount, // Amounts are stored as positive
      0
    );

    const holdingsMap = new Map<string, { name: string, type: string, amount: number }>();
    investmentTransactions.forEach((t) => {
      const existing = holdingsMap.get(t.description);
      if (existing) {
        existing.amount += t.amount;
      } else {
        let type = "Equity";
        if (t.description.toLowerCase().includes("debt")) type = "Debt";
        if (t.description.toLowerCase().includes("gold")) type = "Commodity";
        if (t.description.toLowerCase().includes("liquid")) type = "Cash";
        
        holdingsMap.set(t.description, {
          name: t.description,
          type: type,
          amount: t.amount,
        });
      }
    });

    const dynamicHoldings = Array.from(holdingsMap.values());

    // Calculate allocations
    const allocMap = { Equity: 0, Debt: 0, Gold: 0, Cash: 0 };
    dynamicHoldings.forEach(h => {
      if (h.type === "Equity") allocMap.Equity += h.amount;
      else if (h.type === "Debt") allocMap.Debt += h.amount;
      else if (h.type === "Commodity") allocMap.Gold += h.amount;
      else if (h.type === "Cash") allocMap.Cash += h.amount;
    });

    const dynamicAllocations = totalValue > 0 ? [
      { name: "Equity", value: (allocMap.Equity / totalValue) * 100, color: "hsl(158 64% 52%)" },
      { name: "Debt", value: (allocMap.Debt / totalValue) * 100, color: "hsl(221 83% 53%)" },
      { name: "Gold", value: (allocMap.Gold / totalValue) * 100, color: "hsl(46 95% 53%)" },
      { name: "Cash", value: (allocMap.Cash / totalValue) * 100, color: "hsl(0 84% 60%)" },
    ].filter(alloc => alloc.value > 0) 
     : [];

    return { totalValue, dynamicHoldings, dynamicAllocations };
  }, [profile]);
  
  // === THIS LOGIC IS NOW CORRECT ===
  const performanceData = useMemo(() => {
    if (!profile?.transactions) return [];

    const investmentTx = profile.transactions
      .filter(t => t.type === 'investment') 
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    if (investmentTx.length === 0) return [];

    const monthlyData = new Map<string, number>();
    let cumulativeValue = 0;

    for (const t of investmentTx) {
      const date = new Date(t.date);
      const month = date.toISOString().slice(0, 7); // 'YYYY-MM' format
      cumulativeValue += t.amount;
      monthlyData.set(month, cumulativeValue);
    }
    
    const filledData = [];
    const startDate = new Date(investmentTx[0].date);
    const endDate = new Date();
    let currentDate = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
    let lastValue = 0;

    while (currentDate <= endDate) {
      const monthKey = currentDate.toISOString().slice(0, 7);
      const monthName = currentDate.toLocaleString('default', { month: 'short' });
      
      if (monthlyData.has(monthKey)) {
        lastValue = monthlyData.get(monthKey)!;
      }
      
      filledData.push({
        month: `${monthName} ${currentDate.getFullYear()}`,
        value: lastValue,
      });

      currentDate.setMonth(currentDate.getMonth() + 1);
    }
    
    return filledData.slice(-12); // Return last 12 months
  }, [profile]);

  const investmentInsights = useMemo(() => {
    if (!insights) return [];
    return insights
      .filter(
        insight => insight.agentType === 'investment_advisor' || 
                   insight.analysis_type === 'investment_advice'
      )
      .sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime());
  }, [insights]);


  if (isLoadingProfile) {
    return (
      <main className="flex-1 p-6 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </main>
    );
  }

  return (
    <main className="flex-1 p-6 overflow-auto" data-testid="portfolio-page">
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
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button
                className="bg-primary text-primary-foreground"
                data-testid="button-add-investment"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Investment
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Investment</DialogTitle>
                <DialogDescription>
                  Record a new investment. This will be added as a transaction.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="investment-name">Investment Name</Label>
                  <Input
                    id="investment-name"
                    placeholder="e.g., HDFC Index Fund"
                    value={newInvestment.name}
                    onChange={(e) => setNewInvestment({ ...newInvestment, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="investment-type">Type (for reporting)</Label>
                  <Select
                    value={newInvestment.type}
                    onValueChange={(value) => setNewInvestment({ ...newInvestment, type: value })}
                  >
                    <SelectTrigger id="investment-type">
                      <SelectValue placeholder="Select a type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Equity">Equity</SelectItem>
                      <SelectItem value="Debt">Debt</SelectItem>
                      <SelectItem value="Commodity">Gold/Commodity</SelectItem>
                      <SelectItem value="Cash">Cash/Liquid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="investment-amount">Amount (₹)</Label>
                  <Input
                    id="investment-amount"
                    type="number"
                    placeholder="10000"
                    value={newInvestment.amount || ""}
                    onChange={(e) => setNewInvestment({ ...newInvestment, amount: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="investment-date">Date</Label>
                  <Input
                    id="investment-date"
                    type="date"
                    value={newInvestment.date}
                    onChange={(e) => setNewInvestment({ ...newInvestment, date: e.target.value })}
                  />
                </div>
                <Button
                  onClick={handleAddInvestment}
                  disabled={addInvestmentMutation.isPending || !newInvestment.name || newInvestment.amount <= 0}
                  className="w-full"
                >
                  {addInvestmentMutation.isPending ? "Adding..." : "Add Investment"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Portfolio Summary  */}
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
              {formatCurrency(portfolioData.totalValue)}
            </motion.div>
            <div className="text-sm text-muted-foreground mt-1">
              Total invested capital
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
            <div className="text-sm text-muted-foreground mt-1">This year (mock)</div>
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
              {formatCurrency(15000)}
            </motion.div>
            <div className="text-sm text-muted-foreground mt-1">
              Auto-invested (mock)
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

          {/* Overview Tab  */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-6">Asset Allocation</h3>
                <div className="h-64 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={portfolioData.dynamicAllocations}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                      >
                        {portfolioData.dynamicAllocations.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  {portfolioData.dynamicAllocations.map((item) => (
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
                          ({item.value.toFixed(1)}%)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Performance Chart  */}
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

          {/* Holdings Tab  */}
          <TabsContent value="holdings" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Your Holdings</h3>
              {/* Button is in the DialogTrigger at the top */}
            </div>
            <div className="space-y-3">
              {portfolioData.dynamicHoldings.map((holding, index) => (
                <motion.div
                  key={holding.name + index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  data-testid={`holding-detail-${holding.name.toLowerCase().replace(/\s/g, "-")}`}
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
                              {formatCurrency(holding.amount)}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium text-chart-1">
                              +8.2%
                            </div>
                            <div className="text-sm flex items-center text-chart-1">
                              <TrendingUp className="w-3 h-3 mr-1" />
                              +1.2%
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

          {/* AI Analysis Tab  */}
          <TabsContent value="analysis">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-6 flex items-center">
                <Wand2 className="w-5 h-5 mr-2 text-primary" />
                AI Portfolio Analysis
              </h3>
              {isLoadingInsights ? (
                 <div className="flex items-center justify-center h-40">
                   <Loader2 className="w-6 h-6 animate-spin" />
                 </div>
              ) : investmentInsights.length > 0 ? (
                <div className="space-y-4">
                  {investmentInsights.map((insight) => (
                    <div key={insight.id} className="bg-accent rounded-lg p-4">
                      <h4 className="font-medium mb-2">{insight.outputData.title}</h4>
                      <div className="text-sm text-muted-foreground prose prose-sm dark:prose-invert max-w-none">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {insight.outputData.response || insight.outputData.description}
                        </ReactMarkdown>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-10">
                  <p>No AI insights available for your portfolio yet.</p>
                  <p className="text-xs mt-2">Try asking the AI to "analyze my portfolio" from the dashboard.</p>
                </div>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </main>
  );
}