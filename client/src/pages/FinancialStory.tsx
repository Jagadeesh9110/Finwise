import { motion } from "framer-motion";
import { Card } from "../components/ui/Card";
import { Progress } from "../components/ui/Progress";
import { Button } from "../components/ui/Button";
import { Trophy, Target, Clock, TrendingUp, Star } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

export default function FinancialStory() {
  const { data: profile } = useQuery({
    queryKey: ["/api/financial-profiles/sample-user-1"],
  });

  const goals = (profile as any)?.goals || [
    {
      name: "Emergency Fund",
      target: 300000,
      current: 240000,
      deadline: "2024-12-31",
    },
    {
      name: "House Down Payment",
      target: 1500000,
      current: 850000,
      deadline: "2026-06-30",
    },
    {
      name: "Europe Vacation",
      target: 200000,
      current: 45000,
      deadline: "2025-12-31",
    },
  ];

  const milestones = [
    {
      title: "Started Your Financial Journey",
      description: "You took the first step by setting up FinWise",
      date: "3 months ago",
      completed: true,
      icon: Star,
    },
    {
      title: "Built Emergency Fund Foundation",
      description: "Reached 50% of your emergency fund target",
      date: "2 months ago",
      completed: true,
      icon: Trophy,
    },
    {
      title: "Investment Portfolio Launched",
      description: "Started your first SIP investments",
      date: "1 month ago",
      completed: true,
      icon: TrendingUp,
    },
    {
      title: "Emergency Fund Goal Achievement",
      description: "Complete your 6-month emergency fund",
      date: "In 2 months",
      completed: false,
      icon: Target,
    },
  ];

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

        {/* Overall Progress */}
        <Card className="p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">Overall Financial Health</h3>
            <div className="text-2xl font-bold text-primary">73%</div>
          </div>

          <Progress value={73} className="mb-4" />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-chart-1">3</div>
              <div className="text-sm text-muted-foreground">Goals Active</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-chart-2">2</div>
              <div className="text-sm text-muted-foreground">
                Milestones Achieved
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-chart-3">₹4.85L</div>
              <div className="text-sm text-muted-foreground">Total Assets</div>
            </div>
          </div>
        </Card>

        {/* Goal Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {goals.map((goal: any, index: number) => {
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
                      <span>₹{goal.current.toLocaleString()}</span>
                      <span>₹{goal.target.toLocaleString()}</span>
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

                  <Button variant="outline" size="sm" className="w-full mt-4">
                    View Details
                  </Button>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Financial Milestones Timeline */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-6">Financial Milestones</h3>

          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-6 top-0 bottom-0 w-px bg-border"></div>

            <div className="space-y-6">
              {milestones.map((milestone, index) => (
                <motion.div
                  key={milestone.title}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.2 }}
                  className="relative flex items-start space-x-4"
                  data-testid={`milestone-${milestone.title
                    .toLowerCase()
                    .replace(/\s/g, "-")}`}
                >
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center relative z-10 ${
                      milestone.completed ? "bg-primary" : "bg-muted"
                    }`}
                  >
                    <milestone.icon
                      className={`w-6 h-6 ${
                        milestone.completed
                          ? "text-primary-foreground"
                          : "text-muted-foreground"
                      }`}
                    />
                  </div>

                  <div className="flex-1 pb-6">
                    <div className="flex items-center justify-between mb-2">
                      <h4
                        className={`font-semibold ${
                          milestone.completed
                            ? "text-foreground"
                            : "text-muted-foreground"
                        }`}
                      >
                        {milestone.title}
                      </h4>
                      <div className="text-xs text-muted-foreground">
                        {milestone.date}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {milestone.description}
                    </p>

                    {!milestone.completed && (
                      <Button variant="outline" size="sm" className="mt-3">
                        View Action Plan
                      </Button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
