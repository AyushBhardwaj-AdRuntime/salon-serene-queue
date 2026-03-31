import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { PublicQueueView } from "@/components/PublicQueueView";
import { useNavigate } from "react-router-dom";

const Salons = () => {
  const navigate = useNavigate();

  return <PublicQueueView onLoginClick={() => navigate("/login")} />;
};

export default Salons;
