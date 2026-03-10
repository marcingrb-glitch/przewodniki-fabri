import { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface Profile {
  id: string;
  email: string;
  full_name: string;
  is_approved: boolean;
}

export interface UserPermissions {
  can_view_cheatsheets: boolean;
  can_view_specs: boolean;
}

type AppRole = "admin" | "worker";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  role: AppRole;
  permissions: UserPermissions;
  isLoading: boolean;
  isAdmin: boolean;
  isApproved: boolean;
  signOut: () => Promise<void>;
}

const defaultPermissions: UserPermissions = { can_view_cheatsheets: false, can_view_specs: false };

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<AppRole>("worker");
  const [permissions, setPermissions] = useState<UserPermissions>(defaultPermissions);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          setTimeout(() => {
            fetchProfileAndRole(session.user.id);
          }, 0);
        } else {
          setProfile(null);
          setRole("worker");
          setPermissions(defaultPermissions);
          setIsLoading(false);
        }
      }
    );

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
      const [profileResult, roleResult, permResult] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", userId).single(),
        supabase.from("user_roles").select("role").eq("user_id", userId).single(),
        supabase.from("user_permissions").select("can_view_cheatsheets, can_view_specs").eq("user_id", userId).maybeSingle(),
      ]);

      if (profileResult.data) {
        setProfile(profileResult.data as Profile);
      }
      if (roleResult.data) {
        setRole(roleResult.data.role as AppRole);
      }
      if (permResult.data) {
        setPermissions({
          can_view_cheatsheets: permResult.data.can_view_cheatsheets ?? false,
          can_view_specs: permResult.data.can_view_specs ?? false,
        });
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
    setPermissions(defaultPermissions);
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
        permissions,
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
