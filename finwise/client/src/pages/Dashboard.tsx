import { motion } from "framer-motion";
import { Bell } from "lucide-react";

// Corrected Imports: All component imports now use PascalCase
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useAuth } from "@/hooks/useAuth";
import { ThemeProvider, useTheme } from "@/components/ThemeProvider";
import { AICommandBar } from "@/components/AiCommandBar";
import { FinancialVitals } from "@/components/FinancialVitals";
import { ActionableInsights } from "@/components/ActionableInsights";
import { ScenarioWidget } from "@/components/ScenarioWidget";
import { GoalProgress } from "@/components/GoalProgress";
import { InvestmentPortfolio } from "@/components/InvestmentPortfolio";
import { SpendingAnalysis } from "@/components/SpendingAnalysis";

export default function Dashboard() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const learningCourses = [
    {
      title: "SIP Investing 101",
      description: "Learn the basics of systematic investment planning",
      duration: "15 min read",
      gradient: "from-chart-1 to-chart-2",
      textColor: "text-chart-1",
    },
    {
      title: "Tax Optimization",
      description: "Maximize your savings through smart tax planning",
      duration: "20 min read",
      gradient: "from-chart-3 to-chart-4",
      textColor: "text-chart-3",
    },
    {
      title: "Emergency Planning",
      description: "Build a robust financial safety net",
      duration: "12 min read",
      gradient: "from-chart-2 to-chart-5",
      textColor: "text-chart-2",
    },
  ];

  return (
    <main className="flex-1 flex flex-col" data-testid="dashboard">
      {/* Header with AI Command Bar */}
      <header className="bg-card border-b border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h2 className="text-2xl font-semibold">
              {getGreeting()}, {user?.displayName?.split(" ")[0] || "User"}
            </h2>
            <p className="text-muted-foreground">
              Let's optimize your financial strategy today
            </p>
          </motion.div>
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              data-testid="button-notifications"
            >
              <Bell className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              data-testid="button-theme-toggle"
            >
              {theme === "dark" ? "🌙" : "☀️"}
            </Button>
          </div>
        </div>

        <AICommandBar />
      </header>

      {/* Dashboard Content */}
      <div className="flex-1 p-6 overflow-auto">
        <FinancialVitals />

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <ActionableInsights />

          <div className="space-y-8">
            <ScenarioWidget />
            <GoalProgress />
          </div>
        </div>

        {/* Investment Portfolio & Spending Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
          <InvestmentPortfolio />
          <SpendingAnalysis />
        </div>

        {/* Financial Education Section */}
        <motion.div
          className="mt-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          data-testid="education-section"
        >
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">Continue Learning</h3>
              <Button
                variant="ghost"
                className="text-primary hover:text-primary/80 text-sm font-medium"
              >
                View All Courses
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {learningCourses.map((course, index) => (
                <motion.div
                  key={course.title}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 + 1.2 }}
                  className={`bg-gradient-to-br ${course.gradient} rounded-lg p-6 text-white relative overflow-hidden cursor-pointer`}
                  whileHover={{ scale: 1.05 }}
                  data-testid={`course-${course.title
                    .toLowerCase()
                    .replace(/\s/g, "-")}`}
                >
                  <div className="relative z-10">
                    <h4 className="font-semibold mb-2">{course.title}</h4>
                    <p className="text-sm opacity-90 mb-4">
                      {course.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs opacity-75">
                        {course.duration}
                      </span>
                      <Button
                        size="sm"
                        variant="secondary"
                        className={`bg-white ${course.textColor} hover:bg-white/90`}
                      >
                        Start
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </Card>
        </motion.div>
      </div>
    </main>
  );
}
