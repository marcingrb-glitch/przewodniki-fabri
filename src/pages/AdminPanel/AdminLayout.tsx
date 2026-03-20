import { useState, useEffect } from "react";
import { Link, Outlet, useLocation, Navigate } from "react-router-dom";
import { Separator } from "@/components/ui/separator";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { PanelLeftOpen, PanelLeftClose } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminLayout() {
  const location = useLocation();
  const { isAdmin, permissions } = useAuth();
  const [selectedSeriesId, setSelectedSeriesId] = useState<string>(() => localStorage.getItem("admin_series_id") || "");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { data: seriesList = [] } = useQuery({
    queryKey: ["admin-series-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, code, name")
        .eq("category", "series")
        .eq("active", true)
        .order("code");
      if (error) throw error;
      return data as { id: string; code: string; name: string }[];
    },
  });

  useEffect(() => {
    if (selectedSeriesId) localStorage.setItem("admin_series_id", selectedSeriesId);
  }, [selectedSeriesId]);

  useEffect(() => {
    if (!selectedSeriesId && seriesList.length > 0) {
      setSelectedSeriesId(seriesList[0].id);
    }
  }, [seriesList, selectedSeriesId]);

  const firstSeriesCode = seriesList.length > 0 ? seriesList[0].code : "S1";

  // Redirect /admin to appropriate page based on permissions
  if (location.pathname === "/admin") {
    if (isAdmin) return <Navigate to={`/admin/spec/${firstSeriesCode}`} replace />;
    if (permissions.can_view_cheatsheets) return <Navigate to="/admin/cheatsheets" replace />;
    if (permissions.can_view_specs) return <Navigate to={`/admin/spec/${firstSeriesCode}`} replace />;
    return <Navigate to="/" replace />;
  }

  const canViewSpecs = isAdmin || permissions.can_view_specs;
  const canViewCheatsheets = isAdmin || permissions.can_view_cheatsheets;

  const sharedLinks = isAdmin
    ? [
        { to: "/admin/users", label: "👥 Użytkownicy" },
        { to: "/admin/fabrics", label: "Tkaniny" },
        { to: "/admin/finishes", label: "Wykończenia" },
        { to: "/admin/chests", label: "Skrzynie" },
        { to: "/admin/legs", label: "Nóżki" },
        { to: "/admin/automats", label: "Automaty" },
        { to: "/admin/pillows", label: "Poduszki" },
        { to: "/admin/jaskis", label: "Jaśki" },
        { to: "/admin/waleks", label: "Wałki" },
      ]
    : [];

  const skuConfigLinks = isAdmin
    ? [
        { to: "/admin/sku-format", label: "Format SKU" },
        { to: "/admin/side-exceptions", label: "Aliasy SKU" },
        { to: "/admin/label-templates", label: "🏷️ Etykiety" },
        { to: "/admin/guide-templates", label: "📦 Przewodnik Magazyn" },
        { to: "/admin/decoding-templates", label: "🔧 Przewodnik Produkcja" },
      ]
    : [];

  const specLinks = canViewSpecs
    ? seriesList.map(s => ({
        to: `/admin/spec/${s.code}`,
        label: `${s.code} - ${s.name}`,
      }))
    : [];

  const NavItem = ({ to, label, useStartsWith }: { to: string; label: string; useStartsWith?: boolean }) => {
    const active = useStartsWith ? location.pathname.startsWith(to) : location.pathname === to;
    return (
      <Link
        to={to}
        className={cn(
          "block px-3 py-2 rounded-md text-sm transition-colors",
          active ? "bg-primary/10 text-primary font-medium" : "text-foreground hover:bg-primary/5"
        )}
      >
        {label}
      </Link>
    );
  };

  return (
    <div className="flex min-h-[calc(100vh-120px)] relative">
      {/* Toggle button — always visible */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed top-[72px] left-2 z-50 no-print"
        title={sidebarOpen ? "Schowaj menu" : "Pokaż menu"}
      >
        {sidebarOpen ? <PanelLeftClose className="h-5 w-5" /> : <PanelLeftOpen className="h-5 w-5" />}
      </Button>

      {/* Overlay when sidebar open */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-30 no-print"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-[64px] left-0 bottom-0 w-[280px] border-r bg-background p-4 space-y-4 overflow-y-auto z-40 transition-transform duration-200 no-print",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <h2 className="text-lg font-bold px-3 mt-8">
          {isAdmin ? "⚙️ Panel Administracyjny" : "📋 Panel"}
        </h2>

        {sharedLinks.length > 0 && (
          <>
            <div className="space-y-0.5">
              <p className="text-xs font-semibold text-muted-foreground px-3 mb-1 uppercase">Wspólne</p>
              {sharedLinks.map((l) => <NavItem key={l.to} {...l} />)}
            </div>
            <Separator />
          </>
        )}

        {specLinks.length > 0 && (
          <>
            <div className="space-y-0.5">
              <p className="text-xs font-semibold text-muted-foreground px-3 mb-1 uppercase">Specyfikacje produktów</p>
              {specLinks.map((l) => <NavItem key={l.to} {...l} useStartsWith />)}
            </div>
            <Separator />
          </>
        )}

        {skuConfigLinks.length > 0 && (
          <>
            <div className="space-y-0.5">
              <p className="text-xs font-semibold text-muted-foreground px-3 mb-1 uppercase">Konfiguracja SKU</p>
              {skuConfigLinks.map((l) => <NavItem key={l.to} {...l} />)}
            </div>
            <Separator />
          </>
        )}

        {canViewCheatsheets && (
          <div className="space-y-0.5">
            <p className="text-xs font-semibold text-muted-foreground px-3 mb-1 uppercase">Ściągawki</p>
            <NavItem to="/admin/cheatsheets" label="Generator ściągawek" />
          </div>
        )}
      </aside>

      {/* Main content — full width always */}
      <main className="flex-1 p-6">
        <Outlet context={{ selectedSeriesId }} />
      </main>
    </div>
  );
}
