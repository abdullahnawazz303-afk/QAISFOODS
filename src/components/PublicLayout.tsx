import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { PublicNavbar } from "./PublicNavbar";
import { PublicFooter } from "./PublicFooter";
import { WhatsAppButton } from "./WhatsAppButton";
import { useAuthStore } from "@/stores/authStore";

export function PublicLayout() {
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const loading = useAuthStore((s) => s.loading);
  const restoreSession = useAuthStore((s) => s.restoreSession);

  // Re-sync Supabase session on the public site (keeps portal login after "Back to Site")
  useEffect(() => {
    if (!loading && !isLoggedIn) {
      void restoreSession();
    }
  }, [isLoggedIn, loading, restoreSession]);

  return (
    <div className="min-h-screen flex flex-col">
      <PublicNavbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <PublicFooter />
      <WhatsAppButton />
    </div>
  );
}
