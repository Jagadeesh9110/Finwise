import { motion } from "framer-motion";
import { Brain, Shield, TrendingUp, Users } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { useEffect } from "react";

export default function Login() {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (user && !loading) {
      navigate("/dashboard");
    }
  }, [user, loading, navigate]);

  const handleGoogleSignIn = () => {
    // The Vite proxy will forward this request to your Node.js server
    // at http://localhost:3000/api/auth/google
    window.location.href = "/api/auth/google";
  };

  const features = [
    {
      icon: Brain,
      title: "AI-Powered Insights",
      description:
        "Get personalized financial advice from our multi-agent AI system",
    },
    {
      icon: TrendingUp,
      title: "Smart Investments",
      description: "Optimize your portfolio with intelligent recommendations",
    },
    {
      icon: Shield,
      title: "Secure & Private",
      description: "Your financial data is encrypted and protected",
    },
    {
      icon: Users,
      title: "Expert Guidance",
      description: "Access to financial education and planning tools",
    },
  ];

  // The loading spinner remains the same. It shows while the useAuth hook
  // is initially checking the user's authentication status.
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          data-testid="loading-spinner"
        >
          <Brain className="w-8 h-8 text-primary" />
        </motion.div>
      </div>
    );
  }

  // The JSX for the login page remains the same, but the onClick handler
  // for the Google button now has a new function.
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        {/* Left Side - Branding */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center lg:text-left"
          data-testid="login-branding"
        >
          <div className="flex items-center justify-center lg:justify-start mb-8">
            <motion.div
              className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mr-4"
              whileHover={{ scale: 1.1 }}
              data-testid="brand-logo-large"
            >
              <Brain className="w-8 h-8 text-primary-foreground" />
            </motion.div>
            <div>
              <h1 className="text-4xl font-bold">FinWise</h1>
              <p className="text-lg text-muted-foreground">
                AI Financial Strategist
              </p>
            </div>
          </div>

          <p className="text-xl text-muted-foreground mb-8">
            Your intelligent co-pilot for personalized financial planning,
            powered by coordinated AI agents.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 + 0.3 }}
                className="flex items-start space-x-3"
                data-testid={`feature-${feature.title
                  .toLowerCase()
                  .replace(/\s/g, "-")}`}
              >
                <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center flex-shrink-0">
                  <feature.icon className="w-5 h-5 text-accent-foreground" />
                </div>
                <div>
                  <h3 className="font-medium text-sm">{feature.title}</h3>
                  <p className="text-xs text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          data-testid="login-form"
        >
          <Card className="w-full max-w-md mx-auto">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Welcome to FinWise</CardTitle>
              <CardDescription>
                Sign in to access your personalized financial dashboard
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  onClick={handleGoogleSignIn}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                  size="lg"
                  data-testid="button-google-signin"
                >
                  <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Continue with Google
                </Button>
              </motion.div>

              <div className="text-center text-xs text-muted-foreground">
                By signing in, you agree to our Terms of Service and Privacy
                Policy
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
