import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";

interface AuthState {
  user: User | null;
  loading: boolean;
  isStaff: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isStaff, setIsStaff] = useState(false);
  const [loading, setLoading] = useState(true);

  async function checkStaffAndSet(nextUser: User | null) {
    if (!nextUser) {
      setUser(null);
      setIsStaff(false);
      setLoading(false);
      return;
    }
    const { data, error } = await supabase.rpc("is_staff_certtidao");
    if (error || data !== true) {
      await supabase.auth.signOut();
      setUser(null);
      setIsStaff(false);
      setLoading(false);
      return;
    }
    setUser(nextUser);
    setIsStaff(true);
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
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin + "/CRM/" },
    });
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  return (
    <AuthContext.Provider value={{ user, loading, isStaff, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
