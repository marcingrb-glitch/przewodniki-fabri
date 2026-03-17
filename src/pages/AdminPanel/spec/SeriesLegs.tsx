import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { Json, Tables } from "@/integrations/supabase/types";

interface Props {
  seriesProductId: string;
  seriesProperties: Record<string, any>;
  seriesCode?: string;
}

const LEG_TYPE_LABELS: Record<string, string> = {
  from_sku: "N z SKU",
  plastic_2_5: "N4 plastikowe",
};

const formatColors = (colors: Json): string => {
  if (!colors) return "—";
  if (typeof colors === "object" && !Array.isArray(colors)) {
    return Object.entries(colors).map(([k, v]) => `${k}=${v}`).join(", ");
  }
  if (Array.isArray(colors)) {
    if (colors.length === 0) return "—";
    if (typeof colors[0] === "object") return colors.map((c: any) => `${c.code}=${c.name}`).join(", ");
    return colors.join(", ");
  }
  return String(colors);
};

type ProductRow = Tables<"products">;
type RelationRow = Tables<"product_relations">;

export default function SeriesLegs({ seriesProductId, seriesProperties }: Props) {
  const [legs, setLegs] = useState<ProductRow[]>([]);
  const [chests, setChests] = useState<ProductRow[]>([]);
  const [seriesAutomats, setSeriesAutomats] = useState<RelationRow[]>([]);
  const [globalAutomats, setGlobalAutomats] = useState<ProductRow[]>([]);
  const [extras, setExtras] = useState<{ code: string }[]>([]);
  const [loading, setLoading] = useState(true);

  const availableChests: string[] = seriesProperties?.available_chests ?? [];

  const fetchAll = async () => {
    setLoading(true);
    const [legsRes, chestsRes, seriesAutomatsRes, globalAutomatsRes, extrasRes] = await Promise.all([
      supabase.from("products").select("id, code, name, properties, colors")
        .eq("category", "leg").eq("is_global", true).order("code"),
      availableChests.length > 0
        ? supabase.from("products").select("id, code, name, properties")
            .eq("category", "chest").in("code", availableChests).order("code")
        : Promise.resolve({ data: [] as ProductRow[] }),
      supabase.from("product_relations")
        .select("id, source_product_id, target_product_id, properties, series_id, relation_type, active, created_at")
        .eq("series_id", seriesProductId).eq("relation_type", "automat_config"),
      supabase.from("products").select("id, code, name, properties")
        .eq("category", "automat").eq("is_global", true).order("code"),
      supabase.from("products").select("code")
        .eq("category", "extra").eq("series_id", seriesProductId),
    ]);
    setLegs((legsRes.data as any) ?? []);
    setChests((chestsRes.data as any) ?? []);
    setSeriesAutomats((seriesAutomatsRes.data as any) ?? []);
    setGlobalAutomats((globalAutomatsRes.data as any) ?? []);
    setExtras(extrasRes.data ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, [seriesProductId]);

  if (loading) return <div className="text-muted-foreground py-8 text-center">Ładowanie...</div>;

  // Build mount rows
  interface MountRow { element: string; detail: string; type: string; height: string; count: string; who: string; }
  const mountRows: MountRow[] = [];

  for (const c of chests) {
    const cProps = (c.properties as Record<string, any>) ?? {};
    const legHeight = cProps.leg_height_cm ?? 0;
    const legCount = cProps.leg_count ?? 4;
    const isPlastic = legHeight <= 2.5;
    mountRows.push({
      element: "Pod skrzynią",
      detail: c.code,
      type: isPlastic ? "N4 plastikowe" : "N z SKU",
      height: `${legHeight} cm`,
      count: `${legCount} szt`,
      who: isPlastic ? "Tapicer (na stanowisku)" : "Dziewczyny od nóżek (kompletacja do worka)",
    });
  }

  const automatMap = new Map(globalAutomats.map(a => [a.id, a]));

  for (const sa of seriesAutomats) {
    const saProps = (sa.properties as Record<string, any>) ?? {};
    const automat = automatMap.get(sa.source_product_id ?? "");
    const automatCode = automat?.code ?? "?";
    const automatName = automat?.name ?? "?";

    if (saProps.has_seat_legs) {
      const seatType = seriesProperties?.seat_leg_type ?? "from_sku";
      const isPlastic = seatType === "plastic_2_5";
      mountRows.push({
        element: "Pod siedziskiem",
        detail: `${automatCode} (${automatName})`,
        type: isPlastic ? "N4 plastikowe" : "N z SKU",
        height: isPlastic ? "2.5 cm" : `${saProps.seat_leg_height_cm ?? seriesProperties?.seat_leg_height_cm ?? "?"} cm`,
        count: `${saProps.seat_leg_count ?? 2} szt`,
        who: isPlastic ? "Tapicer (na stanowisku)" : "Dziewczyny od nóżek (kompletacja do worka)",
      });
    } else {
      mountRows.push({ element: "Pod siedziskiem", detail: `${automatCode} (${automatName})`, type: "BRAK", height: "—", count: "—", who: "—" });
    }
  }

  if (seriesAutomats.length === 0) {
    const seatType = seriesProperties?.seat_leg_type ?? "from_sku";
    const isPlastic = seatType === "plastic_2_5";
    mountRows.push({
      element: "Pod siedziskiem", detail: "",
      type: LEG_TYPE_LABELS[seatType] ?? seatType ?? "—",
      height: seriesProperties?.seat_leg_height_cm != null ? `${seriesProperties.seat_leg_height_cm} cm` : "—",
      count: "—",
      who: isPlastic ? "Tapicer (na stanowisku)" : "Dziewczyny od nóżek (kompletacja do worka)",
    });
  }

  // Data-driven Pufa/Fotel rows
  const hasPufa = extras.some(e => e.code === "PF" || e.code === "PFO");
  const hasFotel = extras.some(e => e.code === "FT");

  if (hasPufa) {
    const pufaType = seriesProperties?.pufa_leg_type ?? "from_sku";
    const isPlastic = pufaType === "plastic_2_5";
    const pufaCount = seriesProperties?.pufa_leg_count ?? 4;
    mountRows.push({
      element: "Pufa", detail: "",
      type: LEG_TYPE_LABELS[pufaType] ?? pufaType ?? "—",
      height: seriesProperties?.pufa_leg_height_cm != null ? `${seriesProperties.pufa_leg_height_cm} cm` : "—",
      count: `${pufaCount} szt`,
      who: isPlastic ? "Tapicer (na stanowisku)" : "Dziewczyny od nóżek (kompletacja do worka)",
    });
  }

  if (hasFotel) {
    mountRows.push({ element: "Fotel", detail: "", type: "N z SKU", height: "15 cm", count: "4 szt", who: "Dziewczyny od nóżek (kompletacja do worka)" });
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Nóżki (katalog globalny)</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">Zarządzanie nóżkami w sekcji <strong>Wspólne → Nóżki</strong></p>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kod</TableHead>
                  <TableHead>Nazwa</TableHead>
                  <TableHead>Materiał</TableHead>
                  <TableHead>Kolory</TableHead>
                  <TableHead>Kto kompletuje</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {legs.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-4">Brak nóżek</TableCell></TableRow>
                ) : legs.map((leg) => {
                  const legProps = (leg.properties as Record<string, any>) ?? {};
                  return (
                    <TableRow key={leg.id}>
                      <TableCell className="font-mono font-bold">{leg.code}</TableCell>
                      <TableCell>{leg.name}</TableCell>
                      <TableCell>{legProps.material ?? "—"}</TableCell>
                      <TableCell>{formatColors(leg.colors)}</TableCell>
                      <TableCell>{legProps.completed_by ?? "—"}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-lg">Kto co kompletuje</CardTitle></CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Element</TableHead>
                  <TableHead>Szczegóły</TableHead>
                  <TableHead>Typ nóżek</TableHead>
                  <TableHead>Wysokość</TableHead>
                  <TableHead>Ilość</TableHead>
                  <TableHead>Kto kompletuje</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mountRows.map((row, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">{row.element}</TableCell>
                    <TableCell>{row.detail || "—"}</TableCell>
                    <TableCell>{row.type}</TableCell>
                    <TableCell>{row.height}</TableCell>
                    <TableCell>{row.count}</TableCell>
                    <TableCell>{row.who}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
