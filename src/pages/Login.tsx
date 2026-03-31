import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { AuthForm } from "@/components/AuthForm";

const Login = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  if (isLoading) return null;
  if (isAuthenticated) return null;

  return <AuthForm />;
};

export default Login;
