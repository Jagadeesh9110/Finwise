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
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { useAuth } from "@/hooks/useAuth";
import { useLocation, Link } from "wouter";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { apiClient } from "@/lib/apiClient";
import { useToast } from "@/hooks/useToast";

const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(1, { message: "Password cannot be empty" }),
});

export default function Login() {
  const { user, loading, checkAuthStatus } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
  });

  useEffect(() => {
    if (user && !loading) {
      navigate("/dashboard");
    }
  }, [user, loading, navigate]);

  const handleGoogleSignIn = () => {
    window.location.href = "/api/auth/google";
  };

  const onSubmit = async (data: z.infer<typeof loginSchema>) => {
    try {
      await apiClient("/auth/login", {
        method: "POST",
        body: JSON.stringify(data),
      });
      await checkAuthStatus();
      toast({ title: "Login Successful", description: "Welcome back!" });
      // The navigate logic is now inside the useEffect, which is more reliable
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    }
  };

  const features = [
    { icon: Brain, title: "AI-Powered Insights", description: "Get personalized financial advice from our multi-agent AI system" },
    { icon: TrendingUp, title: "Smart Investments", description: "Optimize your portfolio with intelligent recommendations" },
    { icon: Shield, title: "Secure & Private", description: "Your financial data is encrypted and protected" },
    { icon: Users, title: "Expert Guidance", description: "Access to financial education and planning tools" },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
          <Brain className="w-8 h-8 text-primary" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }} className="text-center lg:text-left">
          <div className="flex items-center justify-center lg:justify-start mb-8">
            <motion.div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mr-4" whileHover={{ scale: 1.1 }}>
              <Brain className="w-8 h-8 text-primary-foreground" />
            </motion.div>
            <div>
              <h1 className="text-4xl font-bold">FinWise</h1>
              <p className="text-lg text-muted-foreground">AI Financial Strategist</p>
            </div>
          </div>
          <p className="text-xl text-muted-foreground mb-8">
            Your intelligent co-pilot for personalized financial planning, powered by coordinated AI agents.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            {features.map((feature, index) => (
              <motion.div key={feature.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 + 0.3 }} className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center flex-shrink-0">
                  <feature.icon className="w-5 h-5 text-accent-foreground" />
                </div>
                <div>
                  <h3 className="font-medium text-sm">{feature.title}</h3>
                  <p className="text-xs text-muted-foreground">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.2 }}>
          <Card className="w-full max-w-md mx-auto">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Welcome to FinWise</CardTitle>
              <CardDescription>Sign in to access your personalized dashboard</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="name@example.com" {...register("email")} />
                  {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" type="password" {...register("password")} />
                  {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
                </div>
                <Button type="submit" className="w-full" disabled={isSubmitting}>{isSubmitting ? "Logging In..." : "Login"}</Button>
                <div className="relative my-2">
                  <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                  <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">Or continue with</span></div>
                </div>
                <Button variant="outline" className="w-full" type="button" onClick={handleGoogleSignIn}>Continue with Google</Button>
              </form>
              <div className="mt-4 text-center text-sm">
                Don&apos;t have an account? <Link href="/register" className="underline text-primary">Sign up</Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

