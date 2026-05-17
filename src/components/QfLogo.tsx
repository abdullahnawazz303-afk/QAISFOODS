import { cn } from "@/lib/utils";
import { useActiveLanguage } from "@/hooks/useActiveLanguage";

export function QfLogo({ className, isWhite = false }: { className?: string; isWhite?: boolean }) {
  // Check if className contains typical white overrides
  const useWhite = isWhite || className?.includes("text-white") || className?.includes("text-primary-foreground");
  const activeLang = useActiveLanguage();

  if (activeLang === "ur") {
    return (
      <div className={cn("flex items-center justify-center leading-none select-none py-1 gap-1", className)}>
        <span 
          className={cn(
            "font-black text-lg md:text-xl transition-colors tracking-wide leading-none",
            useWhite ? "text-white" : "text-foreground"
          )}
          style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}
        >
          قیس فوڈز
        </span>
        <span 
          className={cn(
            "w-1.5 h-1.5 md:w-2 md:h-2 rounded-full mt-1.5",
            useWhite ? "bg-white" : "bg-primary"
          )}
        />
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col items-start justify-center leading-none select-none", className)}>
      <div className="flex items-center">
        <span 
          className={cn(
            "font-display font-black text-3xl md:text-4xl tracking-tighter transition-colors",
            useWhite ? "text-white" : "text-foreground"
          )}
        >
          QAIS
        </span>
        <span 
          className={cn(
            "w-2 h-2 md:w-2.5 md:h-2.5 rounded-full ml-1 mt-2",
            useWhite ? "bg-white" : "bg-primary"
          )}
        />
      </div>
      <span 
        className={cn(
          "font-bold text-[10px] md:text-xs tracking-[0.4em] uppercase mt-1.5 ml-0.5",
          useWhite ? "text-white/90" : "text-muted-foreground"
        )}
      >
        FOODS
      </span>
    </div>
  );
}
