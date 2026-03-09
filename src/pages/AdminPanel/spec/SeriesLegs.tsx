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
  from_sku: "Z kodu SKU (drewniane)",
  built_in_plastic: "Wbudowane plastikowe",
  plastic_2_5: "Plastikowe 2.5cm",
};

export default function SeriesLegs({ seriesId, config }: Props) {
  const [legs, setLegs] = useState<Tables<"legs">[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("legs").select("*").eq("series_id", seriesId).order("code")
      .then(({ data }) => { setLegs(data ?? []); setLoading(false); });
  }, [seriesId]);

  if (loading) return <div className="text-muted-foreground py-8 text-center">Ładowanie...</div>;

  const formatColors = (colors: Json) => {
    if (Array.isArray(colors)) return colors.join(", ");
    return String(colors);
  };

  const mountInfo = [
    { label: "Pod skrzynią", type: "from_sku", height: "z SKU", who: "Dziewczyny od nóżek" },
    { label: "Pod siedziskiem", type: config?.seat_leg_type, height: config?.seat_leg_height_cm, who: config?.seat_leg_type === "built_in_plastic" ? "Nie kompletowane (wbudowane)" : "Dziewczyny od nóżek" },
    { label: "Pufa", type: config?.pufa_leg_type, height: config?.pufa_leg_height_cm, who: config?.pufa_leg_type === "plastic_2_5" ? "Nie kompletowane (plastikowe 2.5cm)" : "Dziewczyny od nóżek" },
    { label: "Fotel", type: "from_sku", height: "15 cm", who: "Dziewczyny od nóżek (4 szt, segment N)" },
  ];

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
          <CardHeader><CardTitle className="text-lg">Kto co montuje</CardTitle></CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Element</TableHead>
                    <TableHead>Typ nóżek</TableHead>
                    <TableHead>Wysokość</TableHead>
                    <TableHead>Kto montuje</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mountInfo.map((info) => (
                    <TableRow key={info.label}>
                      <TableCell className="font-medium">{info.label}</TableCell>
                      <TableCell>{LEG_TYPE_LABELS[info.type ?? ""] ?? info.type ?? "—"}</TableCell>
                      <TableCell>{info.height != null ? `${info.height} cm` : "—"}</TableCell>
                      <TableCell>{info.who}</TableCell>
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
