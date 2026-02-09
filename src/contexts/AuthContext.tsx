import { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface Profile {
  id: string;
  email: string;
  full_name: string;
  is_approved: boolean;
}

type AppRole = "admin" | "worker";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  role: AppRole;
  isLoading: boolean;
  isAdmin: boolean;
  isApproved: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<AppRole>("worker");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Set up listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          // Defer Supabase calls to avoid deadlock
          setTimeout(() => {
            fetchProfileAndRole(session.user.id);
          }, 0);
        } else {
          setProfile(null);
          setRole("worker");
          setIsLoading(false);
        }
      }
    );

    // THEN check existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfileAndRole(session.user.id);
      } else {
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfileAndRole = async (userId: string) => {
    try {
      const [profileResult, roleResult] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", userId).single(),
        supabase.from("user_roles").select("role").eq("user_id", userId).single(),
      ]);

      if (profileResult.data) {
        setProfile(profileResult.data as Profile);
      }
      if (roleResult.data) {
        setRole(roleResult.data.role as AppRole);
      }
    } catch (error) {
      console.error("Error fetching profile/role:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setRole("worker");
  };

  const isAdmin = role === "admin";
  const isApproved = isAdmin || (profile?.is_approved ?? false);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        role,
        isLoading,
        isAdmin,
        isApproved,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
