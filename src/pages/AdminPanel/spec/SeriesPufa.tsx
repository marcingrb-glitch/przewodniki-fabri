import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
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
  config: Tables<"series_config"> | null;
}

const LEG_TYPE_LABELS: Record<string, string> = {
  from_sku: "Z kodu SKU (drewniane)",
  plastic_2_5: "Plastikowe 2.5cm",
};

const pufaFields: FieldDefinition[] = [
  { name: "code", label: "Kod", type: "text", required: true },
  { name: "front_back", label: "Przód/Tył", type: "text" },
  { name: "sides", label: "Boki", type: "text" },
  { name: "base_foam", label: "Pianka bazowa", type: "text" },
  { name: "box_height", label: "Wysokość skrzyni", type: "text" },
];

export default function SeriesPufa({ seriesId, config }: Props) {
  const [pufas, setPufas] = useState<Tables<"seats_pufa">[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Tables<"seats_pufa"> | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    const { data } = await supabase.from("seats_pufa").select("*").eq("series_id", seriesId).order("code");
    setPufas(data ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, [seriesId]);

  const updateField = async (id: string, field: string, value: string) => {
    const { error } = await supabase.from("seats_pufa").update({ [field]: value || null }).eq("id", id);
    if (error) toast.error("Błąd zapisu");
    else { toast.success("Zapisano"); fetchAll(); }
  };

  const handleSubmit = async (data: any) => {
    setSubmitting(true);
    try {
      if (editingItem) {
        const { error } = await supabase.from("seats_pufa").update(data).eq("id", editingItem.id);
        if (error) throw error;
        toast.success("✅ Siedzisko pufy zaktualizowane");
      } else {
        const { error } = await supabase.from("seats_pufa").insert({ ...data, series_id: seriesId });
        if (error) throw error;
        toast.success("✅ Siedzisko pufy dodane");
      }
      setFormOpen(false); setEditingItem(null); fetchAll();
    } catch (err: any) { toast.error(`❌ ${err.message}`); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("seats_pufa").delete().eq("id", id);
    if (error) toast.error("Błąd usuwania");
    else { toast.success("✅ Siedzisko pufy usunięte"); fetchAll(); }
  };

  if (loading) return <div className="text-muted-foreground py-8 text-center">Ładowanie...</div>;

  return (
    <div className="space-y-4">
      {config && (
        <Card>
          <CardContent className="py-4">
            <div className="flex gap-4 text-sm flex-wrap">
              <Badge variant="outline">Nóżki: {LEG_TYPE_LABELS[config.pufa_leg_type ?? ""] ?? config.pufa_leg_type ?? "—"}</Badge>
              {config.pufa_leg_height_cm != null && <Badge variant="outline">Wysokość: {config.pufa_leg_height_cm} cm</Badge>}
              <Badge variant="secondary">
                Kompletacja: {config.pufa_leg_type === "plastic_2_5" ? "Tapicer (na stanowisku)" : "Dziewczyny od nóżek (kompletacja do worka)"}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Siedziska pufy</CardTitle>
            <Button size="sm" onClick={() => { setEditingItem(null); setFormOpen(true); }}><Plus className="mr-1 h-4 w-4" /> Dodaj siedzisko pufy</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kod</TableHead>
                  <TableHead>Przód/Tył</TableHead>
                  <TableHead>Boki</TableHead>
                  <TableHead>Pianka bazowa</TableHead>
                  <TableHead>Wysokość skrzyni</TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pufas.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-4">Brak siedzisk pufy</TableCell></TableRow>
                ) : pufas.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell><InlineEditCell value={p.code} onSave={(v) => updateField(p.id, "code", v)} /></TableCell>
                    <TableCell><InlineEditCell value={p.front_back} onSave={(v) => updateField(p.id, "front_back", v)} /></TableCell>
                    <TableCell><InlineEditCell value={p.sides} onSave={(v) => updateField(p.id, "sides", v)} /></TableCell>
                    <TableCell><InlineEditCell value={p.base_foam} onSave={(v) => updateField(p.id, "base_foam", v)} /></TableCell>
                    <TableCell><InlineEditCell value={p.box_height} onSave={(v) => updateField(p.id, "box_height", v)} /></TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditingItem(p); setFormOpen(true); }}>
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7"><Trash2 className="h-3 w-3 text-destructive" /></Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Usunąć siedzisko {p.code}?</AlertDialogTitle>
                              <AlertDialogDescription>Ta operacja jest nieodwracalna.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Anuluj</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(p.id)}>Usuń</AlertDialogAction>
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
        title={editingItem ? `Edytuj siedzisko ${editingItem.code}` : "Dodaj siedzisko pufy"}
        fields={pufaFields}
        initialData={editingItem}
        onSubmit={handleSubmit}
        onCancel={() => { setFormOpen(false); setEditingItem(null); }}
        isLoading={submitting}
      />
    </div>
  );
}
