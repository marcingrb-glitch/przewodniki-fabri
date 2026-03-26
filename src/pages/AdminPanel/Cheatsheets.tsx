import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import html2pdf from "html2pdf.js";
import CheatsheetRenderer from "./cheatsheets/CheatsheetRenderer";
import { useCheatsheetData } from "./cheatsheets/useCheatsheetData";

export default function Cheatsheets() {
  const [selectedSeriesId, setSelectedSeriesId] = useState<string>("");
  const [selectedStation, setSelectedStation] = useState<string>("");
  const [downloading, setDownloading] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

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

  const { data: stations = [] } = useQuery({
    queryKey: ["cheatsheet-workstations"],
    queryFn: async () => {
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
    boczki: "🛋️",
  };

  const selectedSeries = seriesList.find(s => s.id === selectedSeriesId);

  const cheatsheetData = useCheatsheetData(selectedSeriesId, selectedStation);

  async function handleDownloadPdf() {
    const el = printRef.current;
    if (!el || downloading) return;
    setDownloading(true);
    try {
      const filename = `sciagawka-${selectedStation}-${selectedSeries?.code ?? "X"}.pdf`;
      await html2pdf()
        .set({
          margin: 10,
          filename,
          image: { type: "jpeg", quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, windowWidth: 1100 },
          jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
          pagebreak: { mode: ["avoid-all", "css", "legacy"] },
        })
        .from(el)
        .save();
    } finally {
      setDownloading(false);
    }
  }

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
          <div className="flex gap-2 ml-auto">
            <Button onClick={handleDownloadPdf} size="sm" variant="outline" disabled={downloading}>
              <Download className="mr-1 h-4 w-4" /> {downloading ? "Generuję..." : "Pobierz PDF"}
            </Button>
          </div>
        )}
      </div>

      {!selectedSeriesId || !selectedStation ? (
        <div className="text-center text-muted-foreground py-16">
          Wybierz serię i stanowisko, aby wygenerować ściągawkę.
        </div>
      ) : (
        <div className="print-area" ref={printRef}>
          <CheatsheetRenderer
            data={cheatsheetData}
            workstationCode={selectedStation}
            seriesCode={selectedSeries?.code ?? ""}
            seriesName={selectedSeries?.name ?? ""}
          />
        </div>
      )}
    </div>
  );
}
