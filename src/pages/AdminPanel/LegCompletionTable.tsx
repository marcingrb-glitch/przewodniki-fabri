import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { toast } from "sonner";
import InlineEditCell from "./spec/InlineEditCell";

type ProductRow = Tables<"products">;
type RelationRow = Tables<"product_relations">;

const LEG_TYPE_LABELS: Record<string, string> = {
  from_sku: "N z SKU",
  plastic_2_5: "N4 plastikowe",
};

interface MountRow {
  series: string;
  seriesId: string;
  element: string;
  detail: string;
  type: string;
  height: string;
  count: string;
  who: string;
  editable?: "pufa" | "fotel";
  seriesProps?: Record<string, any>;
}

export default function LegCompletionTable() {
  const [rows, setRows] = useState<MountRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);

    const [seriesRes, chestsRes, automatsRes, automatConfigsRes, extrasRes] = await Promise.all([
      supabase.from("products").select("id, code, name, properties").eq("category", "series").eq("active", true).order("code"),
      supabase.from("products").select("id, code, name, properties").eq("category", "chest").eq("is_global", true).order("code"),
      supabase.from("products").select("id, code, name, properties").eq("category", "automat").eq("is_global", true).order("code"),
      supabase.from("product_relations").select("*").eq("relation_type", "automat_config"),
      supabase.from("products").select("code, series_id").eq("category", "extra"),
    ]);

    const allSeries = (seriesRes.data ?? []) as ProductRow[];
    const allChests = (chestsRes.data ?? []) as ProductRow[];
    const allAutomats = (automatsRes.data ?? []) as ProductRow[];
    const allConfigs = (automatConfigsRes.data ?? []) as RelationRow[];
    const allExtras = (extrasRes.data ?? []) as { code: string; series_id: string | null }[];

    const { data: allowedChestRels } = await supabase
      .from("product_relations")
      .select("series_id, target_product_id")
      .eq("relation_type", "allowed_chest");

    const chestMap = new Map(allChests.map(c => [c.id, c]));
    const automatMap = new Map(allAutomats.map(a => [a.id, a]));

    const seriesChests = new Map<string, string[]>();
    for (const rel of (allowedChestRels ?? [])) {
      if (!rel.series_id || !rel.target_product_id) continue;
      if (!seriesChests.has(rel.series_id)) seriesChests.set(rel.series_id, []);
      seriesChests.get(rel.series_id)!.push(rel.target_product_id);
    }

    const mountRows: MountRow[] = [];

    for (const series of allSeries) {
      const seriesProps = (series.properties as Record<string, any>) ?? {};
      const seriesCode = series.code;

      // Chest legs
      const chestIds = seriesChests.get(series.id) ?? [];
      for (const chestId of chestIds) {
        const chest = chestMap.get(chestId);
        if (!chest) continue;
        const cProps = (chest.properties as Record<string, any>) ?? {};
        const legHeight = cProps.leg_height_cm ?? 0;
        const legCount = cProps.leg_count ?? 4;
        const isPlastic = legHeight <= 2.5;
        mountRows.push({
          series: seriesCode, seriesId: series.id,
          element: "Pod skrzynią",
          detail: chest.code,
          type: isPlastic ? "N4 plastikowe" : "N z SKU",
          height: `${legHeight} cm`,
          count: `${legCount} szt`,
          who: isPlastic ? "Tapicer (na stanowisku)" : "Dziewczyny od nóżek",
        });
      }

      // Seat legs from automat configs
      const seriesConfigs = allConfigs.filter(c => c.series_id === series.id);
      for (const sa of seriesConfigs) {
        const saProps = (sa.properties as Record<string, any>) ?? {};
        const automat = automatMap.get(sa.source_product_id ?? "");
        const automatCode = automat?.code ?? "?";
        const automatName = automat?.name ?? "?";

        if (saProps.has_seat_legs) {
          const seatH = saProps.seat_leg_height_cm ?? 0;
          const seatCount = saProps.seat_leg_count ?? 2;
          const isPlastic = seatH <= 2.5;
          mountRows.push({
            series: seriesCode, seriesId: series.id,
            element: "Pod siedziskiem",
            detail: `${automatCode} (${automatName})`,
            type: isPlastic ? "N4 plastikowe" : "N z SKU",
            height: `${seatH} cm`,
            count: `${seatCount} szt`,
            who: isPlastic ? "Tapicer (na stanowisku)" : "Dziewczyny od nóżek",
          });
        } else {
          mountRows.push({
            series: seriesCode, seriesId: series.id,
            element: "Pod siedziskiem",
            detail: `${automatCode} (${automatName})`,
            type: "BRAK", height: "—", count: "—", who: "—",
          });
        }
      }

      // Pufa
      const hasPufa = allExtras.some(e => e.series_id === series.id && (e.code === "PF" || e.code === "PFO"));
      if (hasPufa) {
        const pufaHeight = seriesProps?.pufa_leg_height_cm;
        const pufaCount = seriesProps?.pufa_leg_count ?? 4;
        mountRows.push({
          series: seriesCode, seriesId: series.id,
          element: "Pufa",
          detail: "",
          type: "N z SKU",
          height: pufaHeight != null ? `${pufaHeight} cm` : "—",
          count: `${pufaCount} szt`,
          who: "Dziewczyny od nóżek",
          editable: "pufa",
          seriesProps,
        });
      }

      // Fotel
      const hasFotel = allExtras.some(e => e.series_id === series.id && e.code === "FT");
      if (hasFotel) {
        mountRows.push({
          series: seriesCode, seriesId: series.id,
          element: "Fotel",
          detail: "",
          type: "N z SKU",
          height: seriesProps?.fotel_leg_height_cm != null ? `${seriesProps.fotel_leg_height_cm} cm` : "15 cm",
          count: `${seriesProps?.fotel_leg_count ?? 4} szt`,
          who: "Dziewczyny od nóżek",
          editable: "fotel",
          seriesProps,
        });
      }
    }

    setRows(mountRows);
    setLoading(false);
  };

  const saveSeriesLegProp = async (seriesId: string, currentProps: Record<string, any>, key: string, value: any) => {
    const updatedProps = { ...currentProps, [key]: value };
    const { error } = await supabase
      .from("products")
      .update({ properties: updatedProps })
      .eq("id", seriesId);
    if (error) toast.error("Błąd zapisu");
    else { toast.success("Zapisano"); fetchData(); }
  };

  if (loading) return <div className="text-muted-foreground py-4 text-center">Ładowanie...</div>;

  return (
    <Card>
      <CardHeader><CardTitle className="text-lg">Kto co kompletuje</CardTitle></CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Seria</TableHead>
                <TableHead>Element</TableHead>
                <TableHead>Szczegóły</TableHead>
                <TableHead>Typ nóżek</TableHead>
                <TableHead>Wysokość</TableHead>
                <TableHead>Ilość</TableHead>
                <TableHead>Kto kompletuje</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-4">Brak danych</TableCell>
                </TableRow>
              ) : rows.map((row, i) => (
                <TableRow key={i} className={row.editable ? "bg-muted/30" : undefined}>
                  <TableCell className="font-mono font-bold">{row.series}</TableCell>
                  <TableCell className="font-medium">{row.element}</TableCell>
                  <TableCell>{row.detail || "—"}</TableCell>

                  {/* Typ nóżek */}
                  <TableCell>{row.type}</TableCell>

                  {/* Wysokość */}
                  <TableCell>
                    {row.editable === "pufa" ? (
                      <div className="flex items-center gap-1">
                        <InlineEditCell
                          value={row.seriesProps?.pufa_leg_height_cm != null ? String(row.seriesProps.pufa_leg_height_cm) : ""}
                          onSave={(v) => saveSeriesLegProp(row.seriesId, row.seriesProps ?? {}, "pufa_leg_height_cm", v ? Number(v) : null)}
                          type="number"
                        />
                        <span className="text-muted-foreground text-xs">cm</span>
                      </div>
                    ) : row.editable === "fotel" ? (
                      <div className="flex items-center gap-1">
                        <InlineEditCell
                          value={row.seriesProps?.fotel_leg_height_cm != null ? String(row.seriesProps.fotel_leg_height_cm) : "15"}
                          onSave={(v) => saveSeriesLegProp(row.seriesId, row.seriesProps ?? {}, "fotel_leg_height_cm", v ? Number(v) : null)}
                          type="number"
                        />
                        <span className="text-muted-foreground text-xs">cm</span>
                      </div>
                    ) : (
                      row.height
                    )}
                  </TableCell>

                  {/* Ilość */}
                  <TableCell>
                    {row.editable === "pufa" ? (
                      <div className="flex items-center gap-1">
                        <InlineEditCell
                          value={String(row.seriesProps?.pufa_leg_count ?? 4)}
                          onSave={(v) => saveSeriesLegProp(row.seriesId, row.seriesProps ?? {}, "pufa_leg_count", v ? Number(v) : 4)}
                          type="number"
                        />
                        <span className="text-muted-foreground text-xs">szt</span>
                      </div>
                    ) : row.editable === "fotel" ? (
                      <div className="flex items-center gap-1">
                        <InlineEditCell
                          value={String(row.seriesProps?.fotel_leg_count ?? 4)}
                          onSave={(v) => saveSeriesLegProp(row.seriesId, row.seriesProps ?? {}, "fotel_leg_count", v ? Number(v) : 4)}
                          type="number"
                        />
                        <span className="text-muted-foreground text-xs">szt</span>
                      </div>
                    ) : (
                      row.count
                    )}
                  </TableCell>

                  <TableCell>{row.who}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
