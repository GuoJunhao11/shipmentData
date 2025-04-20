import React, { useContext } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { AuthContext } from "../../contexts/AuthContext";

function AdminRoute({ children }) {
  const { isAdmin } = useContext(AuthContext);
  const location = useLocation();

  // 检查是否是管理员
  if (!isAdmin) {
    return <Navigate to="/unauthorized" state={{ from: location }} replace />;
  }

  return children;
}

export default AdminRoute;
