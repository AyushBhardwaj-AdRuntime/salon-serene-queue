import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { AuthForm } from "@/components/AuthForm";
import { PublicQueueView } from "@/components/PublicQueueView";
import { StaffDashboard } from "@/components/StaffDashboard";
import { Scissors } from "lucide-react";

const Index = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [showLogin, setShowLogin] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Scissors className="w-12 h-12 text-primary mx-auto animate-pulse" />
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // If authenticated, show staff dashboard
  if (isAuthenticated) {
    return <StaffDashboard />;
  }

  // If user clicked login, show auth form
  if (showLogin) {
    return <AuthForm />;
  }

  // Default: show public queue view
  return <PublicQueueView onLoginClick={() => setShowLogin(true)} />;
};

export default Index;
