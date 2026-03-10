import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
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

export default function SeriesBackrests({ seriesId }: Props) {
  const [backrests, setBackrests] = useState<Backrest[]>([]);
  const [foams, setFoams] = useState<Foam[]>([]);
  const [sewingVariants, setSewingVariants] = useState<SewingVariant[]>([]);
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Backrest | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    const [backrestsRes, foamsRes, variantsRes, seatsRes] = await Promise.all([
      supabase.from("backrests").select("*").eq("series_id", seriesId).order("code"),
      supabase.from("product_foams").select("*").eq("series_id", seriesId).order("position_number"),
      supabase.from("sewing_variants").select("*").eq("series_id", seriesId).eq("component_type", "backrest") as any,
      supabase.from("seats_sofa").select("model_name").eq("series_id", seriesId).not("model_name", "is", null),
    ]);
    setBackrests((backrestsRes.data ?? []) as Backrest[]);
    setFoams((foamsRes.data ?? []) as Foam[]);
    setSewingVariants((variantsRes.data ?? []) as SewingVariant[]);
    
    // Extract unique model names from seats_sofa
    const models = [...new Set(
      (seatsRes.data ?? []).map((s: any) => s.model_name as string).filter(Boolean)
    )].sort();
    setAvailableModels(models);
    
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, [seriesId]);

  // Dynamic backrest fields with model multi-select
  const getBackrestFields = (): FieldDefinition[] => [
    { name: "code", label: "Kod", type: "text", required: true },
    { name: "model_name", label: "Model (np. Modena / Sienna)", type: "multi-select", options: availableModels.map(m => ({ value: m, label: m })) },
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

  const updateField = async (id: string, field: string, value: string) => {
    const { error } = await supabase.from("backrests").update({ [field]: value || null } as any).eq("id", id);
    if (error) toast.error("Błąd zapisu");
    else { toast.success("Zapisano"); fetchAll(); }
  };

  // Parse model_name string to array
  const parseModels = (modelName: string | null | undefined): string[] => {
    if (!modelName) return [];
    return modelName.split(/\s*\/\s*/).map(m => m.trim()).filter(Boolean);
  };

  // Join model array to string
  const joinModels = (models: string[]): string => models.join(" / ");

  const handleSubmit = async (data: any) => {
    setSubmitting(true);
    try {
      const { sewing_notes, ...cleanData } = data;
      // Convert model_name from array to string if it's an array
      if (Array.isArray(cleanData.model_name)) {
        cleanData.model_name = joinModels(cleanData.model_name);
      }
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

  // Get all sewing variants for a backrest code (no model filtering)
  const getMatchingVariants = (b: Backrest) => {
    return sewingVariants.filter((v) => v.component_code === b.code);
  };

  // Get foams for a specific backrest card
  const getBackrestFoams = (b: Backrest) => {
    const foamsByBackrestId = foams.filter((f) => f.backrest_id === b.id);
    if (foamsByBackrestId.length > 0) return foamsByBackrestId;
    const anyLinked = foams.some((f) => f.seat_code === b.code && f.backrest_id);
    if (anyLinked) return [];
    return foams.filter((f) => f.seat_code === b.code);
  };

  // Multi-select popover for models
  const ModelMultiSelect = ({ selected, onChange, label = "Modele", allowedModels }: { selected: string[]; onChange: (models: string[]) => void; label?: string; allowedModels?: string[] }) => {
    const modelsToShow = allowedModels ?? availableModels;
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
              <span className="text-muted-foreground italic">wybierz {label.toLowerCase()}</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-56 p-2" align="start">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground mb-2">{label}</p>
            {modelsToShow.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">Brak modeli</p>
            ) : (
              modelsToShow.map(model => (
                <label key={model} className="flex items-center gap-2 py-1 px-1 rounded hover:bg-accent cursor-pointer text-sm">
                  <Checkbox
                    checked={selected.includes(model)}
                    onCheckedChange={() => toggleModel(model)}
                  />
                  {model}
                </label>
              ))
            )}
          </div>
        </PopoverContent>
      </Popover>
    );
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
                    <ModelMultiSelect
                      selected={v.models}
                      onChange={(models) => updateSewingVariant(v.id, "models", models)}
                      label="Modele"
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

  // Prepare editing item with model_name converted to array for the form
  const openEditForm = (b: Backrest) => {
    const editData = { ...b, model_name: parseModels(b.model_name) } as any;
    setEditingItem(editData);
    setFormOpen(true);
  };

  const renderBackrestCard = (b: Backrest) => {
    const backrestFoams = getBackrestFoams(b);
    const matchingVariants = getMatchingVariants(b);
    const currentModels = parseModels(b.model_name);

    return (
      <Card key={b.id} className="mb-4">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <InlineEditCell value={b.code} onSave={(v) => updateField(b.id, "code", v)} />
              {b.spring_type && <Badge variant="outline">Sprężyna: {b.spring_type}</Badge>}
              {matchingVariants.map((v) => v.description && (
                <Badge key={v.id} variant="secondary">Szycie: {v.description}</Badge>
              ))}
            </CardTitle>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" onClick={() => openEditForm(b)}>
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
                <ModelMultiSelect
                  selected={currentModels}
                  onChange={(models) => updateField(b.id, "model_name", joinModels(models))}
                  label="Modele"
                />
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
        title={editingItem ? `Edytuj oparcie ${(editingItem as any).code}` : "Dodaj oparcie"}
        fields={getBackrestFields()}
        initialData={editingItem}
        onSubmit={handleSubmit}
        onCancel={() => { setFormOpen(false); setEditingItem(null); }}
        isLoading={submitting}
      />
    </div>
  );
}
