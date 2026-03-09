import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { Json } from "@/integrations/supabase/types";

interface Props {
  seriesId: string;
  config: Tables<"series_config"> | null;
}

const LEG_TYPE_LABELS: Record<string, string> = {
  from_sku: "N z SKU",
  built_in_plastic: "Wbudowane plastikowe",
  plastic_2_5: "N4 plastikowe",
};

const formatColors = (colors: Json) => {
  if (colors && typeof colors === "object" && !Array.isArray(colors)) {
    return Object.entries(colors).map(([k, v]) => `${k}=${v}`).join(", ");
  }
  if (Array.isArray(colors)) return colors.join(", ");
  return String(colors);
};

export default function SeriesLegs({ seriesId, config }: Props) {
  const [legs, setLegs] = useState<Tables<"legs">[]>([]);
  const [chests, setChests] = useState<Tables<"chests">[]>([]);
  const [automats, setAutomats] = useState<Tables<"automats">[]>([]);
  const [loading, setLoading] = useState(true);

  const availableChests: string[] = (config as any)?.available_chests ?? [];

  useEffect(() => {
    const fetchData = async () => {
      const [legsRes, chestsRes, automatsRes] = await Promise.all([
        supabase.from("legs").select("*").eq("series_id", seriesId).order("code"),
        availableChests.length > 0
          ? supabase.from("chests").select("*").in("code", availableChests).order("code")
          : Promise.resolve({ data: [] as Tables<"chests">[] }),
        supabase.from("automats").select("*").eq("series_id", seriesId).order("code"),
      ]);
      setLegs(legsRes.data ?? []);
      setChests(chestsRes.data ?? []);
      setAutomats(automatsRes.data ?? []);
      setLoading(false);
    };
    fetchData();
  }, [seriesId, config]);

  if (loading) return <div className="text-muted-foreground py-8 text-center">Ładowanie...</div>;

  interface MountRow {
    element: string;
    detail: string;
    type: string;
    height: string;
    count: string;
    who: string;
  }

  const mountRows: MountRow[] = [];

  // Chests
  for (const c of chests) {
    if (c.leg_height_cm > 0) {
      mountRows.push({
        element: "Pod skrzynią",
        detail: `${c.code} (${c.name})`,
        type: "N z SKU",
        height: `${c.leg_height_cm} cm`,
        count: "4 szt",
        who: "Dziewczyny od nóżek (kompletacja do worka)",
      });
    } else {
      mountRows.push({
        element: "Pod skrzynią",
        detail: `${c.code} (${c.name})`,
        type: "N4 plastikowe",
        height: "2.5 cm",
        count: "4 szt",
        who: "Nie kompletowane — przy stanowisku",
      });
    }
  }

  // Seats — per automat
  for (const a of automats) {
    if (a.has_seat_legs) {
      const seatType = config?.seat_leg_type ?? "from_sku";
      const who = seatType === "built_in_plastic"
        ? "Tapicer (wbudowane)"
        : "Dziewczyny od nóżek (kompletacja do worka)";
      mountRows.push({
        element: "Pod siedziskiem",
        detail: a.code,
        type: seatType === "built_in_plastic" ? "Wbudowane plastikowe" : "N z SKU",
        height: seatType === "built_in_plastic"
          ? `${config?.seat_leg_height_cm ?? 2.5} cm`
          : `${a.seat_leg_height_cm ?? config?.seat_leg_height_cm ?? "?"} cm`,
        count: `${a.seat_leg_count ?? 2} szt`,
        who,
      });
    } else {
      mountRows.push({
        element: "Pod siedziskiem",
        detail: a.code,
        type: "BRAK",
        height: "—",
        count: "—",
        who: "—",
      });
    }
  }

  // If no automats but config has seat info
  if (automats.length === 0 && config) {
    const seatType = config.seat_leg_type ?? "from_sku";
    const who = seatType === "built_in_plastic"
      ? "Tapicer (wbudowane)"
      : seatType === "plastic_2_5"
        ? "Nie kompletowane — przy stanowisku"
        : "Dziewczyny od nóżek (kompletacja do worka)";
    mountRows.push({
      element: "Pod siedziskiem",
      detail: "",
      type: LEG_TYPE_LABELS[seatType] ?? seatType ?? "—",
      height: config.seat_leg_height_cm != null ? `${config.seat_leg_height_cm} cm` : "—",
      count: "—",
      who,
    });
  }

  // Pufa
  if (config) {
    const pufaType = config.pufa_leg_type ?? "from_sku";
    const who = pufaType === "plastic_2_5"
      ? "Nie kompletowane — przy stanowisku"
      : pufaType === "built_in_plastic"
        ? "Tapicer (wbudowane)"
        : "Dziewczyny od nóżek (kompletacja do worka)";
    mountRows.push({
      element: "Pufa",
      detail: "",
      type: LEG_TYPE_LABELS[pufaType] ?? pufaType ?? "—",
      height: config.pufa_leg_height_cm != null ? `${config.pufa_leg_height_cm} cm` : "—",
      count: "4 szt",
      who,
    });
  }

  // Fotel
  mountRows.push({
    element: "Fotel",
    detail: "",
    type: "N z SKU",
    height: "15 cm",
    count: "4 szt",
    who: "Dziewczyny od nóżek (kompletacja do worka)",
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle className="text-lg">Nóżki</CardTitle></CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kod</TableHead>
                  <TableHead>Nazwa</TableHead>
                  <TableHead>Materiał</TableHead>
                  <TableHead>Kolory</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {legs.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-4">Brak nóżek</TableCell></TableRow>
                ) : legs.map((leg) => (
                  <TableRow key={leg.id}>
                    <TableCell className="font-medium">{leg.code}</TableCell>
                    <TableCell>{leg.name}</TableCell>
                    <TableCell>{leg.material ?? "—"}</TableCell>
                    <TableCell>{formatColors(leg.colors)}</TableCell>
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
