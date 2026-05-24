import { Link } from "react-router-dom";
import { Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type BackToClientSiteLinkProps = {
  variant?: "button" | "link" | "ghost";
  className?: string;
  showIcon?: boolean;
  label?: string;
};

/** Navigate to the public site without signing out — session is preserved. */
export function BackToClientSiteLink({
  variant = "button",
  className,
  showIcon = true,
  label = "Back to Site",
}: BackToClientSiteLinkProps) {
  if (variant === "link") {
    return (
      <Link
        to="/"
        className={cn(
          "inline-flex items-center gap-2 text-sm font-semibold text-primary underline underline-offset-4 hover:text-primary/90 transition-colors",
          className,
        )}
      >
        {showIcon && <Globe className="h-4 w-4 shrink-0" />}
        {label}
      </Link>
    );
  }

  if (variant === "ghost") {
    return (
      <Button variant="ghost" size="sm" asChild className={cn("gap-2", className)}>
        <Link to="/">
          {showIcon && <Globe className="h-4 w-4 shrink-0" />}
          <span className="hidden sm:inline">{label}</span>
          <span className="sm:hidden">Site</span>
        </Link>
      </Button>
    );
  }

  return (
    <Button variant="outline" size="sm" asChild className={cn("gap-2", className)}>
      <Link to="/">
        {showIcon && <Globe className="h-4 w-4 shrink-0" />}
        {label}
      </Link>
    </Button>
  );
}
