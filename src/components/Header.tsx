import { Scissors } from "lucide-react";

export function Header() {
  return (
    <header className="text-center mb-8 animate-fade-in">
      <div className="flex items-center justify-center gap-3 mb-2">
        <div className="p-3 rounded-full bg-primary/10">
          <Scissors className="w-8 h-8 text-primary" />
        </div>
      </div>
      <h1 className="text-3xl md:text-4xl font-serif font-semibold tracking-tight mb-2">
        Salon Queue Manager
      </h1>
      <p className="text-muted-foreground max-w-md mx-auto">
        Efficiently manage your customer waiting list with real-time updates
      </p>
    </header>
  );
}
