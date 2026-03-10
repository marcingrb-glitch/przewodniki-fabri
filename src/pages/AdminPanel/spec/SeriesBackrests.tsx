import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Tables } from "@/integrations/supabase/types";
import InlineEditCell from "./InlineEditCell";
import ComponentForm, { FieldDefinition } from "@/components/admin/ComponentForm";

interface Props {
  seriesId: string;
}

type Backrest = Tables<"backrests"> & { model_name?: string | null };
type Foam = Tables<"product_foams"> & { backrest_id?: string | null };

interface SewingVariant {
  id: string;
  series_id: string;
  component_type: string;
  component_code: string;
  variant_name: string;
  models: string[];
  description: string | null;
  created_at: string;
}

const backrestFields: FieldDefinition[] = [
  { name: "code", label: "Kod", type: "text", required: true },
  { name: "model_name", label: "Model (np. Modena / Sienna)", type: "text" },
  { name: "height_cm", label: "Wysokość (cm)", type: "text" },
  { name: "frame", label: "Stelaż", type: "text" },
  { name: "foam", label: "Pianka", type: "text" },
  { name: "top", label: "Góra", type: "text" },
  { name: "spring_type", label: "Sprężyna", type: "text" },
  { name: "allowed_finishes", label: "Wykończenia", type: "multi-select", options: [
    { value: "A", label: "A" }, { value: "B", label: "B" }, { value: "C", label: "C" },
    { value: "D", label: "D" }, { value: "E", label: "E" },
  ]},
  { name: "default_finish", label: "Domyślne wykończenie", type: "text" },
];

