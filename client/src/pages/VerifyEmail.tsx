import { useEffect, useState } from "react";
import { useToast } from "@/hooks/useToast";
import { apiClient } from "@/lib/apiClient";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { SimpleOTPInput } from "@/components/ui/InputOtp";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";

export default function VerifyEmail() {
  const { checkAuthStatus } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [otp, setOtp] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const email = sessionStorage.getItem("emailForVerification");

  useEffect(() => {
    if (!email) {
      navigate("/register");
    }
  }, [email, navigate]);

  if (!email) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (otp.length !== 6) {
      toast({
        title: "Invalid Code",
        description: "Please enter a 6-digit verification code.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await apiClient("/auth/verify-email", {
        method: "POST",
        body: JSON.stringify({ email, otp }),
      });

      await checkAuthStatus();

      toast({
        title: "Email Verified!",
        description: "Welcome to FinWise. You are now logged in.",
      });
      navigate("/dashboard");
    } catch (error: any) {
      toast({
        title: "Verification Failed",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendCode = async () => {
    try {
      await apiClient("/auth/resend-verification", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      toast({
        title: "Code Resent",
        description: "A new verification code has been sent to your email.",
      });
    } catch (error: any) {
      toast({
        title: "Resend Failed",
        description: error.message || "Failed to resend verification code.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="mx-auto max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Check your email</CardTitle>
          <CardDescription>
            We've sent a 6-digit verification code to{" "}
            <span className="font-semibold text-foreground">{email}</span>.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="grid gap-2">
              <SimpleOTPInput
                maxLength={6}
                value={otp}
                onChange={(value: string) => setOtp(value)}
                className="justify-center"
              />
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Verifying..." : "Verify Account"}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            Didn't receive a code?{" "}
            <Button
              variant="link"
              className="p-0 h-auto"
              onClick={handleResendCode}
              type="button"
            >
              Resend
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}