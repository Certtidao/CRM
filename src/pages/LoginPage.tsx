import { useAuth } from "@/lib/auth/AuthProvider";
import { Navigate } from "react-router-dom";

export default function LoginPage() {
  const { user, isStaff, loading, signInWithGoogle } = useAuth();

  if (!loading && user && isStaff) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-sm rounded-lg border bg-card p-8 text-center shadow-sm">
        <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          Certtidão
        </div>
        <h1 className="mt-1 text-xl font-semibold text-foreground">CRM</h1>
        <p className="mt-1 text-sm text-muted-foreground">Acesso restrito à equipe interna.</p>
        <button
          onClick={signInWithGoogle}
          className="mt-6 w-full rounded-md border px-4 py-2 text-sm font-medium hover:bg-accent"
        >
          Continuar com Google
        </button>
      </div>
    </div>
  );
}
