import { NavLink } from "@/components/NavLink";
import { Package, PlusCircle, Clock, Settings, LogOut, Shield } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { ChangePasswordDialog } from "@/components/ChangePasswordDialog";

const Header = () => {
  const { profile, isAdmin, permissions, signOut } = useAuth();
  const hasAnyPermission = isAdmin || permissions.can_view_cheatsheets || permissions.can_view_specs;
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-50 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-lg">
      <div className="container mx-auto flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <Package className="h-7 w-7" />
          <h1 className="text-lg font-bold tracking-tight md:text-xl">
            System Przewodników Produkcyjnych
          </h1>
        </div>

        <nav className="flex items-center gap-1">
          <NavLink
            to="/"
            end
            className="flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-primary-foreground/80 transition-colors hover:bg-primary-foreground/10 hover:text-primary-foreground"
            activeClassName="bg-primary-foreground/15 text-primary-foreground"
          >
            <PlusCircle className="h-4 w-4" />
            <span className="hidden sm:inline">Nowe zamówienie</span>
          </NavLink>
          <NavLink
            to="/history"
            className="flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-primary-foreground/80 transition-colors hover:bg-primary-foreground/10 hover:text-primary-foreground"
            activeClassName="bg-primary-foreground/15 text-primary-foreground"
          >
            <Clock className="h-4 w-4" />
            <span className="hidden sm:inline">Historia</span>
          </NavLink>
          {isAdmin && (
            <NavLink
              to="/admin"
              className="flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-primary-foreground/80 transition-colors hover:bg-primary-foreground/10 hover:text-primary-foreground"
              activeClassName="bg-primary-foreground/15 text-primary-foreground"
            >
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Panel Admin</span>
            </NavLink>
          )}

          <div className="ml-2 flex items-center gap-2 border-l border-primary-foreground/20 pl-3">
            <div className="hidden items-center gap-1.5 sm:flex">
              <span className="text-xs text-primary-foreground/70">
                {profile?.full_name || profile?.email}
              </span>
              {isAdmin && (
                <Badge variant="outline" className="border-primary-foreground/30 text-primary-foreground text-[10px] px-1.5 py-0">
                  <Shield className="h-3 w-3 mr-0.5" />
                  Admin
                </Badge>
              )}
            </div>
            <ChangePasswordDialog />
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10"
              onClick={handleSignOut}
              title="Wyloguj"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </nav>
      </div>
    </header>
  );
};

export default Header;
