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

type Backrest = Tables<"backrests"> & { spring_type?: string | null; sewing_notes?: string | null };
type Foam = Tables<"product_foams">;

const backrestFields: FieldDefinition[] = [
  { name: "code", label: "Kod", type: "text", required: true },
  { name: "height_cm", label: "Wysokość (cm)", type: "text" },
  { name: "frame", label: "Stelaż", type: "text" },
  { name: "foam", label: "Pianka", type: "text" },
  { name: "top", label: "Góra", type: "text" },
  { name: "spring_type", label: "Sprężyna", type: "text" },
  { name: "sewing_notes", label: "Warianty szycia", type: "text" },
  { name: "allowed_finishes", label: "Wykończenia", type: "multi-select", options: [
    { value: "A", label: "A" }, { value: "B", label: "B" }, { value: "C", label: "C" },
    { value: "D", label: "D" }, { value: "E", label: "E" },
  ]},
  { name: "default_finish", label: "Domyślne wykończenie", type: "text" },
];

export default function SeriesBackrests({ seriesId }: Props) {
  const [backrests, setBackrests] = useState<Backrest[]>([]);
  const [foams, setFoams] = useState<Foam[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Backrest | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    const [backrestsRes, foamsRes] = await Promise.all([
      supabase.from("backrests").select("*").eq("series_id", seriesId).order("code"),
      supabase.from("product_foams").select("*").eq("series_id", seriesId).order("position_number"),
    ]);
    setBackrests((backrestsRes.data ?? []) as Backrest[]);
    setFoams(foamsRes.data ?? []);
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
      if (editingItem) {
        const { error } = await supabase.from("backrests").update(data).eq("id", editingItem.id);
        if (error) throw error;
        toast.success("✅ Oparcie zaktualizowane");
      } else {
        const { error } = await supabase.from("backrests").insert({ ...data, series_id: seriesId });
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

  const addFoam = async (backrestCode: string) => {
    const backrestFoams = foams.filter((f) => f.seat_code === backrestCode);
    const maxPos = backrestFoams.reduce((m, f) => Math.max(m, f.position_number ?? 0), 0);
    const { error } = await supabase.from("product_foams").insert({
      series_id: seriesId, seat_code: backrestCode, component: "oparcie", position_number: maxPos + 1, quantity: 1,
    });
    if (error) toast.error("Błąd dodawania pianki");
    else { toast.success("Dodano piankę"); fetchAll(); }
  };

  const deleteFoam = async (foamId: string) => {
    const { error } = await supabase.from("product_foams").delete().eq("id", foamId);
    if (error) toast.error("Błąd usuwania");
    else { toast.success("Usunięto piankę"); fetchAll(); }
  };

  if (loading) return <div className="text-muted-foreground py-8 text-center">Ładowanie...</div>;

  const renderBackrestCard = (b: Backrest) => {
    const backrestFoams = foams.filter((f) => f.seat_code === b.code);

    return (
      <Card key={b.id} className="mb-4">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <InlineEditCell value={b.code} onSave={(v) => updateField(b.id, "code", v)} />
              {b.spring_type && <Badge variant="outline">Sprężyna: {b.spring_type}</Badge>}
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
                    <AlertDialogTitle>Usunąć oparcie {b.code}?</AlertDialogTitle>
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
            </div>
          </div>

          {/* Warianty szycia */}
          <div className="rounded-md border p-4 space-y-2">
            <h4 className="text-sm font-semibold mb-2">Warianty szycia</h4>
            <InlineEditCell value={b.sewing_notes} onSave={(v) => updateField(b.id, "sewing_notes", v)} placeholder="uzupełnij warianty szycia" />
          </div>

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
          <Button variant="outline" size="sm" onClick={() => addFoam(b.code)}>
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
