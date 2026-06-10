import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Scissors } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { cn } from "@/lib/utils";

interface AppHeaderProps {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  backTo?: string;
  variant?: "default" | "gradient";
  right?: React.ReactNode;
  className?: string;
}

export function AppHeader({
  title,
  subtitle,
  showBack = true,
  backTo,
  variant = "default",
  right,
  className,
}: AppHeaderProps) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (backTo) navigate(backTo);
    else if (window.history.length > 1) navigate(-1);
    else navigate("/");
  };

  const isGradient = variant === "gradient";

  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b backdrop-blur-md",
        isGradient
          ? "bg-gradient-to-r from-primary/90 to-primary/70 text-primary-foreground border-transparent"
          : "bg-card/80",
        className,
      )}
    >
      <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          {showBack && (
            <Button
              variant={isGradient ? "secondary" : "ghost"}
              size="icon"
              onClick={handleBack}
              aria-label="Go back"
              className="rounded-full shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
          )}
          <Link
            to="/"
            aria-label="Go to home"
            className="flex items-center gap-2 min-w-0 group"
          >
            <div
              className={cn(
                "p-2 rounded-xl transition-transform group-hover:scale-105",
                isGradient ? "bg-primary-foreground/15 backdrop-blur-sm" : "bg-primary/10",
              )}
            >
              <Scissors className={cn("w-5 h-5", isGradient ? "" : "text-primary")} />
            </div>
            <div className="min-w-0">
              <div
                className={cn(
                  "text-base font-serif font-bold leading-tight truncate",
                  isGradient ? "" : "text-foreground",
                )}
              >
                {title ?? "SalonQ"}
              </div>
              {subtitle && (
                <div
                  className={cn(
                    "text-xs leading-tight truncate",
                    isGradient ? "opacity-80" : "text-muted-foreground",
                  )}
                >
                  {subtitle}
                </div>
              )}
            </div>
          </Link>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {right}
          <ThemeToggle
            className={cn(
              isGradient && "text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground",
            )}
          />
        </div>
      </div>
    </header>
  );
}
