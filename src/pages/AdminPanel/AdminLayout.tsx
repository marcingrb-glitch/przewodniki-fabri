import { useState, useEffect } from "react";
import { Link, Outlet, useLocation, Navigate } from "react-router-dom";
import { Separator } from "@/components/ui/separator";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

const sharedLinks = [
  { to: "/admin/users", label: "👥 Użytkownicy" },
  { to: "/admin/fabrics", label: "Tkaniny" },
  { to: "/admin/finishes", label: "Wykończenia" },
  { to: "/admin/chests", label: "Skrzynie" },
  { to: "/admin/legs", label: "Nóżki" },
  { to: "/admin/pillows", label: "Poduszki" },
  { to: "/admin/jaskis", label: "Jaśki" },
  { to: "/admin/waleks", label: "Wałki" },
];

const skuConfigLinks = [
  { to: "/admin/parse-rules", label: "Reguły parsowania" },
  { to: "/admin/side-exceptions", label: "Wyjątki boczków" },
];

export default function AdminLayout() {
  const location = useLocation();
  const [selectedSeriesId, setSelectedSeriesId] = useState<string>(() => localStorage.getItem("admin_series_id") || "");

  const { data: seriesList = [] } = useQuery({
    queryKey: ["admin-series-list"],
    queryFn: async () => {
      const { data, error } = await supabase.from("series").select("id, code, name").order("code");
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

  if (location.pathname === "/admin") return <Navigate to={`/admin/spec/${firstSeriesCode}`} replace />;

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

  const specLinks = seriesList.map(s => ({
    to: `/admin/spec/${s.code}`,
    label: `${s.code} - ${s.name}`,
  }));

  return (
    <div className="flex min-h-[calc(100vh-120px)]">
      <aside className="w-[280px] shrink-0 border-r bg-muted/30 p-4 space-y-4 sticky top-0 self-start">
        <h2 className="text-lg font-bold px-3">⚙️ Panel Administracyjny</h2>

        <div className="space-y-0.5">
          <p className="text-xs font-semibold text-muted-foreground px-3 mb-1 uppercase">Wspólne</p>
          {sharedLinks.map((l) => <NavItem key={l.to} {...l} />)}
        </div>

        <Separator />

        <div className="space-y-0.5">
          <p className="text-xs font-semibold text-muted-foreground px-3 mb-1 uppercase">Specyfikacje produktów</p>
          {specLinks.map((l) => <NavItem key={l.to} {...l} useStartsWith />)}
        </div>

        <Separator />

        <div className="space-y-0.5">
          <p className="text-xs font-semibold text-muted-foreground px-3 mb-1 uppercase">Konfiguracja SKU</p>
          {skuConfigLinks.map((l) => <NavItem key={l.to} {...l} />)}
        </div>

        <Separator />

        <div className="space-y-0.5">
          <p className="text-xs font-semibold text-muted-foreground px-3 mb-1 uppercase">Ściągawki</p>
          <NavItem to="/admin/cheatsheets" label="Generator ściągawek" />
        </div>
      </aside>

      <main className="flex-1 p-6">
        <Outlet context={{ selectedSeriesId }} />
      </main>
    </div>
  );
}
