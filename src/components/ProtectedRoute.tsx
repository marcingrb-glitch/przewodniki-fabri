import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, ShieldAlert, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
  /** Allow workers who have specific permission */
  requiredPermission?: "can_view_cheatsheets" | "can_view_specs";
}

export function ProtectedRoute({ children, adminOnly = false, requiredPermission }: ProtectedRouteProps) {
  const { user, isLoading, isAdmin, isApproved, permissions, signOut } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!isApproved) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="text-center max-w-md space-y-4">
          <Clock className="h-16 w-16 mx-auto text-warning" />
          <h2 className="text-2xl font-bold text-foreground">Oczekiwanie na akceptację</h2>
          <p className="text-muted-foreground">
            Twoje konto zostało utworzone, ale wymaga akceptacji przez administratora.
            Skontaktuj się z administratorem, aby uzyskać dostęp.
          </p>
          <Button variant="outline" onClick={() => signOut()}>
            Wyloguj się
          </Button>
        </div>
      </div>
    );
  }

  // Admin always has access
  if (isAdmin) {
    return <>{children}</>;
  }

  // Check permission-based access
  if (requiredPermission) {
    if (permissions[requiredPermission]) {
      return <>{children}</>;
    }
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center space-y-3">
          <ShieldAlert className="h-16 w-16 mx-auto text-destructive/60" />
          <h2 className="text-xl font-semibold">Brak dostępu</h2>
          <p className="text-muted-foreground">Nie masz uprawnień do tej sekcji.</p>
        </div>
      </div>
    );
  }

  if (adminOnly) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center space-y-3">
          <ShieldAlert className="h-16 w-16 mx-auto text-destructive/60" />
          <h2 className="text-xl font-semibold">Brak dostępu</h2>
          <p className="text-muted-foreground">Tylko administrator ma dostęp do tej strony.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
