import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
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

const backrestFields: FieldDefinition[] = [
  { name: "code", label: "Kod", type: "text", required: true },
  { name: "height_cm", label: "Wysokość (cm)", type: "text" },
  { name: "frame", label: "Stelaż", type: "text" },
  { name: "foam", label: "Pianka", type: "text" },
  { name: "top", label: "Góra", type: "text" },
  { name: "allowed_finishes", label: "Wykończenia", type: "multi-select", options: [
    { value: "A", label: "A" }, { value: "B", label: "B" }, { value: "C", label: "C" },
    { value: "D", label: "D" }, { value: "E", label: "E" },
  ]},
  { name: "default_finish", label: "Domyślne wykończenie", type: "text" },
];

export default function SeriesBackrests({ seriesId }: Props) {
  const [backrests, setBackrests] = useState<Tables<"backrests">[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Tables<"backrests"> | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    const { data } = await supabase.from("backrests").select("*").eq("series_id", seriesId).order("code");
    setBackrests(data ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, [seriesId]);

  const updateField = async (id: string, field: string, value: string) => {
    const { error } = await supabase.from("backrests").update({ [field]: value || null }).eq("id", id);
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

  if (loading) return <div className="text-muted-foreground py-8 text-center">Ładowanie...</div>;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Oparcia</CardTitle>
            <Button size="sm" onClick={() => { setEditingItem(null); setFormOpen(true); }}><Plus className="mr-1 h-4 w-4" /> Dodaj oparcie</Button>
          </div>
        </CardHeader>
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
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {backrests.length === 0 ? (
                  <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-4">Brak oparć</TableCell></TableRow>
                ) : backrests.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell><InlineEditCell value={b.code} onSave={(v) => updateField(b.id, "code", v)} /></TableCell>
                    <TableCell><InlineEditCell value={b.height_cm} onSave={(v) => updateField(b.id, "height_cm", v)} /></TableCell>
                    <TableCell><InlineEditCell value={b.frame} onSave={(v) => updateField(b.id, "frame", v)} /></TableCell>
                    <TableCell><InlineEditCell value={b.foam} onSave={(v) => updateField(b.id, "foam", v)} /></TableCell>
                    <TableCell><InlineEditCell value={b.top} onSave={(v) => updateField(b.id, "top", v)} /></TableCell>
                    <TableCell>{b.allowed_finishes?.join(", ") ?? "—"}</TableCell>
                    <TableCell>{b.default_finish ?? "—"}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditingItem(b); setFormOpen(true); }}>
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7"><Trash2 className="h-3 w-3 text-destructive" /></Button>
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
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

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
