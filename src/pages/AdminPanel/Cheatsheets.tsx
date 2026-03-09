import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import MagazynSheet from "./cheatsheets/MagazynSheet";
import KrojowniaSheet from "./cheatsheets/KrojowniaSheet";
import NozkiSheet from "./cheatsheets/NozkiSheet";
import KierownikSheet from "./cheatsheets/KierownikSheet";

const stations = [
  { id: "magazyn", label: "📦 Magazyn stolarki i pianek", icon: "📦" },
  { id: "krojownia", label: "✂️ Krojownia (wykroje)", icon: "✂️" },
  { id: "nozki", label: "👟 Kompletacja nóżek", icon: "👟" },
  { id: "kierownik", label: "👔 Kierownik produkcji", icon: "👔" },
] as const;

type StationId = typeof stations[number]["id"];

export default function Cheatsheets() {
  const [selectedSeriesId, setSelectedSeriesId] = useState<string>("");
  const [selectedStation, setSelectedStation] = useState<StationId | "">("");

  const { data: seriesList = [] } = useQuery({
    queryKey: ["cheatsheet-series"],
    queryFn: async () => {
      const { data, error } = await supabase.from("series").select("id, code, name").order("code");
      if (error) throw error;
      return data;
    },
  });

  const selectedSeries = seriesList.find(s => s.id === selectedSeriesId);

  const renderSheet = () => {
    if (!selectedSeriesId || !selectedStation) return null;
    const props = { seriesId: selectedSeriesId, seriesCode: selectedSeries?.code ?? "", seriesName: selectedSeries?.name ?? "" };
    switch (selectedStation) {
      case "magazyn": return <MagazynSheet {...props} />;
      case "krojownia": return <KrojowniaSheet {...props} />;
      case "nozki": return <NozkiSheet {...props} />;
      case "kierownik": return <KierownikSheet {...props} />;
    }
  };

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
            {stations.map(st => (
              <Button
                key={st.id}
                variant={selectedStation === st.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedStation(st.id)}
              >
                {st.label}
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
          {renderSheet()}
        </div>
      )}
    </div>
  );
}
