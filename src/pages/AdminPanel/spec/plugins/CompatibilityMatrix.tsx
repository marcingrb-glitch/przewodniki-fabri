import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";

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
    const currentlyCompatible = existing
      ? ((existing as any).properties?.compatible ?? true)
      : true;

    if (currentlyCompatible) {
      // Checked → uncheck: create/update record with compatible=false
      if (existing) {
        const { error } = await supabase
          .from("product_relations")
          .update({ properties: { compatible: false } })
          .eq("id", existing.id);
        if (error) toast.error("Błąd zapisu");
        else queryClient.invalidateQueries({ queryKey: compatQueryKey });
      } else {
        const { error } = await supabase.from("product_relations").insert({
          series_id: seriesProductId,
          relation_type: "seat_side_compat",
          source_product_id: seatId,
          target_product_id: sideId,
          properties: { compatible: false },
        });
        if (error) toast.error("Błąd zapisu");
        else queryClient.invalidateQueries({ queryKey: compatQueryKey });
      }
    } else {
      // Unchecked → check: delete exception record (restore default compatibility)
      if (existing) {
        const { error } = await supabase
          .from("product_relations")
          .delete()
          .eq("id", existing.id);
        if (error) toast.error("Błąd zapisu");
        else queryClient.invalidateQueries({ queryKey: compatQueryKey });
      }
    }
  };

  const incompatibleCount = compat.filter(
    (c: any) => c.properties?.compatible === false
  ).length;

  const resetAll = async () => {
    const ids = compat
      .filter((c: any) => c.properties?.compatible === false)
      .map((c: any) => c.id);
    if (ids.length === 0) return;
    const { error } = await supabase
      .from("product_relations")
      .delete()
      .in("id", ids);
    if (error) toast.error("Błąd zapisu");
    else {
      toast.success("Przywrócono pełną kompatybilność");
      queryClient.invalidateQueries({ queryKey: compatQueryKey });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Kompatybilność boczek ↔ siedzisko</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={resetAll}
            disabled={incompatibleCount === 0}
          >
            Zaznacz wszystkie
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Domyślnie wszystko kompatybilne. Odznacz pary, które <strong>nie</strong> są dozwolone.
          {incompatibleCount > 0 && (
            <span className="ml-1">({incompatibleCount} {incompatibleCount === 1 ? "wyjątek" : "wyjątków"})</span>
          )}
        </p>
      </CardHeader>
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
                    const isCompatible = c ? ((c as any).properties?.compatible ?? true) : true;
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
