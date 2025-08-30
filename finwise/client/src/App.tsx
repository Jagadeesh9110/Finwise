import { Switch, Route, Redirect } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";

import { Toaster } from "@/components/ui/Toaster";
import { TooltipProvider } from "@/components/ui/ToolTip";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Sidebar } from "@/components/Sidebar";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Scenarios from "@/pages/Scenarios";
import FinancialStory from "@/pages/FinancialStory";
import Portfolio from "@/pages/Portfolio";
import NotFound from "@/pages/NotFound";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/login" />;
  }

  return <>{children}</>;
}

function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar />
      <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
    </div>
  );
}

function Router() {
  const { user } = useAuth();

  return (
    <Switch>
      <Route path="/login" component={Login} />

      <Route path="/dashboard">
        <ProtectedRoute>
          <AuthenticatedLayout>
            <Dashboard />
          </AuthenticatedLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/scenarios">
        <ProtectedRoute>
          <AuthenticatedLayout>
            <Scenarios />
          </AuthenticatedLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/financial-story">
        <ProtectedRoute>
          <AuthenticatedLayout>
            <FinancialStory />
          </AuthenticatedLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/portfolio">
        <ProtectedRoute>
          <AuthenticatedLayout>
            <Portfolio />
          </AuthenticatedLayout>
        </ProtectedRoute>
      </Route>

      {/* Default route: redirect to dashboard if logged in, otherwise to login. */}
      <Route path="/">
        {user ? <Redirect to="/dashboard" /> : <Redirect to="/login" />}
      </Route>

      {/* Fallback route for any path that doesn't match. */}
      <Route component={NotFound} />
    </Switch>
  );
}

// The root App component wraps the entire application with necessary providers.
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
