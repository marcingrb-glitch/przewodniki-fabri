import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";

interface Props {
  seriesId: string;
}

export default function SeriesBackrests({ seriesId }: Props) {
  const [backrests, setBackrests] = useState<Tables<"backrests">[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("backrests").select("*").eq("series_id", seriesId).order("code")
      .then(({ data }) => { setBackrests(data ?? []); setLoading(false); });
  }, [seriesId]);

  if (loading) return <div className="text-muted-foreground py-8 text-center">Ładowanie...</div>;

  return (
    <Card>
      <CardHeader><CardTitle className="text-lg">Oparcia</CardTitle></CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kod</TableHead>
                <TableHead>Wysokość</TableHead>
                <TableHead>Stelaż</TableHead>
                <TableHead>Pianka</TableHead>
                <TableHead>Góra</TableHead>
                <TableHead>Wykończenia</TableHead>
                <TableHead>Domyślne</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {backrests.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-4">Brak oparć</TableCell></TableRow>
              ) : backrests.map((b) => (
                <TableRow key={b.id}>
                  <TableCell className="font-medium">{b.code}</TableCell>
                  <TableCell>{b.height_cm ?? "—"}</TableCell>
                  <TableCell>{b.frame ?? "—"}</TableCell>
                  <TableCell>{b.foam ?? "—"}</TableCell>
                  <TableCell>{b.top ?? "—"}</TableCell>
                  <TableCell>{b.allowed_finishes?.join(", ") ?? "—"}</TableCell>
                  <TableCell>{b.default_finish ?? "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
