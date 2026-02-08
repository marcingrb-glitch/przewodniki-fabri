import { useState, useEffect } from "react";
import { Link, Outlet, useLocation, Navigate } from "react-router-dom";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

const sharedLinks = [
  { to: "/admin/series", label: "Serie" },
  { to: "/admin/fabrics", label: "Tkaniny" },
  { to: "/admin/chests", label: "Skrzynie" },
  { to: "/admin/automats", label: "Automaty" },
  { to: "/admin/pillows", label: "Poduszki" },
  { to: "/admin/jaskis", label: "Jaśki" },
  { to: "/admin/waleks", label: "Wałki" },
  { to: "/admin/finishes", label: "Wykończenia" },
];

const seriesLinks = [
  { to: "/admin/seats-sofa", label: "Siedziska Sofa" },
  { to: "/admin/seats-pufa", label: "Siedziska Pufa" },
  { to: "/admin/backrests", label: "Oparcia" },
  { to: "/admin/sides", label: "Boczki" },
  { to: "/admin/legs", label: "Nóżki" },
  { to: "/admin/extras", label: "Dodatki" },
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

  // Auto-select first series if none selected
  useEffect(() => {
    if (!selectedSeriesId && seriesList.length > 0) {
      setSelectedSeriesId(seriesList[0].id);
    }
  }, [seriesList, selectedSeriesId]);

  if (location.pathname === "/admin") return <Navigate to="/admin/series" replace />;

  const NavItem = ({ to, label }: { to: string; label: string }) => {
    const active = location.pathname === to;
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
    <div className="flex min-h-[calc(100vh-120px)]">
      {/* Sidebar */}
      <aside className="w-[280px] shrink-0 border-r bg-muted/30 p-4 space-y-4 sticky top-0 self-start">
        <h2 className="text-lg font-bold px-3">⚙️ Panel Administracyjny</h2>

        <div className="space-y-0.5">
          <p className="text-xs font-semibold text-muted-foreground px-3 mb-1 uppercase">Wspólne</p>
          {sharedLinks.map((l) => <NavItem key={l.to} {...l} />)}
        </div>

        <Separator />

        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground px-3 uppercase">Seria</p>
          <div className="px-3">
            <Select value={selectedSeriesId} onValueChange={setSelectedSeriesId}>
              <SelectTrigger><SelectValue placeholder="Wybierz serię..." /></SelectTrigger>
              <SelectContent>
                {seriesList.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.code} - {s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-0.5">
            <p className="text-xs font-semibold text-muted-foreground px-3 mb-1 uppercase">Specyficzne dla serii</p>
            {seriesLinks.map((l) => <NavItem key={l.to} {...l} />)}
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-6">
        <Outlet context={{ selectedSeriesId }} />
      </main>
    </div>
  );
}
