import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";

interface Props {
  seriesProductId: string;
  parentSeriesId: string | null;
}

export default function ParentSewingVariantsReadonly({ seriesProductId, parentSeriesId }: Props) {
  const sourceSeriesId = parentSeriesId || seriesProductId;

  const { data: variants = [] } = useQuery({
    queryKey: ["parent-sewing-variants", sourceSeriesId],
    queryFn: async () => {
      const { data } = await supabase
        .from("product_relations")
        .select("*, target:target_product_id(code, name, properties)")
        .eq("series_id", sourceSeriesId)
        .eq("relation_type", "sewing_variant")
        .eq("active", true);
      return data ?? [];
    },
    enabled: !!sourceSeriesId,
  });

  if (variants.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <CardTitle className="text-base">Warianty szycia oparcia</CardTitle>
          {parentSeriesId && (
            <Badge variant="secondary">z serii nadrzędnej</Badge>
          )}
        </div>
        {parentSeriesId && (
          <p className="text-xs text-muted-foreground">
            Edytuj warianty szycia w specyfikacji serii nadrzędnej → Oparcia
          </p>
        )}
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Oparcie</TableHead>
                <TableHead>Model</TableHead>
                <TableHead>Opis szycia</TableHead>
                <TableHead>Wykończenie</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {variants.map((v: any) => (
                <TableRow key={v.id}>
                  <TableCell className="font-mono text-sm">
                    {(v.target as any)?.code ?? "—"}
                  </TableCell>
                  <TableCell>
                    {(v.target as any)?.properties?.model_name ?? "—"}
                  </TableCell>
                  <TableCell>{v.properties?.sewing_description ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{v.properties?.finish ?? "—"}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
