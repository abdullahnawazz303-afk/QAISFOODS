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

// ── Validation helpers ─────────────────────────────────────────

function validateEmail(email: string): string | null {
  if (!email) return "Email is required";

  const lower = email.toLowerCase().trim();

  // Must be a valid email format
  if (!lower.includes("@")) return "Enter a valid email address";

  const [, domain] = lower.split("@");

  // Staff rule: domain must be qaisfoods.com
  // Customer rule: local part must contain "customer"
  const localPart = lower.split("@")[0];

  const isStaffEmail   = domain === "qaisfoods.com";
  const isCustomerEmail = localPart.includes("customer");

  if (!isStaffEmail && !isCustomerEmail) {
    return "Staff must use a @qaisfoods.com email. Customers must have 'customer' in their email.";
  }

  return null; // valid
}

function validatePassword(password: string): string | null {
  if (!password)          return "Password is required";
  if (password.length < 6) return "Password must be at least 6 characters";
  return null;
}

// ─── Component ────────────────────────────────────────────────

export default function Login() {
  const [email, setEmail]               = useState("");
  const [password, setPassword]         = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading]           = useState(false);
  const [emailError, setEmailError]     = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const login    = useAuthStore((s) => s.login);
  const navigate = useNavigate();

  // ── Inline field validation on blur
  const handleEmailBlur = () => {
    setEmailError(validateEmail(email));
  };

  const handlePasswordBlur = () => {
    setPasswordError(validatePassword(password));
  };

  // ── Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate both fields before hitting Supabase
    const eErr = validateEmail(email);
    const pErr = validatePassword(password);

    setEmailError(eErr);
    setPasswordError(pErr);

    if (eErr || pErr) return; // stop here if invalid

    setLoading(true);
    const ok = await login(email.trim(), password);
    setLoading(false);

    if (!ok) {
      toast.error("Incorrect email or password. Please try again.");
      return;
    }

    // Role is set in the store by authStore.login() reading public.users
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
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (emailError) setEmailError(validateEmail(e.target.value));
                  }}
                  onBlur={handleEmailBlur}
                  placeholder="admin@qaisfoods.com"
                  autoComplete="email"
                  className={emailError ? "border-destructive focus-visible:ring-destructive" : ""}
                />
                {emailError && (
                  <p className="text-xs text-destructive">{emailError}</p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (passwordError) setPasswordError(validatePassword(e.target.value));
                    }}
                    onBlur={handlePasswordBlur}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className={passwordError ? "border-destructive focus-visible:ring-destructive" : ""}
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
                {passwordError && (
                  <p className="text-xs text-destructive">{passwordError}</p>
                )}
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

            {/* Register link */}
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
              Must use a <span className="font-mono text-foreground">@qaisfoods.com</span> email
            </p>
          </div>
          <div className="flex items-start gap-2">
            <span className="mt-0.5 h-2 w-2 rounded-full bg-green-500 shrink-0" />
            <p>
              <span className="font-medium text-foreground">Customers</span> — 
              Email must contain <span className="font-mono text-foreground">customer</span> (e.g. customer1@gmail.com)
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}