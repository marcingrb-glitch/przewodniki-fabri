import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GuideSection, GuideColumn, CONDITION_LABELS, resolveExampleValue } from "./fieldResolver";

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
        <div
          className="border rounded-md bg-background mx-auto overflow-hidden shadow-sm"
          style={{ width: 500, minHeight: 300, maxHeight: 700 }}
        >
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

                    {(() => {
                      const SEAT_FOAM_FIELDS = new Set(["seat.foams_summary", "seat.front", "seat.midStrip_yn"]);
                      const MAX_COLS = 4;

                      const frameCols = cols.filter(c => c.field.startsWith("seat.") && !SEAT_FOAM_FIELDS.has(c.field));
                      const foamCols = cols.filter(c => SEAT_FOAM_FIELDS.has(c.field));
                      const otherCols = cols.filter(c => !c.field.startsWith("seat."));

                      const hasSplit = frameCols.length > 0 && foamCols.length > 0;

                      const renderChunkedTable = (columns: GuideColumn[], keyPrefix: string) => {
                        const chunks: GuideColumn[][] = [];
                        for (let i = 0; i < columns.length; i += MAX_COLS) {
                          chunks.push(columns.slice(i, i + MAX_COLS));
                        }
                        return chunks.map((chunk, chunkIdx) => (
                          <table key={`${keyPrefix}-${chunkIdx}`} className="w-full text-[9px]">
                            <thead>
                              <tr className="bg-muted/30">
                                {chunk.map((col, ci) => (
                                  <th key={ci} className="px-2 py-1 text-left font-semibold border-r border-border last:border-r-0 truncate" style={{ maxWidth: `${100 / chunk.length}%` }}>
                                    {col.header}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              <tr>
                                {chunk.map((col, ci) => (
                                  <td key={ci} className="px-2 py-1 border-r border-border last:border-r-0 truncate text-muted-foreground" style={{ maxWidth: `${100 / chunk.length}%` }}>
                                    {resolveExampleValue(col.field, exampleData)}
                                  </td>
                                ))}
                              </tr>
                            </tbody>
                          </table>
                        ));
                      };

                      if (hasSplit) {
                        return (
                          <>
                            <div className="text-[9px] font-semibold italic bg-muted/20 px-2 py-0.5 text-muted-foreground border-b border-border">Stolarka</div>
                            {renderChunkedTable(frameCols, "frame")}
                            <div className="text-[9px] font-semibold italic bg-muted/20 px-2 py-0.5 text-muted-foreground border-y border-border">Pianki</div>
                            {renderChunkedTable(foamCols, "foam")}
                          </>
                        );
                      }

                      return renderChunkedTable(otherCols.length > 0 ? (frameCols.length > 0 || foamCols.length > 0 ? [...frameCols, ...foamCols, ...otherCols] : cols) : cols, "all");
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
