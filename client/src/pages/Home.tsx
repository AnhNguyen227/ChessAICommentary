import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Home() {
  const { user, loading } = useAuth();
  if (loading) return null;
  return <Navigate to={user ? "/dashboard" : "/login"} replace />;
}

export default Home;
