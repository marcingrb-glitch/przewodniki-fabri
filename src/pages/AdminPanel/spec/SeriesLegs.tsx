import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { Json } from "@/integrations/supabase/types";

interface Props {
  seriesId: string;
  config: any;
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

interface LegRow { id: string; code: string; name: string; material: string | null; colors: Json; completed_by: string | null; }
interface ChestRow { id: string; code: string; name: string; leg_height_cm: number; leg_count: number; }
interface AutomatRow { id: string; code: string; name: string; has_seat_legs: boolean; seat_leg_height_cm: number | null; seat_leg_count: number | null; }

export default function SeriesLegs({ seriesId, config, seriesCode }: Props) {
  const [legs, setLegs] = useState<LegRow[]>([]);
  const [chests, setChests] = useState<ChestRow[]>([]);
  const [automats, setAutomats] = useState<AutomatRow[]>([]);
  const [loading, setLoading] = useState(true);

  const availableChests: string[] = config?.available_chests ?? [];

  const fetchAll = async () => {
    setLoading(true);
    const [legsRes, chestsRes, automatsRes] = await Promise.all([
      supabase.from("legs").select("*").order("code"),
      availableChests.length > 0
        ? supabase.from("chests").select("*").in("code", availableChests).order("code")
        : Promise.resolve({ data: [] as ChestRow[] }),
      supabase.from("automats").select("*").eq("series_id", seriesId).order("code"),
    ]);
    setLegs((legsRes.data as any) ?? []);
    setChests((chestsRes.data as any) ?? []);
    setAutomats((automatsRes.data as any) ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, [seriesId, config]);

  if (loading) return <div className="text-muted-foreground py-8 text-center">Ładowanie...</div>;

  // Build mount rows
  interface MountRow { element: string; detail: string; type: string; height: string; count: string; who: string; }
  const mountRows: MountRow[] = [];

  for (const c of chests) {
    const isPlastic = c.leg_height_cm <= 2.5;
    const legCount = c.leg_count ?? 4;
    mountRows.push({
      element: "Pod skrzynią",
      detail: c.code,
      type: isPlastic ? "N4 plastikowe" : "N z SKU",
      height: `${c.leg_height_cm} cm`,
      count: `${legCount} szt`,
      who: isPlastic ? "Tapicer (na stanowisku)" : "Dziewczyny od nóżek (kompletacja do worka)",
    });
  }

  for (const a of automats) {
    if (a.has_seat_legs) {
      const seatType = config?.seat_leg_type ?? "from_sku";
      const isPlastic = seatType === "plastic_2_5";
      mountRows.push({
        element: "Pod siedziskiem",
        detail: a.code,
        type: isPlastic ? "N4 plastikowe" : "N z SKU",
        height: isPlastic ? "2.5 cm" : `${a.seat_leg_height_cm ?? config?.seat_leg_height_cm ?? "?"} cm`,
        count: `${a.seat_leg_count ?? 2} szt`,
        who: isPlastic ? "Tapicer (na stanowisku)" : "Dziewczyny od nóżek (kompletacja do worka)",
      });
    } else {
      mountRows.push({ element: "Pod siedziskiem", detail: a.code, type: "BRAK", height: "—", count: "—", who: "—" });
    }
  }

  if (automats.length === 0 && config) {
    const seatType = config.seat_leg_type ?? "from_sku";
    const isPlastic = seatType === "plastic_2_5";
    mountRows.push({
      element: "Pod siedziskiem", detail: "",
      type: LEG_TYPE_LABELS[seatType] ?? seatType ?? "—",
      height: config.seat_leg_height_cm != null ? `${config.seat_leg_height_cm} cm` : "—",
      count: "—",
      who: isPlastic ? "Tapicer (na stanowisku)" : "Dziewczyny od nóżek (kompletacja do worka)",
    });
  }

  if (config) {
    const pufaType = config.pufa_leg_type ?? "from_sku";
    const isPlastic = pufaType === "plastic_2_5";
    const pufaCount = config.pufa_leg_count ?? 4;
    mountRows.push({
      element: "Pufa", detail: "",
      type: LEG_TYPE_LABELS[pufaType] ?? pufaType ?? "—",
      height: config.pufa_leg_height_cm != null ? `${config.pufa_leg_height_cm} cm` : "—",
      count: `${pufaCount} szt`,
      who: isPlastic ? "Tapicer (na stanowisku)" : "Dziewczyny od nóżek (kompletacja do worka)",
    });
  }

  if (seriesCode !== "S2") {
    mountRows.push({ element: "Fotel", detail: "", type: "N z SKU", height: "15 cm", count: "4 szt", who: "Dziewczyny od nóżek (kompletacja do worka)" });
  }

  return (
    <div className="space-y-6">
      {/* Read-only global legs table */}
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
                ) : legs.map((leg) => (
                  <TableRow key={leg.id}>
                    <TableCell className="font-mono font-bold">{leg.code}</TableCell>
                    <TableCell>{leg.name}</TableCell>
                    <TableCell>{leg.material ?? "—"}</TableCell>
                    <TableCell>{formatColors(leg.colors)}</TableCell>
                    <TableCell>{leg.completed_by ?? "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {config && (
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
      )}
    </div>
  );
}
