import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";

interface Props {
  seriesId: string;
  config: Tables<"series_config"> | null;
}

const LEG_TYPE_LABELS: Record<string, string> = {
  from_sku: "Z kodu SKU (drewniane)",
  built_in_plastic: "Wbudowane plastikowe",
  plastic_2_5: "Plastikowe 2.5cm",
};

export default function SeriesPufa({ seriesId, config }: Props) {
  const [pufas, setPufas] = useState<Tables<"seats_pufa">[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("seats_pufa").select("*").eq("series_id", seriesId).order("code")
      .then(({ data }) => { setPufas(data ?? []); setLoading(false); });
  }, [seriesId]);

  if (loading) return <div className="text-muted-foreground py-8 text-center">Ładowanie...</div>;

  return (
    <div className="space-y-4">
      {config && (
        <Card>
          <CardContent className="py-4">
            <div className="flex gap-4 text-sm">
              <Badge variant="outline">
                Nóżki: {LEG_TYPE_LABELS[config.pufa_leg_type ?? ""] ?? config.pufa_leg_type ?? "—"}
              </Badge>
              {config.pufa_leg_height_cm != null && (
                <Badge variant="outline">Wysokość: {config.pufa_leg_height_cm} cm</Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle className="text-lg">Siedziska pufy</CardTitle></CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kod</TableHead>
                  <TableHead>Przód/Tył</TableHead>
                  <TableHead>Boki</TableHead>
                  <TableHead>Pianka bazowa</TableHead>
                  <TableHead>Wysokość skrzyni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pufas.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-4">Brak siedzisk pufy</TableCell></TableRow>
                ) : pufas.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.code}</TableCell>
                    <TableCell>{p.front_back ?? "—"}</TableCell>
                    <TableCell>{p.sides ?? "—"}</TableCell>
                    <TableCell>{p.base_foam ?? "—"}</TableCell>
                    <TableCell>{p.box_height ?? "—"}</TableCell>
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
