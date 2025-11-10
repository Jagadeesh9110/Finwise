import { motion } from "framer-motion";
import { Card } from "@/components/ui/Card";
import { Progress } from "@/components/ui/Progress";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { IFinancialProfile, IFinancialGoal } from "@/types";

export function GoalProgress() {
  const { user } = useAuth();
  const userId = user?.id || localStorage.getItem("userId");
  
  const { data: profile } = useQuery<IFinancialProfile>({
    queryKey: [`/api/financial-profiles/${userId}`],
    enabled: !!userId,
  });

  const goals = profile?.goals || [];

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return "hsl(158 64% 52%)";
    if (progress >= 50) return "hsl(221 83% 53%)";
    return "hsl(46 95% 53%)";
  };

  const getTimeToDeadline = (deadline: string) => {
    const deadlineDate = new Date(deadline);
    const now = new Date();
    const diffTime = deadlineDate.getTime() - now.getTime();
    const diffMonths = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30));

    if (diffMonths <= 0) return "Overdue";
    if (diffMonths === 1) return "1 month remaining";
    return `${diffMonths} months remaining`;
  };

  if (goals.length === 0) {
    return (
      <Card className="p-6" data-testid="goal-progress">
        <h3 className="text-lg font-semibold mb-6">Goal Progress</h3>
        <div className="text-center py-8 text-muted-foreground">
          No goals set yet. Start by adding your financial goals!
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6" data-testid="goal-progress">
      <h3 className="text-lg font-semibold mb-6">Goal Progress</h3>

      <div className="space-y-6">
        {goals.map((goal: IFinancialGoal, index: number) => {
          const progress = (goal.current / goal.target) * 100;
          const progressColor = getProgressColor(progress);

          return (
            <motion.div
              key={goal.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.2 }}
              data-testid={`goal-${goal.name.toLowerCase().replace(/\s/g, "-")}`}
            >
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">{goal.name}</span>
                <span className="text-sm text-muted-foreground">
                  ₹{goal.current.toLocaleString()} / ₹
                  {goal.target.toLocaleString()}
                </span>
              </div>
              <div className="relative">
                <div className="w-full bg-muted rounded-full h-2">
                  <motion.div
                    className="h-2 rounded-full transition-all duration-1000"
                    style={{ backgroundColor: progressColor }}
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{
                      delay: index * 0.3 + 1,
                      duration: 1.5,
                      ease: "easeOut",
                    }}
                  />
                </div>
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {Math.round(progress)}% complete •{" "}
                {getTimeToDeadline(goal.deadline)}
              </div>
            </motion.div>
          );
        })}
      </div>
    </Card>
  );
}