import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import CheatsheetRenderer from "./cheatsheets/CheatsheetRenderer";

export default function Cheatsheets() {
  const [selectedSeriesId, setSelectedSeriesId] = useState<string>("");
  const [selectedStation, setSelectedStation] = useState<string>("");

  // Load series from products table (category='series')
  const { data: seriesList = [] } = useQuery({
    queryKey: ["cheatsheet-series-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, code, name, properties")
        .eq("category", "series")
        .eq("active", true)
        .order("code");
      if (error) throw error;
      return data;
    },
  });

  // Load workstations that have cheatsheet sections
  const { data: stations = [] } = useQuery({
    queryKey: ["cheatsheet-workstations"],
    queryFn: async () => {
      // Get distinct workstation IDs from active sections
      const { data: sections } = await supabase
        .from("cheatsheet_sections")
        .select("workstation_id")
        .eq("active", true);
      const wsIds = [...new Set((sections ?? []).map((s: any) => s.workstation_id))];
      if (wsIds.length === 0) return [];
      const { data: ws } = await supabase
        .from("workstations")
        .select("*")
        .in("id", wsIds)
        .eq("active", true)
        .order("sort_order");
      return ws ?? [];
    },
  });

  const stationIcons: Record<string, string> = {
    magazyn: "📦",
    krojownia: "✂️",
    nozki: "👟",
    kierownik: "👔",
  };

  const selectedSeries = seriesList.find(s => s.id === selectedSeriesId);

  return (
    <div className="space-y-6">
      <div className="no-print flex flex-wrap items-end gap-4">
        <div className="space-y-1">
          <label className="text-sm font-medium text-muted-foreground">Seria</label>
          <Select value={selectedSeriesId} onValueChange={setSelectedSeriesId}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Wybierz serię" />
            </SelectTrigger>
            <SelectContent>
              {seriesList.map(s => (
                <SelectItem key={s.id} value={s.id}>{s.code} — {s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-muted-foreground">Stanowisko</label>
          <div className="flex gap-2 flex-wrap">
            {stations.map((st: any) => (
              <Button
                key={st.id}
                variant={selectedStation === st.code ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedStation(st.code)}
              >
                {stationIcons[st.code] ?? "📋"} {st.name}
              </Button>
            ))}
          </div>
        </div>

        {selectedSeriesId && selectedStation && (
          <Button onClick={() => window.print()} className="ml-auto" size="sm">
            <Printer className="mr-1 h-4 w-4" /> Drukuj
          </Button>
        )}
      </div>

      {!selectedSeriesId || !selectedStation ? (
        <div className="text-center text-muted-foreground py-16">
          Wybierz serię i stanowisko, aby wygenerować ściągawkę.
        </div>
      ) : (
        <div className="print-area">
          <CheatsheetRenderer
            seriesProductId={selectedSeriesId}
            workstationCode={selectedStation}
            seriesCode={selectedSeries?.code ?? ""}
            seriesName={selectedSeries?.name ?? ""}
          />
        </div>
      )}
    </div>
  );
}
