import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";

interface CompatibilityMatrixProps {
  sides: any[];
  seriesProductId: string;
}

export default function CompatibilityMatrix({ sides, seriesProductId }: CompatibilityMatrixProps) {
  const queryClient = useQueryClient();

  const { data: seats = [] } = useQuery({
    queryKey: ["compat-seats", seriesProductId],
    queryFn: async () => {
      const { data } = await supabase
        .from("products")
        .select("id, code, properties")
        .eq("category", "seat")
        .eq("series_id", seriesProductId)
        .eq("active", true)
        .order("code");
      return (data ?? []).filter((s: any) => !s.code.endsWith("D"));
    },
  });

  const compatQueryKey = ["compat-relations", seriesProductId];
  const { data: compat = [] } = useQuery({
    queryKey: compatQueryKey,
    queryFn: async () => {
      const { data } = await supabase
        .from("product_relations")
        .select("*")
        .eq("series_id", seriesProductId)
        .eq("relation_type", "seat_side_compat")
        .eq("active", true);
      return data ?? [];
    },
  });

  if (sides.length === 0 || seats.length === 0) return null;

  const getCompat = (seatId: string, sideId: string) => {
    return compat.find((c: any) =>
      c.source_product_id === seatId && c.target_product_id === sideId
    );
  };

  const toggleCompat = async (seatId: string, sideId: string) => {
    const existing = getCompat(seatId, sideId);
    if (existing) {
      const currentCompatible = (existing as any).properties?.compatible ?? false;
      const { error } = await supabase
        .from("product_relations")
        .update({ properties: { compatible: !currentCompatible } })
        .eq("id", existing.id);
      if (error) toast.error("Błąd zapisu");
      else queryClient.invalidateQueries({ queryKey: compatQueryKey });
    } else {
      const { error } = await supabase.from("product_relations").insert({
        series_id: seriesProductId,
        relation_type: "seat_side_compat",
        source_product_id: seatId,
        target_product_id: sideId,
        properties: { compatible: true },
      });
      if (error) toast.error("Błąd zapisu");
      else queryClient.invalidateQueries({ queryKey: compatQueryKey });
    }
  };

  return (
    <Card>
      <CardHeader><CardTitle className="text-lg">Kompatybilność boczek ↔ siedzisko</CardTitle></CardHeader>
      <CardContent>
        <div className="rounded-md border overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Boczek</TableHead>
                {seats.map((seat: any) => (
                  <TableHead key={seat.id} className="text-center">
                    <div>{seat.code}</div>
                    {seat.properties?.model_name && (
                      <div className="text-xs font-normal text-muted-foreground">{seat.properties.model_name}</div>
                    )}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {sides.map((side: any) => (
                <TableRow key={side.id}>
                  <TableCell className="font-medium">{side.code} {side.name}</TableCell>
                  {seats.map((seat: any) => {
                    const c = getCompat(seat.id, side.id);
                    const isCompatible = (c as any)?.properties?.compatible ?? false;
                    return (
                      <TableCell key={seat.id} className="text-center">
                        <Checkbox
                          checked={isCompatible}
                          onCheckedChange={() => toggleCompat(seat.id, side.id)}
                        />
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
