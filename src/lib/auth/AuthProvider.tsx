import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";

interface AuthState {
  user: User | null;
  loading: boolean;
  isStaff: boolean;
  accessDenied: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isStaff, setIsStaff] = useState(false);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);

  async function checkStaffAndSet(nextUser: User | null) {
    if (!nextUser) {
      setUser(null);
      setIsStaff(false);
      setLoading(false);
      return;
    }
    const { data, error } = await supabase.rpc("is_staff_certtidao");
    if (error) {
      // The RPC call itself failed (network/transient error) — we don't know
      // the user's staff status, so don't sign them out. Treat as not-yet-
      // confirmed staff for this render only.
      console.error("is_staff_certtidao RPC failed:", error);
      setUser(nextUser);
      setIsStaff(false);
      setLoading(false);
      return;
    }
    if (data !== true) {
      // RPC succeeded and explicitly confirmed the user is not staff.
      await supabase.auth.signOut({ scope: "local" });
      setUser(null);
      setIsStaff(false);
      setAccessDenied(true);
      setLoading(false);
      return;
    }
    setUser(nextUser);
    setIsStaff(true);
    setAccessDenied(false);
    setLoading(false);
  }

  useEffect(() => {
    // onAuthStateChange fires an INITIAL_SESSION event immediately upon
    // subscription with the current session (or null), so there is no need
    // for a separate supabase.auth.getSession() call — that would run
    // checkStaffAndSet twice (two RPC round-trips + a loading-state flicker)
    // for the same initial session.
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event !== "INITIAL_SESSION") {
        setLoading(true);
      }
      checkStaffAndSet(session?.user ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function signInWithGoogle() {
    setAccessDenied(false);
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin + "/CRM/" },
    });
  }

  async function signOut() {
    await supabase.auth.signOut({ scope: "local" });
  }

  return (
    <AuthContext.Provider value={{ user, loading, isStaff, accessDenied, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
