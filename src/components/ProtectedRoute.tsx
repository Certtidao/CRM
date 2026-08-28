import { Navigate } from "react-router-dom";
import { useAuth } from "@/lib/auth/AuthProvider";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, isStaff } = useAuth();
  if (loading) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">Carregando…</div>;
  }
  if (!user || !isStaff) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}
