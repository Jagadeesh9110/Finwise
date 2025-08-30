import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  Brain,
  Gauge,
  HelpCircle,
  BookOpen,
  PieChart,
  Settings,
  LogOut,
  Moon,
  Sun,
} from "lucide-react";
// Corrected Imports: All component imports now use PascalCase
import { AgentWorkflowVisualizer } from "./AgentWorkflowVisualizer";
import { useAuth } from "@/hooks/useAuth";
import { ThemeProvider, useTheme } from "./ThemeProvider"; // Assuming ThemeProvider is also a component
import { Button } from "@/components/ui/Button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/Avatar";

const navigationItems = [
  { href: "/dashboard", icon: Gauge, label: "Strategist's Desk" },
  { href: "/scenarios", icon: HelpCircle, label: "What-If Scenarios" },
  { href: "/financial-story", icon: BookOpen, label: "Financial Story" },
  { href: "/portfolio", icon: PieChart, label: "Investment Portfolio" },
  // We will create the settings page later
  // { href: "/settings", icon: Settings, label: "Settings" },
];

export function Sidebar() {
  const [location] = useLocation();
  // The useAuth hook now provides our custom authentication state and logout function
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  // The handleLogout function is now much simpler. It just calls the logout
  // function from our useAuth hook, which handles the backend API call.
  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <aside
      className="w-80 bg-card border-r border-border flex flex-col"
      data-testid="sidebar"
    >
      {/* Logo and Brand */}
      <div className="p-6 border-b border-border">
        <motion.div
          className="flex items-center space-x-3"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          data-testid="brand-logo"
        >
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Brain className="w-4 h-4 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-semibold">FinWise</h1>
            <p className="text-xs text-muted-foreground">
              AI Financial Strategist
            </p>
          </div>
        </motion.div>
      </div>

      <AgentWorkflowVisualizer />

      {/* Navigation Menu */}
      <nav className="flex-1 p-6 space-y-2" data-testid="navigation">
        {navigationItems.map((item, index) => {
          const isActive = location === item.href;

          return (
            <motion.div
              key={item.href}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Link href={item.href}>
                <motion.div
                  className={`flex items-center space-x-3 p-3 rounded-lg transition-colors cursor-pointer ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-accent"
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  data-testid={`nav-${item.label
                    .toLowerCase()
                    .replace(/\s/g, "-")}`}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </motion.div>
              </Link>
            </motion.div>
          );
        })}
      </nav>

      {/* Theme Toggle */}
      <div className="p-6 border-t border-border">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleTheme}
          className="w-full justify-start"
          data-testid="button-theme-toggle"
        >
          {theme === "dark" ? (
            <Sun className="w-4 h-4 mr-2" />
          ) : (
            <Moon className="w-4 h-4 mr-2" />
          )}
          {theme === "dark" ? "Light Mode" : "Dark Mode"}
        </Button>
      </div>

      {/* User Profile */}
      <div className="p-6 border-t border-border">
        <div className="flex items-center space-x-3" data-testid="user-profile">
          <Avatar className="w-10 h-10">
            <AvatarImage src={user?.photoURL || ""} alt={user?.name || ""} />
            <AvatarFallback>
              {user?.name?.charAt(0).toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="font-medium text-sm">{user?.name || "User"}</div>
            <div className="text-xs text-muted-foreground">Premium Member</div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            data-testid="button-logout"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </aside>
  );
}
