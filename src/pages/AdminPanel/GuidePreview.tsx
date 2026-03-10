import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface GuideColumn {
  header: string;
  field: string;
}

interface GuideSection {
  id: string;
  product_type: string;
  series_id: string | null;
  section_name: string;
  sort_order: number;
  is_conditional: boolean;
  condition_field: string | null;
  columns: GuideColumn[];
  enabled: boolean;
}

interface GuidePreviewProps {
  sections: GuideSection[];
  productType: string;
  seriesId?: string | null;
}

function useExampleData() {
  return useQuery({
    queryKey: ["guide-preview-example-data"],
    queryFn: async () => {
      const [seatRes, sideRes, backrestRes, chestRes, automatRes, seriesRes, legRes, pufaSeatRes, pillowRes, finishRes, jaskiRes, walekRes] = await Promise.all([
        supabase.from("seats_sofa").select("code, type, frame, front, spring_type, center_strip, model_name, frame_modification").limit(1).maybeSingle(),
        supabase.from("sides").select("code, name, frame").limit(1).maybeSingle(),
        supabase.from("backrests").select("code, height_cm, frame, top, spring_type").limit(1).maybeSingle(),
        supabase.from("chests").select("code, name, leg_height_cm, leg_count").limit(1).maybeSingle(),
        supabase.from("automats").select("code, name, type").limit(1).maybeSingle(),
        supabase.from("series").select("code, name, collection").limit(1).maybeSingle(),
        supabase.from("legs").select("code, name, material, colors").limit(1).maybeSingle(),
        supabase.from("seats_pufa").select("code, front_back, sides, base_foam, box_height").limit(1).maybeSingle(),
        supabase.from("pillows").select("code, name").limit(1).maybeSingle(),
        supabase.from("finishes").select("code, name").limit(1).maybeSingle(),
        supabase.from("jaskis").select("code, name").limit(1).maybeSingle(),
        supabase.from("waleks").select("code, name").limit(1).maybeSingle(),
      ]);
      return {
        seat: seatRes.data, side: sideRes.data, backrest: backrestRes.data,
        chest: chestRes.data, automat: automatRes.data, series: seriesRes.data,
        leg: legRes.data, pufaSeat: pufaSeatRes.data, pillow: pillowRes.data,
        finish: finishRes.data, jaski: jaskiRes.data, walek: walekRes.data,
      };
    },
    staleTime: 5 * 60 * 1000,
  });
}

function resolveExampleValue(field: string, data: any): string {
  if (!data) return "—";
  const v = (val: unknown) => (val != null && val !== "" ? String(val) : "—");
  const finishCode = v(data.finish?.code);
  const finishName = v(data.finish?.name);

  let legColor = "—";
  if (data.leg?.colors && Array.isArray(data.leg.colors) && (data.leg.colors as any[]).length > 0) {
    legColor = (data.leg.colors as any[])[0]?.code || "—";
  }

  const map: Record<string, string> = {
    "seat.code": v(data.seat?.code),
    "seat.finish_name": finishName,
    "seat.code_finish": `${v(data.seat?.code)} (${finishName})`,
    "seat.type": "Wciąg",
    "seat.frame": v(data.seat?.frame),
    "seat.foams_summary": "T25 40×50×10 (1 szt)",
    "seat.front": v(data.seat?.front),
    "seat.springType": v(data.seat?.spring_type),
    "seat.frameModification": v(data.seat?.frame_modification),
    "seat.midStrip_yn": data.seat?.center_strip ? "TAK" : "NIE",
    "backrest.code": v(data.backrest?.code),
    "backrest.finish_name": finishName,
    "backrest.code_finish": `${v(data.backrest?.code)}${finishCode} (${finishName})`,
    "backrest.frame": v(data.backrest?.frame),
    "backrest.foams_summary": "HR35 30×40×8 (1 szt)",
    "backrest.top": v(data.backrest?.top),
    "backrest.springType": v(data.backrest?.spring_type),
    "side.code": v(data.side?.code),
    "side.finish_name": finishName,
    "side.code_finish": `${v(data.side?.code)}${finishCode} (${finishName})`,
    "side.frame": v(data.side?.frame),
    "side.foam": "—",
    "chest.name": v(data.chest?.name),
    "chest_automat.label": `${v(data.chest?.code)} + ${v(data.automat?.code)}`,
    "automat.code_name": `${v(data.automat?.code)} - ${v(data.automat?.name)}`,
    "legs.code_color": `${v(data.leg?.code)}${legColor !== "—" ? legColor : ""}`,
    "legHeights.sofa_chest_info": data.chest ? `${v(data.leg?.name)} H ${v(data.chest?.leg_height_cm)}cm (${v(data.chest?.leg_count)} szt)` : "—",
    "legHeights.sofa_seat_info": "BRAK",
    "pillow.code": v(data.pillow?.code),
    "pillow.name": v(data.pillow?.name),
    "pillow.finish_info": `${finishCode} (${finishName})`,
    "jaski.code": v(data.jaski?.code),
    "jaski.name": v(data.jaski?.name),
    "jaski.finish_info": `${finishCode} (${finishName})`,
    "walek.code": v(data.walek?.code),
    "walek.name": v(data.walek?.name),
    "walek.finish_info": `${finishCode} (${finishName})`,
    "pufaSeat.frontBack": v(data.pufaSeat?.front_back),
    "pufaSeat.sides": v(data.pufaSeat?.sides),
    "pufaSeat.foam": v(data.pufaSeat?.base_foam),
    "pufaSeat.box": v(data.pufaSeat?.box_height),
    "pufaLegs.code": v(data.leg?.code),
    "pufaLegs.count_info": "4 szt",
    "pufaLegs.height_info": "H 15cm",
    "fotelLegs.code": v(data.leg?.code),
    "fotelLegs.count_info": "4 szt",
    "fotelLegs.height_info": "H 15cm",
    "extras.label": "Dodatki",
    "extras.pufa_sku": "PUFA-SKU-001",
    "extras.fotel_sku": "FOTEL-SKU-001",
  };

  return map[field] || field;
}

