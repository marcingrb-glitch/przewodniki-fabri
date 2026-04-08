import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, RotateCcw } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
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
  const isDzielone = !!baseCode;

  const updateFoam = async (foamId: string, field: string, value: string) => {
    const numFields = ["height", "width", "length", "quantity", "position_number"];
    const parsed = numFields.includes(field) ? (value === "" ? null : Number(value)) : value || null;
    const { error } = await supabase.from("product_specs")
      .update({ [field]: parsed, updated_at: new Date().toISOString() } as any)
      .eq("id", foamId);
    if (error) toast.error("Błąd zapisu");
    else { toast.success("Zapisano"); queryClient.invalidateQueries({ queryKey }); }
  };

  const addFoam = async (section: string = "seat") => {
    const sectionFoams = foams.filter((f: any) => (f.foam_section ?? "seat") === section);
    const maxPos = sectionFoams.reduce((m: number, f: any) => Math.max(m, f.position_number ?? 0), 0);
    const { error } = await supabase.from("product_specs").insert({
      product_id: productId,
      spec_type: "foam",
      position_number: maxPos + 1,
      quantity: 1,
      foam_role: "base",
      foam_section: section,
    });
    if (error) toast.error("Błąd dodawania pianki");
    else { toast.success("Dodano piankę"); queryClient.invalidateQueries({ queryKey }); }
  };

  const deleteFoam = async (foamId: string) => {
    const { error } = await supabase.from("product_specs").delete().eq("id", foamId);
    if (error) { toast.error("Błąd usuwania"); return; }

    // Renumber remaining foams sequentially per section
    const deletedFoam = foams.find((f: any) => f.id === foamId);
    const section = deletedFoam?.foam_section ?? "seat";
    const remaining = foams
      .filter((f: any) => f.id !== foamId && (f.foam_section ?? "seat") === section)
      .sort((a: any, b: any) => (a.position_number ?? 0) - (b.position_number ?? 0));

    await Promise.all(
      remaining.map((f: any, i: number) =>
        supabase.from("product_specs").update({ position_number: i + 1 }).eq("id", f.id)
      )
    );

    toast.success("Usunięto piankę");
    queryClient.invalidateQueries({ queryKey });
  };

  const handleEnableCustomFoams = async () => {
    if (fallbackFoams.length === 0) return;
    const inserts = fallbackFoams.map((foam: any) => ({
      product_id: productId,
      spec_type: "foam" as const,
      position_number: foam.position_number,
      name: foam.name,
      height: foam.height,
      width: foam.width,
      length: foam.length,
      material: foam.material,
      quantity: foam.quantity,
      foam_role: foam.foam_role ?? "base",
      foam_section: foam.foam_section ?? "seat",
      notes: foam.notes,
    }));
    const { error } = await supabase.from("product_specs").insert(inserts);
    if (error) {
      toast.error("Błąd kopiowania pianek");
    } else {
      toast.success(`Skopiowano ${inserts.length} pianek z ${baseCode}. Możesz teraz edytować.`);
      queryClient.invalidateQueries({ queryKey });
    }
  };

  const handleRevertToFallback = async () => {
    const { error } = await supabase
      .from("product_specs")
      .delete()
      .eq("product_id", productId)
      .eq("spec_type", "foam");
    if (error) {
      toast.error("Błąd usuwania pianek");
    } else {
      toast.success("Przywrócono dziedziczenie pianek");
      queryClient.invalidateQueries({ queryKey });
    }
  };

  if (displayFoams.length === 0 && !isFallback) {
    return (
      <Button variant="outline" size="sm" onClick={() => addFoam()}>
        <Plus className="mr-1 h-3 w-3" /> Dodaj piankę
      </Button>
    );
  }

  const renderFoamRow = (foam: any, fallback: boolean) => (
    <TableRow key={foam.id}>
      <TableCell>
        {fallback ? (
          <span className="text-sm">{foam.position_number ?? "—"}</span>
        ) : (
          <InlineEditCell value={foam.position_number} type="number" onSave={(v) => updateFoam(foam.id, "position_number", v)} />
        )}
      </TableCell>
      <TableCell>
        {fallback ? (
          <span className="text-sm">{foam.foam_role ?? "base"}</span>
        ) : (
          <select
            className="h-8 rounded-md border border-input bg-background px-2 text-sm"
            value={foam.foam_role ?? "base"}
            onChange={(e) => updateFoam(foam.id, "foam_role", e.target.value)}
          >
            <option value="base">base</option>
            <option value="front">front</option>
            <option value="side">boczna</option>
          </select>
        )}
      </TableCell>
      <TableCell>
        {fallback ? (
          <span className="text-sm">{foam.name ?? "—"}</span>
        ) : (
          <InlineEditCell value={foam.name} onSave={(v) => updateFoam(foam.id, "name", v)} />
        )}
      </TableCell>
      <TableCell>
        {fallback ? (
          <span className="text-sm">{foam.height ?? "—"}</span>
        ) : (
          <InlineEditCell value={foam.height} type="number" onSave={(v) => updateFoam(foam.id, "height", v)} />
        )}
      </TableCell>
      <TableCell>
        {fallback ? (
          <span className="text-sm">{foam.width ?? "—"}</span>
        ) : (
          <InlineEditCell value={foam.width} type="number" onSave={(v) => updateFoam(foam.id, "width", v)} />
        )}
      </TableCell>
      <TableCell>
        {fallback ? (
          <span className="text-sm">{foam.length ?? "—"}</span>
        ) : (
          <InlineEditCell value={foam.length} type="number" onSave={(v) => updateFoam(foam.id, "length", v)} />
        )}
      </TableCell>
      <TableCell>
        {fallback ? (
          <span className="text-sm">{foam.material ?? "—"}</span>
        ) : (
          <InlineEditCell value={foam.material} onSave={(v) => updateFoam(foam.id, "material", v)} />
        )}
      </TableCell>
      <TableCell>
        {fallback ? (
          <span className="text-sm">{foam.quantity ?? "—"}</span>
        ) : (
          <InlineEditCell value={foam.quantity} type="number" onSave={(v) => updateFoam(foam.id, "quantity", v)} />
        )}
      </TableCell>
      <TableCell>
        {fallback ? (
          <span className="text-sm text-muted-foreground">{foam.notes ?? "—"}</span>
        ) : (
          <InlineEditCell value={foam.notes} onSave={(v) => updateFoam(foam.id, "notes", v)} />
        )}
      </TableCell>
      <TableCell>
        {!fallback && (
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
  );

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

      {isFallback && (
        <div className="flex items-center gap-2 mb-3">
          <Checkbox
            id={`custom-foams-${productId}`}
            onCheckedChange={(checked) => { if (checked) handleEnableCustomFoams(); }}
          />
          <label htmlFor={`custom-foams-${productId}`} className="text-sm font-medium cursor-pointer">
            Własne pianki (różne od {baseCode})
          </label>
        </div>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">Poz.</TableHead>
              <TableHead className="w-[90px]">Rola</TableHead>
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
            {category === "chaise" ? (() => {
              const seatFoams = displayFoams.filter((f: any) => (f.foam_section ?? "seat") === "seat");
              const backrestFoams = displayFoams.filter((f: any) => (f.foam_section ?? "seat") === "backrest");
              return (
                <>
                  {seatFoams.length > 0 && (
                    <>
                      <TableRow><TableCell colSpan={10} className="bg-muted/50 font-semibold text-xs py-1">Pianki siedziskowe</TableCell></TableRow>
                      {seatFoams.map((foam: any) => renderFoamRow(foam, isFallback))}
                    </>
                  )}
                  {backrestFoams.length > 0 && (
                    <>
                      <TableRow><TableCell colSpan={10} className="bg-muted/50 font-semibold text-xs py-1">Pianki oparcia szezlonga</TableCell></TableRow>
                      {backrestFoams.map((foam: any) => renderFoamRow(foam, isFallback))}
                    </>
                  )}
                </>
              );
            })() : displayFoams.map((foam: any) => renderFoamRow(foam, isFallback))}
          </TableBody>
        </Table>
      </div>

      {!isFallback && (
        <div className="flex items-center gap-2 mt-2">
          {category === "chaise" ? (
            <>
              <Button variant="outline" size="sm" onClick={() => addFoam("seat")}>
                <Plus className="mr-1 h-3 w-3" /> Dodaj piankę siedziskową
              </Button>
              <Button variant="outline" size="sm" onClick={() => addFoam("backrest")}>
                <Plus className="mr-1 h-3 w-3" /> Dodaj piankę oparcia
              </Button>
            </>
          ) : (
            <Button variant="outline" size="sm" onClick={() => addFoam()}>
              <Plus className="mr-1 h-3 w-3" /> Dodaj piankę
            </Button>
          )}
          {isDzielone && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <RotateCcw className="mr-1 h-3 w-3" /> Przywróć dziedziczenie z {baseCode}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Przywrócić dziedziczenie?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Usunie wszystkie własne pianki tego siedziska i wróci do pianek z {baseCode}. Tej operacji nie można cofnąć.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Anuluj</AlertDialogCancel>
                  <AlertDialogAction onClick={handleRevertToFallback}>Przywróć</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      )}
    </div>
  );
}
