import { useState } from "react";
import { motion } from "framer-motion";
import { Card } from "../components/ui/Card";
import { Progress } from "../components/ui/Progress";
import { Button } from "../components/ui/Button";
import { 
  Trophy, 
  Target, 
  Clock, 
  TrendingUp, 
  Star, 
  Loader2,
  BarChart3,
  CreditCard,
  PiggyBank,
  GraduationCap
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { IFinancialProfile, IFinancialGoal, IAgentOutput } from "@/types";
import { GoalDetailModal } from "@/components/GoalDetailModal"; 

// Helper to get the correct icon for milestones
const milestoneIcons: { [key: string]: typeof Star } = {
  master: Star,
  budget_planner: BarChart3,
  debt_optimizer: CreditCard,
  income_expense_analyzer: PiggyBank,
  investment_advisor: TrendingUp,
  financial_educator: GraduationCap,
  default: Star
};

// Helper to format dates
const formatMilestoneDate = (dateString: string | Date) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffDays = Math.round((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) return "Today";
  if (diffDays === 1) return "1 day ago";
  if (diffDays < 30) return `${diffDays} days ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
};

export default function FinancialStory() {
  const { user } = useAuth();
  const userId = user?.id || localStorage.getItem("userId");
  
  const [selectedGoal, setSelectedGoal] = useState<IFinancialGoal | null>(null);


  const { data: profile, isLoading: isLoadingProfile } = useQuery<IFinancialProfile>({
    queryKey: [`/api/financial-profiles`, userId],
    enabled: !!userId,
  });

  const { data: insights, isLoading: isLoadingInsights } = useQuery<IAgentOutput[]>({
    queryKey: [`/api/agent-outputs/user`, userId],
    enabled: !!userId,
  });

  const goals = profile?.goals || [];


  const { totalTarget, totalCurrent } = goals.reduce(
    (acc, goal) => {
      acc.totalTarget += goal.target;
      acc.totalCurrent += goal.current;
      return acc;
    },
    { totalTarget: 0, totalCurrent: 0 }
  );

  const healthPercentage = totalTarget > 0 ? Math.round((totalCurrent / totalTarget) * 100) : 0;
  const totalAssets = (profile?.savings || 0) + totalCurrent;
  
  // Helper to format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (isLoadingProfile || isLoadingInsights) {
    return (
      <div className="flex-1 p-6 overflow-auto flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 overflow-auto" data-testid="financial-story">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Your Financial Story</h1>
          <p className="text-muted-foreground">
            Track your journey towards financial freedom with personalized
            milestones
          </p>
        </div>

        {/* Overall Progress -  Dynamic */}
        <Card className="p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">Overall Financial Health</h3>
            <div className="text-2xl font-bold text-primary">{healthPercentage}%</div>
          </div>

          <Progress value={healthPercentage} className="mb-4" />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-chart-1">{goals.length}</div>
              <div className="text-sm text-muted-foreground">Goals Active</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-chart-2">{insights?.length || 0}</div>
              <div className="text-sm text-muted-foreground">
                Milestones Achieved
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-chart-3">{formatCurrency(totalAssets)}</div>
              <div className="text-sm text-muted-foreground">Total Assets</div>
            </div>
          </div>
        </Card>

        {/* Goal Details -  Dynamic */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {goals.map((goal: IFinancialGoal, index: number) => {
            const progress = (goal.current / goal.target) * 100;
            const daysToDeadline = Math.ceil(
              (new Date(goal.deadline).getTime() - new Date().getTime()) /
                (1000 * 60 * 60 * 24)
            );

            return (
              <motion.div
                key={goal.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.2 }}
                data-testid={`story-goal-${goal.name
                  .toLowerCase()
                  .replace(/\s/g, "-")}`}
              >
                <Card className="p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold">{goal.name}</h4>
                    <div className="text-xs text-muted-foreground flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {daysToDeadline > 0
                        ? `${Math.ceil(daysToDeadline / 30)} months left`
                        : "Overdue"}
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span>{formatCurrency(goal.current)}</span>
                      <span>{formatCurrency(goal.target)}</span>
                    </div>
                    <Progress value={progress} className="h-3" />
                    <div className="text-xs text-muted-foreground mt-1">
                      {Math.round(progress)}% complete
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-sm font-medium">Story Update:</div>
                    <div className="text-sm text-muted-foreground">
                      {progress > 80
                        ? "You're almost there! Keep up the great work."
                        : progress > 50
                        ? "Great progress! You're more than halfway to your goal."
                        : "Every step counts. Stay consistent with your savings plan."}
                    </div>
                  </div>

                  {/* 5. Make button interactive */}
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full mt-4"
                    onClick={() => setSelectedGoal(goal)}
                  >
                    View Details
                  </Button>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Financial Milestones Timeline -Dynamic */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-6">Financial Milestones</h3>
          <div className="relative">
            <div className="absolute left-6 top-0 bottom-0 w-px bg-border"></div>
            <div className="space-y-6">
              {(insights || []).map((insight, index) => {
                const Icon = milestoneIcons[insight.agentType] || milestoneIcons.default;
                return (
                  <motion.div
                    key={insight.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.2 }}
                    className="relative flex items-start space-x-4"
                    data-testid={`milestone-${insight.id}`}
                  >
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center relative z-10 bg-primary`}
                    >
                      <Icon className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <div className="flex-1 pb-6">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-foreground">
                          {insight.outputData.title || "AI Insight Received"}
                        </h4>
                        <div className="text-xs text-muted-foreground">
                          {formatMilestoneDate(insight.timestamp || new Date())}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {insight.outputData.description || "You completed a financial review."}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
              {/* Add a default "journey started" milestone */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: (insights?.length || 0) * 0.2 }}
                className="relative flex items-start space-x-4"
              >
                <div className="w-12 h-12 rounded-full flex items-center justify-center relative z-10 bg-muted">
                  <Star className="w-6 h-6 text-muted-foreground" />
                </div>
                <div className="flex-1 pb-6">
                  <h4 className="font-semibold text-muted-foreground">Started Your Financial Journey</h4>
                  <p className="text-sm text-muted-foreground">
                    You took the first step by setting up FinWise.
                  </p>
                </div>
              </motion.div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* 6. Render the modal */}
      <GoalDetailModal
        goal={selectedGoal}
        onClose={() => setSelectedGoal(null)}
      />
    </div>
  );
}