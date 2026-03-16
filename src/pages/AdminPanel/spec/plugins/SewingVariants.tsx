import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Plus, Trash2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import InlineEditCell from "../InlineEditCell";

interface SewingVariantsProps {
  productId: string;
  productCode: string;
  modelName: string | null;
  seriesProductId: string;
  seatModels: string[];
}

export default function SewingVariants({ productId, productCode, modelName, seriesProductId, seatModels }: SewingVariantsProps) {
  const queryClient = useQueryClient();
  const queryKey = ["sewing-variants", productId, seriesProductId];

  const { data: variants = [] } = useQuery({
    queryKey,
    queryFn: async () => {
      const { data } = await supabase
        .from("product_relations")
        .select("*")
        .eq("series_id", seriesProductId)
        .eq("relation_type", "sewing_variant")
        .eq("target_product_id", productId)
        .eq("active", true);
      return (data ?? []).map((r: any) => ({
        id: r.id,
        variant_name: r.properties?.variant_name ?? "",
        description: r.properties?.description ?? null,
        models: r.properties?.models ?? [],
        properties: r.properties ?? {},
      }));
    },
  });

  const backrestModels = modelName
    ? modelName.split(/\s*\/\s*/).map((m: string) => m.trim()).filter(Boolean)
    : [];

  const addVariant = async () => {
    const nextNum = variants.length + 1;
    const defaultDescriptions: Record<number, string> = { 1: "Przewinięte", 2: "Bodno na górze" };
    const { error } = await supabase.from("product_relations").insert({
      series_id: seriesProductId,
      relation_type: "sewing_variant",
      target_product_id: productId,
      source_product_id: null,
      properties: {
        variant_name: `Wariant ${nextNum}`,
        models: [],
        description: defaultDescriptions[nextNum] || null,
        finish: null,
        component_type: "backrest",
        component_code: productCode,
      },
    });
    if (error) toast.error("Błąd dodawania wariantu");
    else { toast.success("Dodano wariant"); queryClient.invalidateQueries({ queryKey }); }
  };

  const updateVariant = async (id: string, field: string, value: any) => {
    const current = variants.find((v: any) => v.id === id);
    if (!current) return;
    const updatedProps = { ...current.properties, [field]: value };
    const { error } = await supabase.from("product_relations")
      .update({ properties: updatedProps })
      .eq("id", id);
    if (error) toast.error("Błąd zapisu");
    else { toast.success("Zapisano"); queryClient.invalidateQueries({ queryKey }); }
  };

  const deleteVariant = async (id: string) => {
    const { error } = await supabase.from("product_relations").delete().eq("id", id);
    if (error) toast.error("Błąd usuwania");
    else { toast.success("Usunięto wariant"); queryClient.invalidateQueries({ queryKey }); }
  };

  const ModelMultiSelect = ({ selected, onChange }: { selected: string[]; onChange: (models: string[]) => void }) => {
    const modelsToShow = backrestModels.length > 0 ? backrestModels : seatModels;
    const toggleModel = (model: string) => {
      const updated = selected.includes(model)
        ? selected.filter(m => m !== model)
        : [...selected, model];
      onChange(updated);
    };

    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="h-auto min-h-[28px] px-2 py-1 text-xs font-normal">
            {selected.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {selected.map(m => (
                  <Badge key={m} variant="secondary" className="text-xs">{m}</Badge>
                ))}
              </div>
            ) : (
              <span className="text-muted-foreground italic">wybierz modele</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-56 p-2" align="start">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground mb-2">Modele</p>
            {modelsToShow.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">Brak modeli</p>
            ) : modelsToShow.map(model => (
              <label key={model} className="flex items-center gap-2 py-1 px-1 rounded hover:bg-accent cursor-pointer text-sm">
                <Checkbox checked={selected.includes(model)} onCheckedChange={() => toggleModel(model)} />
                {model}
              </label>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    );
  };

  return (
    <div className="rounded-md border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold">Warianty szycia</h4>
        <Button variant="outline" size="sm" onClick={addVariant}>
          <Plus className="mr-1 h-3 w-3" /> Dodaj wariant
        </Button>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[140px]">Wariant</TableHead>
              <TableHead>Opis</TableHead>
              <TableHead className="w-[80px]">Wykończenie</TableHead>
              <TableHead>Modele</TableHead>
              <TableHead className="w-[40px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {variants.map((v: any) => (
              <TableRow key={v.id}>
                <TableCell>
                  <InlineEditCell value={v.variant_name} onSave={(val) => updateVariant(v.id, "variant_name", val)} />
                </TableCell>
                <TableCell>
                  <InlineEditCell value={v.description} onSave={(val) => updateVariant(v.id, "description", val || null)} placeholder="uzupełnij" />
                </TableCell>
                <TableCell>
                  <InlineEditCell
                    value={v.properties?.finish ?? null}
                    onSave={(val) => updateVariant(v.id, "finish", val || null)}
                    placeholder="—"
                  />
                </TableCell>
                <TableCell>
                  <ModelMultiSelect
                    selected={v.models}
                    onChange={(models) => updateVariant(v.id, "models", models)}
                  />
                </TableCell>
                <TableCell>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7"><Trash2 className="h-3 w-3 text-destructive" /></Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Usunąć wariant {v.variant_name}?</AlertDialogTitle>
                        <AlertDialogDescription>Ta operacja jest nieodwracalna.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Anuluj</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteVariant(v.id)}>Usuń</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
