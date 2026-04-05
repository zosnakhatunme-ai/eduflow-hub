import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export default function IndexRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null;
  return <Navigate to="/home" replace />;
}
