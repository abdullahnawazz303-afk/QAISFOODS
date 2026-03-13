import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, ArrowLeft } from "lucide-react";

// ─────────────────────────────────────────────────────────────
// How this works:
//  1. Admin creates a customer record in the Customers page
//     (name, phone, city etc.) — NO auth account yet
//  2. Customer visits /register, enters their phone + email + password
//  3. We look up the customers table by phone to verify they exist
//  4. We create a Supabase auth account with role='customer'
//  5. The handle_new_user DB trigger creates a public.users row
//  6. We then update that users row with the correct customer_id
// ─────────────────────────────────────────────────────────────

const Register = () => {
  const navigate = useNavigate();

  const [phone, setPhone]         = useState("");
  const [email, setEmail]         = useState("");
  const [password, setPassword]   = useState("");
  const [confirm, setConfirm]     = useState("");
  const [loading, setLoading]     = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirm) {
      toast.error("Passwords do not match");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    // ── Step 1: Find customer record by phone number
    const cleanPhone = phone.trim().replace(/\s+/g, "");
    const { data: customerRow, error: lookupErr } = await supabase
      .from("customers")
      .select("id, name")
      .eq("phone", cleanPhone)
      .eq("is_active", true)
      .maybeSingle();

    if (lookupErr || !customerRow) {
      toast.error(
        "No account found for this phone number. Please contact the factory to register you first.",
        { duration: 5000 }
      );
      setLoading(false);
      return;
    }

    // ── Step 2: Create Supabase auth account
    // Pass role and customer_id in metadata so the DB trigger uses them
    const { data: authData, error: signUpErr } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          name: customerRow.name,
          role: "customer",
          account_type: "customer",
          customer_id: customerRow.id,
        },
      },
    });

    if (signUpErr || !authData.user) {
      toast.error(signUpErr?.message ?? "Registration failed. Please try again.");
      setLoading(false);
      return;
    }

    // ── Step 3: Update the public.users row with customer_id
    // The trigger creates the row — we patch it with the customer link
    // Small delay to let trigger fire first
    await new Promise((r) => setTimeout(r, 800));

    await supabase
      .from("users")
      .update({ customer_id: customerRow.id, role: "customer", account_type: "customer" })
      .eq("id", authData.user.id);

    setLoading(false);

    toast.success(
      `Account created! Welcome, ${customerRow.name}. Please check your email to verify your account.`,
      { duration: 6000 }
    );

    navigate("/login");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-sm space-y-6">

        <div className="text-center">
          <h1 className="text-2xl font-bold">Create Account</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Register using your phone number registered with the factory
          </p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4 bg-card rounded-xl border p-6 shadow-sm">

          <div className="space-y-2">
            <Label>Phone Number *</Label>
            <Input
              type="tel"
              placeholder="03001234567"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">
              Must match the number registered with the factory
            </p>
          </div>

          <div className="space-y-2">
            <Label>Email Address *</Label>
            <Input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Password *</Label>
            <Input
              type="password"
              placeholder="Min 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          <div className="space-y-2">
            <Label>Confirm Password *</Label>
            <Input
              type="password"
              placeholder="Repeat password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Creating account...</>
            ) : (
              "Create Account"
            )}
          </Button>
        </form>

        <div className="text-center">
          <Link
            to="/login"
            className="text-sm text-muted-foreground hover:text-foreground flex items-center justify-center gap-1"
          >
            <ArrowLeft className="h-3 w-3" /> Back to login
          </Link>
        </div>

        <p className="text-xs text-center text-muted-foreground">
          Don't have a registered phone number?{" "}
          <a
            href="https://wa.me/923001234567"
            target="_blank"
            rel="noopener noreferrer"
            className="text-green-600 hover:underline"
          >
            Contact factory on WhatsApp
          </a>
        </p>
      </div>
    </div>
  );
};

export default Register;