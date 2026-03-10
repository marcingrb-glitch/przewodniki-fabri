import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Tables } from "@/integrations/supabase/types";
import { Json } from "@/integrations/supabase/types";
import InlineEditCell from "./InlineEditCell";
import ComponentForm, { FieldDefinition } from "@/components/admin/ComponentForm";

interface Props {
  seriesId: string;
  config: Tables<"series_config"> | null;
  seriesCode?: string;
}

const LEG_TYPE_LABELS: Record<string, string> = {
  from_sku: "N z SKU",
  built_in_plastic: "Wbudowane plastikowe",
  plastic_2_5: "N4 plastikowe",
};

const formatColors = (colors: Json): string => {
  if (!colors) return "—";
  if (typeof colors === "object" && !Array.isArray(colors)) {
    return Object.entries(colors).map(([k, v]) => `${k}=${v}`).join(", ");
  }
  if (Array.isArray(colors)) {
    if (colors.length === 0) return "—";
    if (typeof colors[0] === "object") return colors.map((c: any) => `${c.code}=${c.name}`).join(", ");
    return colors.join(", ");
  }
  return String(colors);
};

const legFields: FieldDefinition[] = [
  { name: "code", label: "Kod", type: "text", required: true },
  { name: "name", label: "Nazwa", type: "text", required: true },
  { name: "material", label: "Materiał", type: "text" },
  { name: "colors", label: "Kolory", type: "colors" },
];

