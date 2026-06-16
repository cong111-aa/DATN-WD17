import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({ adminOnly = false, children }) => {
  const { isAdmin, user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/user" replace />;
  }

  return children;
};

export default ProtectedRoute;
