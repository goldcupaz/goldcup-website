import { Navigate } from "react-router-dom";

/** Legacy URL — use /admin */
export function AdminLogin() {
  return <Navigate to="/admin" replace />;
}