export default function SeriesBackrests({ seriesId }: Props) {
  const [backrests, setBackrests] = useState<Backrest[]>([]);
  const [foams, setFoams] = useState<Foam[]>([]);
  const [sewingVariants, setSewingVariants] = useState<SewingVariant[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Backrest | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    const [backrestsRes, foamsRes, variantsRes] = await Promise.all([
      supabase.from("backrests").select("*").eq("series_id", seriesId).order("code"),
      supabase.from("product_foams").select("*").eq("series_id", seriesId).order("position_number"),
      supabase.from("sewing_variants").select("*").eq("series_id", seriesId).eq("component_type", "backrest") as any,
    ]);
    setBackrests((backrestsRes.data ?? []) as Backrest[]);
    setFoams((foamsRes.data ?? []) as Foam[]);
    setSewingVariants((variantsRes.data ?? []) as SewingVariant[]);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, [seriesId]);

  const updateField = async (id: string, field: string, value: string) => {
    const { error } = await supabase.from("backrests").update({ [field]: value || null } as any).eq("id", id);
    if (error) toast.error("Błąd zapisu");
    else { toast.success("Zapisano"); fetchAll(); }
  };

  const handleSubmit = async (data: any) => {
    setSubmitting(true);
    try {
      const { sewing_notes, ...cleanData } = data;
      if (editingItem) {
        const { error } = await supabase.from("backrests").update(cleanData).eq("id", editingItem.id);
        if (error) throw error;
        toast.success("✅ Oparcie zaktualizowane");
      } else {
        const { error } = await supabase.from("backrests").insert({ ...cleanData, series_id: seriesId });
        if (error) throw error;
        toast.success("✅ Oparcie dodane");
      }
      setFormOpen(false); setEditingItem(null); fetchAll();
    } catch (err: any) { toast.error(`❌ ${err.message}`); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("backrests").delete().eq("id", id);
    if (error) toast.error("Błąd usuwania");
    else { toast.success("✅ Oparcie usunięte"); fetchAll(); }
  };

  const updateFoam = async (foamId: string, field: string, value: string) => {
    const numFields = ["height", "width", "length", "quantity", "position_number"];
    const parsed = numFields.includes(field) ? (value === "" ? null : Number(value)) : value || null;
    const { error } = await supabase.from("product_foams").update({ [field]: parsed, updated_at: new Date().toISOString() }).eq("id", foamId);
    if (error) toast.error("Błąd zapisu");
    else { toast.success("Zapisano"); fetchAll(); }
  };

  const addFoam = async (backrest: Backrest) => {
    const backrestFoams = foams.filter((f) => f.backrest_id === backrest.id);
    const maxPos = backrestFoams.reduce((m, f) => Math.max(m, f.position_number ?? 0), 0);
    const { error } = await supabase.from("product_foams").insert({
      series_id: seriesId, seat_code: backrest.code, component: "oparcie", position_number: maxPos + 1, quantity: 1,
      backrest_id: backrest.id,
    } as any);
    if (error) toast.error("Błąd dodawania pianki");
    else { toast.success("Dodano piankę"); fetchAll(); }
  };

  const deleteFoam = async (foamId: string) => {
    const { error } = await supabase.from("product_foams").delete().eq("id", foamId);
    if (error) toast.error("Błąd usuwania");
    else { toast.success("Usunięto piankę"); fetchAll(); }
  };

  // Sewing variants CRUD
  const addSewingVariant = async (backrestCode: string) => {
    const existing = sewingVariants.filter((v) => v.component_code === backrestCode);
    const nextNum = existing.length + 1;
    const { error } = await (supabase.from("sewing_variants") as any).insert({
      series_id: seriesId, component_type: "backrest", component_code: backrestCode,
      variant_name: `Wariant ${nextNum}`, models: [],
    });
    if (error) toast.error("Błąd dodawania wariantu");
    else { toast.success("Dodano wariant"); fetchAll(); }
  };

  const updateSewingVariant = async (id: string, field: string, value: any) => {
    const { error } = await (supabase.from("sewing_variants") as any).update({ [field]: value }).eq("id", id);
    if (error) toast.error("Błąd zapisu");
    else { toast.success("Zapisano"); fetchAll(); }
  };

  const deleteSewingVariant = async (id: string) => {
    const { error } = await (supabase.from("sewing_variants") as any).delete().eq("id", id);
    if (error) toast.error("Błąd usuwania");
    else { toast.success("Usunięto wariant"); fetchAll(); }
  };

  if (loading) return <div className="text-muted-foreground py-8 text-center">Ładowanie...</div>;

  // Get matching sewing variants for a backrest card based on model_name overlap
  const getMatchingVariants = (b: Backrest) => {
    const variants = sewingVariants.filter((v) => v.component_code === b.code);
    if (!b.model_name) return variants; // no model_name = show all variants for this code

    const cardModels = b.model_name.split(/\s*\/\s*/).map((m) => m.trim());
    return variants.filter((v) =>
      v.models.length === 0 || v.models.some((m) => cardModels.includes(m))
    );
  };

  // Get foams for a specific backrest card
  const getBackrestFoams = (b: Backrest) => {
    // If backrest_id is set on foams, filter by it; otherwise fall back to seat_code
    const foamsByBackrestId = foams.filter((f) => f.backrest_id === b.id);
    if (foamsByBackrestId.length > 0) return foamsByBackrestId;
    // Fallback: only if no backrest has backrest_id-linked foams for this code
    const anyLinked = foams.some((f) => f.seat_code === b.code && f.backrest_id);
    if (anyLinked) return []; // other backrest owns these foams
    return foams.filter((f) => f.seat_code === b.code);
  };

  const renderSewingSection = (b: Backrest) => {
    const variants = getMatchingVariants(b);
    if (variants.length === 0) return null;

    return (
      <div className="rounded-md border p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold">Warianty szycia</h4>
          <Button variant="outline" size="sm" onClick={() => addSewingVariant(b.code)}>
            <Plus className="mr-1 h-3 w-3" /> Dodaj wariant
          </Button>
        </div>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[140px]">Wariant</TableHead>
                <TableHead>Opis</TableHead>
                <TableHead>Modele</TableHead>
                <TableHead className="w-[40px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {variants.map((v) => (
                <TableRow key={v.id}>
                  <TableCell>
                    <InlineEditCell value={v.variant_name} onSave={(val) => updateSewingVariant(v.id, "variant_name", val)} />
                  </TableCell>
                  <TableCell>
                    <InlineEditCell value={v.description} onSave={(val) => updateSewingVariant(v.id, "description", val || null)} placeholder="uzupełnij" />
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {v.models.map((m) => (
                        <Badge key={m} variant="secondary" className="text-xs">{m}</Badge>
                      ))}
                    </div>
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
                          <AlertDialogAction onClick={() => deleteSewingVariant(v.id)}>Usuń</AlertDialogAction>
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
  };

  const renderBackrestCard = (b: Backrest) => {
    const backrestFoams = getBackrestFoams(b);
    const matchingVariants = getMatchingVariants(b);

    return (
      <Card key={b.id} className="mb-4">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <InlineEditCell value={b.code} onSave={(v) => updateField(b.id, "code", v)} />
              {b.model_name && (
                <span className="text-muted-foreground font-normal">— {b.model_name}</span>
              )}
              {b.spring_type && <Badge variant="outline">Sprężyna: {b.spring_type}</Badge>}
              {matchingVariants.map((v) => v.description && (
                <Badge key={v.id} variant="secondary">Szycie: {v.description}</Badge>
              ))}
            </CardTitle>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" onClick={() => { setEditingItem(b); setFormOpen(true); }}>
                <Pencil className="h-4 w-4" />
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Usunąć oparcie {b.code}{b.model_name ? ` (${b.model_name})` : ''}?</AlertDialogTitle>
                    <AlertDialogDescription>Ta operacja jest nieodwracalna.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Anuluj</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleDelete(b.id)}>Usuń</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
          <div className="text-sm text-muted-foreground mt-1">
            {b.allowed_finishes && <div>Wykończenia: {b.allowed_finishes.join(", ")} {b.default_finish && `(domyślne: ${b.default_finish})`}</div>}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Dane techniczne */}
          <div className="rounded-md border p-4 space-y-2">
            <h4 className="text-sm font-semibold mb-2">Dane techniczne</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-sm">
              <div className="flex items-center gap-2">
                <span className="font-medium text-muted-foreground w-36 shrink-0">Stelaż:</span>
                <InlineEditCell value={b.frame} onSave={(v) => updateField(b.id, "frame", v)} />
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-muted-foreground w-36 shrink-0">Wysokość:</span>
                <InlineEditCell value={b.height_cm} onSave={(v) => updateField(b.id, "height_cm", v)} />
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-muted-foreground w-36 shrink-0">Sprężyna:</span>
                <InlineEditCell value={b.spring_type} onSave={(v) => updateField(b.id, "spring_type", v)} />
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-muted-foreground w-36 shrink-0">Model:</span>
                <InlineEditCell value={b.model_name} onSave={(v) => updateField(b.id, "model_name", v)} />
              </div>
            </div>
          </div>

          {/* Warianty szycia */}
          {renderSewingSection(b)}

          {/* Pianki szczegółowe */}
          {backrestFoams.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold mb-2">Pianki szczegółowe</h4>
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
                    {backrestFoams.map((foam) => (
                      <TableRow key={foam.id}>
                        <TableCell><InlineEditCell value={foam.position_number} type="number" onSave={(v) => updateFoam(foam.id, "position_number", v)} /></TableCell>
                        <TableCell><InlineEditCell value={foam.name} onSave={(v) => updateFoam(foam.id, "name", v)} /></TableCell>
                        <TableCell><InlineEditCell value={foam.height} type="number" onSave={(v) => updateFoam(foam.id, "height", v)} /></TableCell>
                        <TableCell><InlineEditCell value={foam.width} type="number" onSave={(v) => updateFoam(foam.id, "width", v)} /></TableCell>
                        <TableCell><InlineEditCell value={foam.length} type="number" onSave={(v) => updateFoam(foam.id, "length", v)} /></TableCell>
                        <TableCell><InlineEditCell value={foam.material} onSave={(v) => updateFoam(foam.id, "material", v)} /></TableCell>
                        <TableCell><InlineEditCell value={foam.quantity} type="number" onSave={(v) => updateFoam(foam.id, "quantity", v)} /></TableCell>
                        <TableCell><InlineEditCell value={foam.notes} onSave={(v) => updateFoam(foam.id, "notes", v)} /></TableCell>
                        <TableCell>
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
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
          <Button variant="outline" size="sm" onClick={() => addFoam(b)}>
            <Plus className="mr-1 h-3 w-3" /> Dodaj piankę
          </Button>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => { setEditingItem(null); setFormOpen(true); }}><Plus className="mr-1 h-4 w-4" /> Dodaj oparcie</Button>
      </div>

      {backrests.length === 0 ? (
        <div className="text-center text-muted-foreground py-8">Brak oparć</div>
      ) : (
        backrests.map(renderBackrestCard)
      )}

      <ComponentForm
        open={formOpen}
        title={editingItem ? `Edytuj oparcie ${editingItem.code}` : "Dodaj oparcie"}
        fields={backrestFields}
        initialData={editingItem}
        onSubmit={handleSubmit}
        onCancel={() => { setFormOpen(false); setEditingItem(null); }}
        isLoading={submitting}
      />
    </div>
  );
}
