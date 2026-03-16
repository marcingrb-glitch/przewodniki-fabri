import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import InlineEditCell from "../InlineEditCell";

interface FoamSubTableProps {
  productId: string;
  productCode: string;
  category: string;
  seriesProductId: string;
}

export default function FoamSubTable({ productId, productCode, category, seriesProductId }: FoamSubTableProps) {
  const queryClient = useQueryClient();
  const queryKey = ["product-specs-foam", productId];

  const { data: foams = [] } = useQuery({
    queryKey,
    queryFn: async () => {
      const { data } = await supabase
        .from("product_specs")
        .select("*")
        .eq("product_id", productId)
        .eq("spec_type", "foam")
        .order("position_number");
      return data ?? [];
    },
  });

  // Fallback for split seats: if code ends with "D" and no foams → load from base code
  const baseCode = category === "seat" && productCode.endsWith("D")
    ? productCode.slice(0, -1) : null;

  const { data: fallbackFoams = [] } = useQuery({
    queryKey: ["product-specs-foam-fallback", baseCode, seriesProductId],
    queryFn: async () => {
      if (!baseCode) return [];
      const { data: baseSeat } = await supabase
        .from("products")
        .select("id")
        .eq("code", baseCode)
        .eq("category", "seat")
        .eq("series_id", seriesProductId)
        .single();
      if (!baseSeat) return [];
      const { data } = await supabase
        .from("product_specs")
        .select("*")
        .eq("product_id", baseSeat.id)
        .eq("spec_type", "foam")
        .order("position_number");
      return data ?? [];
    },
    enabled: !!baseCode && foams.length === 0,
  });

  const displayFoams = foams.length > 0 ? foams : fallbackFoams;
  const isFallback = foams.length === 0 && fallbackFoams.length > 0;

  const updateFoam = async (foamId: string, field: string, value: string) => {
    const numFields = ["height", "width", "length", "quantity", "position_number"];
    const parsed = numFields.includes(field) ? (value === "" ? null : Number(value)) : value || null;
    const { error } = await supabase.from("product_specs")
      .update({ [field]: parsed, updated_at: new Date().toISOString() } as any)
      .eq("id", foamId);
    if (error) toast.error("Błąd zapisu");
    else { toast.success("Zapisano"); queryClient.invalidateQueries({ queryKey }); }
  };

  const addFoam = async () => {
    const maxPos = foams.reduce((m: number, f: any) => Math.max(m, f.position_number ?? 0), 0);
    const { error } = await supabase.from("product_specs").insert({
      product_id: productId,
      spec_type: "foam",
      position_number: maxPos + 1,
      quantity: 1,
    });
    if (error) toast.error("Błąd dodawania pianki");
    else { toast.success("Dodano piankę"); queryClient.invalidateQueries({ queryKey }); }
  };

  const deleteFoam = async (foamId: string) => {
    const { error } = await supabase.from("product_specs").delete().eq("id", foamId);
    if (error) toast.error("Błąd usuwania");
    else { toast.success("Usunięto piankę"); queryClient.invalidateQueries({ queryKey }); }
  };

  if (displayFoams.length === 0 && !isFallback) {
    return (
      <Button variant="outline" size="sm" onClick={addFoam}>
        <Plus className="mr-1 h-3 w-3" /> Dodaj piankę
      </Button>
    );
  }

  return (
    <div>
      <h4 className="text-sm font-semibold mb-2">
        Pianki szczegółowe
        {isFallback && (
          <span className="font-normal text-muted-foreground ml-2">
            (Pianki jak {baseCode} + pasek środkowy)
          </span>
        )}
      </h4>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">Poz.</TableHead>
              <TableHead>Nazwa</TableHead>
              <TableHead className="w-[70px]">Wys.</TableHead>
              <TableHead className="w-[70px]">Szer.</TableHead>
              <TableHead className="w-[70px]">Dł.</TableHead>
              <TableHead className="w-[100px]">Materiał</TableHead>
              <TableHead className="w-[50px]">Ilość</TableHead>
              <TableHead>Uwagi</TableHead>
              <TableHead className="w-[40px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayFoams.map((foam: any) => (
              <TableRow key={foam.id}>
                <TableCell>
                  {isFallback ? (
                    <span className="text-sm">{foam.position_number ?? "—"}</span>
                  ) : (
                    <InlineEditCell value={foam.position_number} type="number" onSave={(v) => updateFoam(foam.id, "position_number", v)} />
                  )}
                </TableCell>
                <TableCell>
                  {isFallback ? (
                    <span className="text-sm">{foam.name ?? "—"}</span>
                  ) : (
                    <InlineEditCell value={foam.name} onSave={(v) => updateFoam(foam.id, "name", v)} />
                  )}
                </TableCell>
                <TableCell>
                  {isFallback ? (
                    <span className="text-sm">{foam.height ?? "—"}</span>
                  ) : (
                    <InlineEditCell value={foam.height} type="number" onSave={(v) => updateFoam(foam.id, "height", v)} />
                  )}
                </TableCell>
                <TableCell>
                  {isFallback ? (
                    <span className="text-sm">{foam.width ?? "—"}</span>
                  ) : (
                    <InlineEditCell value={foam.width} type="number" onSave={(v) => updateFoam(foam.id, "width", v)} />
                  )}
                </TableCell>
                <TableCell>
                  {isFallback ? (
                    <span className="text-sm">{foam.length ?? "—"}</span>
                  ) : (
                    <InlineEditCell value={foam.length} type="number" onSave={(v) => updateFoam(foam.id, "length", v)} />
                  )}
                </TableCell>
                <TableCell>
                  {isFallback ? (
                    <span className="text-sm">{foam.material ?? "—"}</span>
                  ) : (
                    <InlineEditCell value={foam.material} onSave={(v) => updateFoam(foam.id, "material", v)} />
                  )}
                </TableCell>
                <TableCell>
                  {isFallback ? (
                    <span className="text-sm">{foam.quantity ?? "—"}</span>
                  ) : (
                    <InlineEditCell value={foam.quantity} type="number" onSave={(v) => updateFoam(foam.id, "quantity", v)} />
                  )}
                </TableCell>
                <TableCell>
                  {isFallback ? (
                    <span className="text-sm text-muted-foreground">{foam.notes ?? "—"}</span>
                  ) : (
                    <InlineEditCell value={foam.notes} onSave={(v) => updateFoam(foam.id, "notes", v)} />
                  )}
                </TableCell>
                <TableCell>
                  {!isFallback && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7"><Trash2 className="h-3 w-3 text-destructive" /></Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Usunąć piankę?</AlertDialogTitle>
                          <AlertDialogDescription>Ta operacja jest nieodwracalna.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Anuluj</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteFoam(foam.id)}>Usuń</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {!isFallback && (
        <Button variant="outline" size="sm" className="mt-2" onClick={addFoam}>
          <Plus className="mr-1 h-3 w-3" /> Dodaj piankę
        </Button>
      )}
    </div>
  );
}
