import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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

type Side = Tables<"sides">;
type Seat = Tables<"seats_sofa">;
type Compat = Tables<"seat_side_compatibility">;

const sideFields: FieldDefinition[] = [
  { name: "code", label: "Kod", type: "text", required: true },
  { name: "name", label: "Nazwa", type: "text", required: true },
  { name: "frame", label: "Stelaż", type: "text" },
  { name: "allowed_finishes", label: "Wykończenia", type: "multi-select", options: [
    { value: "A", label: "A" }, { value: "B", label: "B" }, { value: "C", label: "C" },
    { value: "D", label: "D" }, { value: "E", label: "E" },
  ]},
  { name: "default_finish", label: "Domyślne wykończenie", type: "text" },
];

export default function SeriesSides({ seriesId }: Props) {
  const [sides, setSides] = useState<Side[]>([]);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [compat, setCompat] = useState<Compat[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingSide, setEditingSide] = useState<Side | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    const [sidesRes, seatsRes, compatRes] = await Promise.all([
      supabase.from("sides").select("*").eq("series_id", seriesId).order("code"),
      supabase.from("seats_sofa").select("*").eq("series_id", seriesId).order("code"),
      supabase.from("seat_side_compatibility").select("*").eq("series_id", seriesId),
    ]);
    setSides(sidesRes.data ?? []);
    setSeats(seatsRes.data ?? []);
    setCompat(compatRes.data ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, [seriesId]);

  const updateSideField = async (sideId: string, field: string, value: string) => {
    const { error } = await supabase.from("sides").update({ [field]: value || null }).eq("id", sideId);
    if (error) toast.error("Błąd zapisu");
    else { toast.success("Zapisano"); fetchAll(); }
  };

  const handleSubmitSide = async (data: any) => {
    setSubmitting(true);
    try {
      if (editingSide) {
        const { error } = await supabase.from("sides").update(data).eq("id", editingSide.id);
        if (error) throw error;
        toast.success("✅ Boczek zaktualizowany");
      } else {
        const { error } = await supabase.from("sides").insert({ ...data, series_id: seriesId });
        if (error) throw error;
        toast.success("✅ Boczek dodany");
      }
      setFormOpen(false); setEditingSide(null); fetchAll();
    } catch (err: any) { toast.error(`❌ ${err.message}`); }
    finally { setSubmitting(false); }
  };

  const handleDeleteSide = async (id: string) => {
    const { error } = await supabase.from("sides").delete().eq("id", id);
    if (error) toast.error("Błąd usuwania");
    else { toast.success("✅ Boczek usunięty"); fetchAll(); }
  };

  const getCompat = (sideCode: string, seatCode: string) => compat.find((c) => c.side_code === sideCode && c.seat_code === seatCode);

  const toggleCompat = async (sideCode: string, seatCode: string) => {
    const existing = getCompat(sideCode, seatCode);
    if (existing) {
      const { error } = await supabase.from("seat_side_compatibility").update({ compatible: !existing.compatible }).eq("id", existing.id);
      if (error) toast.error("Błąd zapisu"); else fetchAll();
    } else {
      const { error } = await supabase.from("seat_side_compatibility").insert({ series_id: seriesId, side_code: sideCode, seat_code: seatCode, compatible: true });
      if (error) toast.error("Błąd zapisu"); else fetchAll();
    }
  };

  if (loading) return <div className="text-muted-foreground py-8 text-center">Ładowanie...</div>;

  const uniqueSeats = seats.filter((s) => !s.code.endsWith("D"));

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Boczki</CardTitle>
            <Button size="sm" onClick={() => { setEditingSide(null); setFormOpen(true); }}><Plus className="mr-1 h-4 w-4" /> Dodaj boczek</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kod</TableHead>
                  <TableHead>Nazwa</TableHead>
                  <TableHead>Stelaż</TableHead>
                  <TableHead>Wykończenia</TableHead>
                  <TableHead>Domyślne</TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sides.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-4">Brak boczków</TableCell></TableRow>
                ) : sides.map((side) => (
                  <TableRow key={side.id}>
                    <TableCell><InlineEditCell value={side.code} onSave={(v) => updateSideField(side.id, "code", v)} /></TableCell>
                    <TableCell><InlineEditCell value={side.name} onSave={(v) => updateSideField(side.id, "name", v)} /></TableCell>
                    <TableCell><InlineEditCell value={side.frame} onSave={(v) => updateSideField(side.id, "frame", v)} /></TableCell>
                    <TableCell>{side.allowed_finishes?.join(", ") ?? "—"}</TableCell>
                    <TableCell>{side.default_finish ?? "—"}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditingSide(side); setFormOpen(true); }}>
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7"><Trash2 className="h-3 w-3 text-destructive" /></Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Usunąć boczek {side.code}?</AlertDialogTitle>
                              <AlertDialogDescription>Ta operacja jest nieodwracalna.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Anuluj</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteSide(side.id)}>Usuń</AlertDialogAction>
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

      {compat.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-lg">Kompatybilność boczek ↔ siedzisko</CardTitle></CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Boczek</TableHead>
                    {uniqueSeats.map((seat) => (
                      <TableHead key={seat.code} className="text-center">
                        <div>{seat.code}</div>
                        {seat.model_name && <div className="text-xs font-normal text-muted-foreground">{seat.model_name}</div>}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sides.map((side) => (
                    <TableRow key={side.code}>
                      <TableCell className="font-medium">{side.code} {side.name}</TableCell>
                      {uniqueSeats.map((seat) => {
                        const c = getCompat(side.code, seat.code);
                        return (
                          <TableCell key={seat.code} className="text-center">
                            <Checkbox checked={c?.compatible ?? false} onCheckedChange={() => toggleCompat(side.code, seat.code)} />
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
      )}

      <ComponentForm
        open={formOpen}
        title={editingSide ? `Edytuj boczek ${editingSide.code}` : "Dodaj boczek"}
        fields={sideFields}
        initialData={editingSide}
        onSubmit={handleSubmitSide}
        onCancel={() => { setFormOpen(false); setEditingSide(null); }}
        isLoading={submitting}
      />
    </div>
  );
}
