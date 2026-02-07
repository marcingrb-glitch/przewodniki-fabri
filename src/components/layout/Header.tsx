import { NavLink } from "@/components/NavLink";
import { Package, PlusCircle, Clock, Settings } from "lucide-react";

const Header = () => {
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
          <NavLink
            to="/admin"
            className="flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-primary-foreground/80 transition-colors hover:bg-primary-foreground/10 hover:text-primary-foreground"
            activeClassName="bg-primary-foreground/15 text-primary-foreground"
          >
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Panel Admin</span>
          </NavLink>
        </nav>
      </div>
    </header>
  );
};

export default Header;
