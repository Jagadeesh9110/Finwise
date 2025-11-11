import { Switch, Route, Redirect } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Toaster } from "@/components/ui/Toaster";
import { TooltipProvider } from "@/components/ui/ToolTip";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Sidebar } from "@/components/Sidebar";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import VerifyEmail from "@/pages/VerifyEmail";
import Dashboard from "@/pages/Dashboard";
import Scenarios from "@/pages/Scenarios";
import FinancialStory from "@/pages/FinancialStory";
import Portfolio from "@/pages/Portfolio";
import AllInsights from "@/pages/AllInsights"; 
import NotFound from "@/pages/NotFound";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!user) return <Redirect to="/login" />;
  return <>{children}</>;
}


function AppAuthenticatedLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-auto">
        {/* The child component (e.g., Dashboard) will render here */}
        {children}
      </div>
    </div>
  );
}

function Router() {
  const { user } = useAuth();
  return (
    <Switch>
      {/* Public Routes - Accessible to everyone */}
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/verify-email" component={VerifyEmail} />

      {/* Protected Routes - Accessible only to authenticated users */}
      <Route path="/dashboard"><ProtectedRoute><AppAuthenticatedLayout><Dashboard /></AppAuthenticatedLayout></ProtectedRoute></Route>
      <Route path="/scenarios"><ProtectedRoute><AppAuthenticatedLayout><Scenarios /></AppAuthenticatedLayout></ProtectedRoute></Route>
      <Route path="/financial-story"><ProtectedRoute><AppAuthenticatedLayout><FinancialStory /></AppAuthenticatedLayout></ProtectedRoute></Route>
      <Route path="/portfolio"><ProtectedRoute><AppAuthenticatedLayout><Portfolio /></AppAuthenticatedLayout></ProtectedRoute></Route>
      
      <Route path="/all-insights"><ProtectedRoute><AppAuthenticatedLayout><AllInsights /></AppAuthenticatedLayout></ProtectedRoute></Route>

      {/* Default redirect logic */}
      <Route path="/">{user ? <Redirect to="/dashboard" /> : <Redirect to="/login" />}</Route>

      <Route component={NotFound} />
    </Switch>
  );
}

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