import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export default function IndexRedirect() {
  const { user, userDoc, loading } = useAuth();
  
  if (loading) return null;
  
  if (user && userDoc?.role === "admin") {
    return <Navigate to="/admin" replace />;
  }
  
  return <Navigate to="/home" replace />;
}
