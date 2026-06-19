import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { AuthForm } from "@/components/AuthForm";

const AdminLogin = () => {
  const { isAuthenticated, isAdmin, rolesLoaded, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && isAuthenticated && rolesLoaded && isAdmin) {
      navigate("/admin", { replace: true });
    }
  }, [isAuthenticated, isAdmin, rolesLoaded, isLoading, navigate]);

  return <AuthForm adminMode />;
};

export default AdminLogin;
