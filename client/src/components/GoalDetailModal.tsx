import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose
} from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Progress } from "@/components/ui/Progress";
import { IFinancialGoal } from "@/types";
import { Target, Clock, PiggyBank } from "lucide-react";

interface GoalDetailModalProps {
  goal: IFinancialGoal | null;
  onClose: () => void;
}

// Helper to format currency
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
};

// Helper to calculate time remaining
const getTimeToDeadline = (deadline: string) => {
  const deadlineDate = new Date(deadline);
  const now = new Date();
  const diffTime = deadlineDate.getTime() - now.getTime();
  const diffMonths = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30));

  if (diffMonths <= 0) return { text: "Overdue", color: "text-destructive" };
  if (diffMonths === 1) return { text: "1 month remaining", color: "text-amber-500" };
  return { text: `${diffMonths} months remaining`, color: "text-muted-foreground" };
};

export function GoalDetailModal({ goal, onClose }: GoalDetailModalProps) {
  if (!goal) return null;

  const progress = (goal.current / goal.target) * 100;
  const remaining = goal.target - goal.current;
  const deadlineInfo = getTimeToDeadline(goal.deadline);

  return (
    <Dialog open={!!goal} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl">{goal.name}</DialogTitle>
          <DialogDescription>
            Detailed progress for your financial goal.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <div className="flex justify-between items-baseline">
              <span className="text-sm text-muted-foreground">Progress</span>
              <span className="text-lg font-bold" style={{ color: "hsl(158 64% 52%)" }}>
                {Math.round(progress)}%
              </span>
            </div>
            <Progress value={progress} className="h-3" />
            <div className="flex justify-between items-baseline text-sm">
              <span className="font-medium">{formatCurrency(goal.current)}</span>
              <span className="text-muted-foreground"> of {formatCurrency(goal.target)}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-2 rounded-lg bg-accent p-3">
              <PiggyBank className="w-5 h-5 text-primary" />
              <div>
                <div className="text-xs text-muted-foreground">Remaining</div>
                <div className="text-sm font-medium">{formatCurrency(remaining)}</div>
              </div>
            </div>
            <div className="flex items-center space-x-2 rounded-lg bg-accent p-3">
              <Clock className={`w-5 h-5 ${deadlineInfo.color}`} />
              <div>
                <div className="text-xs text-muted-foreground">Deadline</div>
                <div className={`text-sm font-medium ${deadlineInfo.color}`}>
                  {deadlineInfo.text}
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}