const CONDITION_LABELS: Record<string, string> = {
  pillow: "poduszka",
  jaski: "jaśki",
  walek: "wałek",
  pufaLegs: "nóżki pufy",
  fotelLegs: "nóżki fotela",
  extras_pufa_fotel: "pufa/fotel w dodatkach",
};

const PRODUCT_LABELS: Record<string, string> = {
  sofa: "SOFA",
  pufa: "PUFA",
  fotel: "FOTEL",
};

export default function GuidePreview({ sections, productType, seriesId }: GuidePreviewProps) {
  const { data: exampleData, isLoading } = useExampleData();

  const enabledSections = useMemo(
    () => sections.filter(s => s.enabled),
    [sections]
  );

  const seriesLabel = exampleData?.series
    ? `${exampleData.series.code} - ${exampleData.series.name} [${exampleData.series.collection || ""}]`
    : "S1 - Seria przykładowa [Kolekcja]";

  const prefix = PRODUCT_LABELS[productType];

  if (enabledSections.length === 0 && !isLoading) {
    return (
      <Card className="mt-4">
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          Brak aktywnych sekcji do podglądu.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-4">
      <CardHeader className="py-3 px-4">
        <CardTitle className="text-sm font-semibold">
          📄 Podgląd przewodnika ({prefix})
          {seriesId && <Badge variant="secondary" className="ml-2 text-[10px]">Seria: {seriesLabel}</Badge>}
          {!seriesId && <Badge variant="outline" className="ml-2 text-[10px]">Globalny</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        {/* A4 mockup container — scaled proportionally */}
        <div
          className="border rounded-md bg-background mx-auto overflow-hidden shadow-sm"
          style={{ width: 500, minHeight: 300, maxHeight: 700 }}
        >
          {/* Header section */}
          <div className="px-5 pt-4 pb-2 space-y-0.5">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold">
                  {prefix ? `${prefix} — ` : ""}NUMER ZAMÓWIENIA: 12345
                </p>
                <p className="text-[10px] text-muted-foreground">
                  Data złożenia zamówienia: 2026-03-10
                </p>
              </div>
              <p className="text-[10px] font-medium text-right">{seriesLabel}</p>
            </div>
            <p className="text-[10px] text-muted-foreground font-mono">
              SKU: {productType === "pufa" ? "PUFA-SKU-EXAMPLE" : productType === "fotel" ? "FOTEL-SKU-EXAMPLE" : "S1-N01A-O01A-B01-SK15-AU01-N01BK"}
            </p>
          </div>

          {/* Sections */}
          <div className="px-5 pb-4 space-y-3">
            {isLoading ? (
              <p className="text-xs text-muted-foreground py-4 text-center">Ładowanie danych przykładowych...</p>
            ) : (
              enabledSections.map(section => {
                const cols = section.columns as GuideColumn[];
                if (cols.length === 0) return null;

                const isConditional = section.is_conditional;
                const condLabel = section.condition_field ? CONDITION_LABELS[section.condition_field] || section.condition_field : "";

                return (
                  <div
                    key={section.id}
                    className={`rounded overflow-hidden ${
                      isConditional
                        ? "border border-dashed border-muted-foreground/40"
                        : "border border-border"
                    }`}
                  >
                    {/* Section name bar */}
                    <div className={`px-2 py-1 flex items-center gap-2 ${
                      isConditional ? "bg-muted/30" : "bg-muted/60"
                    }`}>
                      <span className="text-[10px] font-bold uppercase tracking-wide">
                        {section.section_name}
                      </span>
                      {isConditional && (
                        <Badge variant="outline" className="text-[8px] h-4 px-1 font-normal border-dashed">
                          warunkowa: {condLabel}
                        </Badge>
                      )}
                    </div>

                    {/* Mini table(s) — chunked if >6 columns */}
                    {(() => {
                      const MAX_COLS = 4;
                      const chunks: GuideColumn[][] = [];
                      for (let i = 0; i < cols.length; i += MAX_COLS) {
                        chunks.push(cols.slice(i, i + MAX_COLS));
                      }
                      return chunks.map((chunk, chunkIdx) => (
                        <table key={chunkIdx} className="w-full text-[9px]">
                          <thead>
                            <tr className="bg-muted/30">
                              {chunk.map((col, ci) => (
                                <th
                                  key={ci}
                                  className="px-2 py-1 text-left font-semibold border-r border-border last:border-r-0 truncate"
                                  style={{ maxWidth: `${100 / chunk.length}%` }}
                                >
                                  {col.header}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              {chunk.map((col, ci) => (
                                <td
                                  key={ci}
                                  className="px-2 py-1 border-r border-border last:border-r-0 truncate text-muted-foreground"
                                  style={{ maxWidth: `${100 / chunk.length}%` }}
                                >
                                  {resolveExampleValue(col.field, exampleData)}
                                </td>
                              ))}
                            </tr>
                          </tbody>
                        </table>
                      ));
                    })()}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
