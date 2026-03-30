import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useInternetIdentity } from "@/hooks/useInternetIdentity";
import { Eye, EyeOff, Loader2, Zap } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";

interface LoginPageProps {
  onSuccess: () => void;
}

export function LoginPage({ onSuccess }: LoginPageProps) {
  const { login, isLoggingIn, isLoginSuccess } = useInternetIdentity();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    try {
      await login();
      toast.success("Welcome back!");
      onSuccess();
    } catch {
      toast.error("Login failed. Please try again.");
    }
  };

  if (isLoginSuccess) {
    onSuccess();
  }

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-background" />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% -10%, oklch(0.4 0.22 290 / 0.5) 0%, transparent 60%)",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 80% 100%, oklch(0.4 0.25 330 / 0.3) 0%, transparent 50%)",
        }}
      />

      {/* Floating orbs */}
      <motion.div
        className="absolute w-64 h-64 rounded-full opacity-20"
        style={{
          background:
            "radial-gradient(circle, oklch(0.62 0.26 290) 0%, transparent 70%)",
          top: "10%",
          left: "5%",
        }}
        animate={{ y: [0, -20, 0], scale: [1, 1.05, 1] }}
        transition={{
          duration: 6,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute w-48 h-48 rounded-full opacity-20"
        style={{
          background:
            "radial-gradient(circle, oklch(0.65 0.28 330) 0%, transparent 70%)",
          bottom: "10%",
          right: "5%",
        }}
        animate={{ y: [0, 20, 0], scale: [1, 0.95, 1] }}
        transition={{
          duration: 7,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
          delay: 1,
        }}
      />

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent shadow-glow mb-4"
          >
            <Zap className="w-8 h-8 text-white" fill="white" />
          </motion.div>
          <h1 className="font-display font-bold text-4xl gradient-text">
            InstaPredict
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">
            AI-powered Instagram likes prediction
          </p>
        </div>

        {/* Auth card */}
        <div className="glass-strong rounded-2xl p-8 shadow-glow">
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="w-full mb-6 bg-muted/50" data-ocid="auth.tab">
              <TabsTrigger
                value="login"
                className="flex-1"
                data-ocid="auth.login.tab"
              >
                Sign In
              </TabsTrigger>
              <TabsTrigger
                value="signup"
                className="flex-1"
                data-ocid="auth.signup.tab"
              >
                Sign Up
              </TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email" className="text-sm font-medium">
                  Email
                </Label>
                <Input
                  id="login-email"
                  type="email"
                  placeholder="you@instagram.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-input/50 border-border/50 focus:border-primary"
                  data-ocid="auth.email.input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-password" className="text-sm font-medium">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-input/50 border-border/50 focus:border-primary pr-10"
                    data-ocid="auth.password.input"
                    onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
              <Button
                className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity font-semibold"
                onClick={handleLogin}
                disabled={isLoggingIn}
                data-ocid="auth.login.submit_button"
              >
                {isLoggingIn ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : null}
                {isLoggingIn ? "Signing in..." : "Sign In"}
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                Powered by Internet Identity — secure &amp; passwordless
              </p>
            </TabsContent>

            <TabsContent value="signup" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signup-email" className="text-sm font-medium">
                  Email
                </Label>
                <Input
                  id="signup-email"
                  type="email"
                  placeholder="you@instagram.com"
                  className="bg-input/50 border-border/50 focus:border-primary"
                  data-ocid="auth.signup.email.input"
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="signup-username"
                  className="text-sm font-medium"
                >
                  Instagram Username
                </Label>
                <Input
                  id="signup-username"
                  placeholder="@yourhandle"
                  className="bg-input/50 border-border/50 focus:border-primary"
                  data-ocid="auth.signup.username.input"
                />
              </div>
              <Button
                className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity font-semibold"
                onClick={handleLogin}
                disabled={isLoggingIn}
                data-ocid="auth.signup.submit_button"
              >
                {isLoggingIn ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : null}
                Create Account
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                Powered by Internet Identity — secure &amp; passwordless
              </p>
            </TabsContent>
          </Tabs>
        </div>

        {/* Feature bullets */}
        <div className="mt-6 grid grid-cols-3 gap-3 text-center">
          {[
            { icon: "⚡", label: "Instant" },
            { icon: "🎯", label: "Accurate" },
            { icon: "🔒", label: "Private" },
          ].map((f) => (
            <div key={f.label} className="glass rounded-xl p-3">
              <div className="text-xl mb-1">{f.icon}</div>
              <div className="text-xs text-muted-foreground font-medium">
                {f.label}
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
