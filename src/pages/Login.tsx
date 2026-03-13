import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card, CardContent, CardHeader,
  CardTitle, CardDescription,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Leaf, Eye, EyeOff, Loader2 } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { toast } from "sonner";

export default function Login() {
  const [email, setEmail]             = useState("");
  const [password, setPassword]       = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading]         = useState(false);

  const login    = useAuthStore((s) => s.login);
  const userRole = useAuthStore((s) => s.userRole);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error("Please enter your email and password");
      return;
    }

    setLoading(true);
    const ok = await login(email.trim(), password);
    setLoading(false);

    if (!ok) {
      toast.error("Invalid email or password. Please try again.");
      return;
    }

    // Role comes from authStore — set by Supabase after login
    // Do NOT guess role from email like the old code did
    const role = useAuthStore.getState().userRole;

    if (role === "customer") {
      toast.success("Welcome! Redirecting to your portal...");
      navigate("/portal", { replace: true });
    } else {
      toast.success("Welcome back!");
      navigate("/dashboard", { replace: true });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary/30 px-4">
      <div className="w-full max-w-md space-y-4">

        <Card className="shadow-xl border-none">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto w-14 h-14 rounded-xl bg-primary flex items-center justify-center mb-4">
              <Leaf className="h-7 w-7 text-primary-foreground" />
            </div>
            <CardTitle className="text-2xl">Welcome Back</CardTitle>
            <CardDescription>
              Sign in to access the management system or your customer portal
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                />
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => setShowPassword((v) => !v)}
                    tabIndex={-1}
                  >
                    {showPassword
                      ? <EyeOff className="h-4 w-4" />
                      : <Eye className="h-4 w-4" />
                    }
                  </button>
                </div>
              </div>

              {/* Submit */}
              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={loading}
              >
                {loading
                  ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Signing in...</>
                  : "Sign In"
                }
              </Button>
            </form>

            {/* Register link for customers */}
            <div className="mt-6 pt-5 border-t text-center space-y-1">
              <p className="text-sm text-muted-foreground">
                New customer? Don't have an account yet?
              </p>
              <Link
                to="/register"
                className="text-sm font-medium text-primary hover:underline"
              >
                Create your customer account →
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Info box */}
        <div className="rounded-lg border bg-card p-4 text-xs text-muted-foreground space-y-1.5">
          <p className="font-semibold text-foreground text-sm mb-2">Account Types</p>
          <div className="flex items-start gap-2">
            <span className="mt-0.5 h-2 w-2 rounded-full bg-primary shrink-0" />
            <p>
              <span className="font-medium text-foreground">Factory Staff</span> — 
              Admin, Manager, Cashier accounts created by system administrator
            </p>
          </div>
          <div className="flex items-start gap-2">
            <span className="mt-0.5 h-2 w-2 rounded-full bg-green-500 shrink-0" />
            <p>
              <span className="font-medium text-foreground">Customers</span> — 
              Wholesale buyers registered by the factory. Use your phone number to register.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}