export default function SeriesLegs({ seriesId, config, seriesCode }: Props) {
  const [legs, setLegs] = useState<Tables<"legs">[]>([]);
  const [chests, setChests] = useState<Tables<"chests">[]>([]);
  const [automats, setAutomats] = useState<Tables<"automats">[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingLeg, setEditingLeg] = useState<Tables<"legs"> | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const availableChests: string[] = (config as any)?.available_chests ?? [];

  const fetchAll = async () => {
    setLoading(true);
    const [legsRes, chestsRes, automatsRes] = await Promise.all([
      supabase.from("legs").select("*").eq("series_id", seriesId).order("code"),
      availableChests.length > 0
        ? supabase.from("chests").select("*").in("code", availableChests).order("code")
        : Promise.resolve({ data: [] as Tables<"chests">[] }),
      supabase.from("automats").select("*").eq("series_id", seriesId).order("code"),
    ]);
    setLegs(legsRes.data ?? []);
    setChests(chestsRes.data ?? []);
    setAutomats(automatsRes.data ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, [seriesId, config]);

  const updateLegField = async (legId: string, field: string, value: string) => {
    const { error } = await supabase.from("legs").update({ [field]: value || null }).eq("id", legId);
    if (error) toast.error("Błąd zapisu");
    else { toast.success("Zapisano"); fetchAll(); }
  };

  const handleSubmitLeg = async (data: any) => {
    setSubmitting(true);
    try {
      if (editingLeg) {
        const { error } = await supabase.from("legs").update(data).eq("id", editingLeg.id);
        if (error) throw error;
        toast.success("✅ Nóżka zaktualizowana");
      } else {
        const { error } = await supabase.from("legs").insert({ ...data, series_id: seriesId });
        if (error) throw error;
        toast.success("✅ Nóżka dodana");
      }
      setFormOpen(false); setEditingLeg(null); fetchAll();
    } catch (err: any) { toast.error(`❌ ${err.message}`); }
    finally { setSubmitting(false); }
  };

  const handleDeleteLeg = async (id: string) => {
    const { error } = await supabase.from("legs").delete().eq("id", id);
    if (error) toast.error("Błąd usuwania");
    else { toast.success("✅ Nóżka usunięta"); fetchAll(); }
  };

  if (loading) return <div className="text-muted-foreground py-8 text-center">Ładowanie...</div>;

  // Build mount rows
  interface MountRow { element: string; detail: string; type: string; height: string; count: string; who: string; }
  const mountRows: MountRow[] = [];

  for (const c of chests) {
    const isPlastic = c.leg_height_cm <= 2.5;
    mountRows.push({
      element: "Pod skrzynią",
      detail: c.code,
      type: isPlastic ? "N4 plastikowe" : "N z SKU",
      height: `${c.leg_height_cm} cm`,
      count: "4 szt",
      who: isPlastic ? "Tapicer (na stanowisku)" : "Dziewczyny od nóżek (kompletacja do worka)",
    });
  }

  for (const a of automats) {
    if (a.has_seat_legs) {
      const seatType = config?.seat_leg_type ?? "from_sku";
      const isPlastic = seatType === "plastic_2_5";
      mountRows.push({
        element: "Pod siedziskiem",
        detail: a.code,
        type: isPlastic ? "N4 plastikowe" : seatType === "built_in_plastic" ? "Wbudowane plastikowe" : "N z SKU",
        height: isPlastic ? "2.5 cm" : `${a.seat_leg_height_cm ?? config?.seat_leg_height_cm ?? "?"} cm`,
        count: `${a.seat_leg_count ?? 2} szt`,
        who: isPlastic ? "Tapicer (na stanowisku)" : seatType === "built_in_plastic" ? "Tapicer (wbudowane)" : "Dziewczyny od nóżek (kompletacja do worka)",
      });
    } else {
      mountRows.push({ element: "Pod siedziskiem", detail: a.code, type: "BRAK", height: "—", count: "—", who: "—" });
    }
  }

  if (automats.length === 0 && config) {
    const seatType = config.seat_leg_type ?? "from_sku";
    const isPlastic = seatType === "plastic_2_5";
    mountRows.push({
      element: "Pod siedziskiem", detail: "",
      type: LEG_TYPE_LABELS[seatType] ?? seatType ?? "—",
      height: config.seat_leg_height_cm != null ? `${config.seat_leg_height_cm} cm` : "—",
      count: "—",
      who: isPlastic ? "Tapicer (na stanowisku)" : seatType === "built_in_plastic" ? "Tapicer (wbudowane)" : "Dziewczyny od nóżek (kompletacja do worka)",
    });
  }

  if (config) {
    const pufaType = config.pufa_leg_type ?? "from_sku";
    const isPlastic = pufaType === "plastic_2_5";
    mountRows.push({
      element: "Pufa", detail: "",
      type: LEG_TYPE_LABELS[pufaType] ?? pufaType ?? "—",
      height: config.pufa_leg_height_cm != null ? `${config.pufa_leg_height_cm} cm` : "—",
      count: "4 szt",
      who: isPlastic ? "Tapicer (na stanowisku)" : pufaType === "built_in_plastic" ? "Tapicer (wbudowane)" : "Dziewczyny od nóżek (kompletacja do worka)",
    });
  }

  // Don't add Fotel row for S2
  if (seriesCode !== "S2") {
    mountRows.push({ element: "Fotel", detail: "", type: "N z SKU", height: "15 cm", count: "4 szt", who: "Dziewczyny od nóżek (kompletacja do worka)" });
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Nóżki</CardTitle>
            <Button size="sm" onClick={() => { setEditingLeg(null); setFormOpen(true); }}><Plus className="mr-1 h-4 w-4" /> Dodaj nóżkę</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kod</TableHead>
                  <TableHead>Nazwa</TableHead>
                  <TableHead>Materiał</TableHead>
                  <TableHead>Kolory</TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {legs.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-4">Brak nóżek</TableCell></TableRow>
                ) : legs.map((leg) => (
                  <TableRow key={leg.id}>
                    <TableCell><InlineEditCell value={leg.code} onSave={(v) => updateLegField(leg.id, "code", v)} /></TableCell>
                    <TableCell><InlineEditCell value={leg.name} onSave={(v) => updateLegField(leg.id, "name", v)} /></TableCell>
                    <TableCell><InlineEditCell value={leg.material} onSave={(v) => updateLegField(leg.id, "material", v)} /></TableCell>
                    <TableCell>{formatColors(leg.colors)}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditingLeg(leg); setFormOpen(true); }}>
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7"><Trash2 className="h-3 w-3 text-destructive" /></Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Usunąć nóżkę {leg.code}?</AlertDialogTitle>
                              <AlertDialogDescription>Ta operacja jest nieodwracalna.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Anuluj</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteLeg(leg.id)}>Usuń</AlertDialogAction>
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

      {config && (
        <Card>
          <CardHeader><CardTitle className="text-lg">Kto co kompletuje</CardTitle></CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Element</TableHead>
                    <TableHead>Szczegóły</TableHead>
                    <TableHead>Typ nóżek</TableHead>
                    <TableHead>Wysokość</TableHead>
                    <TableHead>Ilość</TableHead>
                    <TableHead>Kto kompletuje</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mountRows.map((row, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{row.element}</TableCell>
                      <TableCell>{row.detail || "—"}</TableCell>
                      <TableCell>{row.type}</TableCell>
                      <TableCell>{row.height}</TableCell>
                      <TableCell>{row.count}</TableCell>
                      <TableCell>{row.who}</TableCell>
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
        title={editingLeg ? `Edytuj nóżkę ${editingLeg.code}` : "Dodaj nóżkę"}
        fields={legFields}
        initialData={editingLeg}
        onSubmit={handleSubmitLeg}
        onCancel={() => { setFormOpen(false); setEditingLeg(null); }}
        isLoading={submitting}
      />
    </div>
  );
}
