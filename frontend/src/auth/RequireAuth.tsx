import { Navigate, useLocation } from "react-router-dom";
import { Spinner } from "../shared/ui";
import { useAuth } from "./AuthContext";

/** UX guard only. Real authorization is enforced by the backend on every request. */
export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const loc = useLocation();
  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/login" replace state={{ from: loc.pathname }} />;
  return <>{children}</>;
}
