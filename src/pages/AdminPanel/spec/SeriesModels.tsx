import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

type Seat = Tables<"seats_sofa">;
type Foam = Tables<"product_foams">;
type PillowMap = Tables<"seat_pillow_mapping">;

const seatFields: FieldDefinition[] = [
  { name: "code", label: "Kod", type: "text", required: true },
  { name: "model_name", label: "Model", type: "text" },
  { name: "type", label: "Typ (kod)", type: "text" },
  
  { name: "frame", label: "Stelaż", type: "text" },
  { name: "foam", label: "Pianka", type: "text" },
  { name: "front", label: "Przód", type: "text" },
  { name: "spring_type", label: "Sprężyna", type: "text" },
  { name: "frame_modification", label: "Modyfikacja stelaża", type: "text" },
  { name: "center_strip", label: "Środkowy pas", type: "boolean" },
  { name: "allowed_finishes", label: "Wykończenia", type: "multi-select", options: [
    { value: "A", label: "A" }, { value: "B", label: "B" }, { value: "C", label: "C" },
    { value: "D", label: "D" }, { value: "E", label: "E" },
  ]},
  { name: "default_finish", label: "Domyślne wykończenie", type: "text" },
];

export default function SeriesModels({ seriesId }: Props) {
  const [seats, setSeats] = useState<Seat[]>([]);
  const [foams, setFoams] = useState<Foam[]>([]);
  const [pillows, setPillows] = useState<PillowMap[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingSeat, setEditingSeat] = useState<Seat | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    const [seatsRes, foamsRes, pillowsRes] = await Promise.all([
      supabase.from("seats_sofa").select("*").eq("series_id", seriesId).order("code"),
      supabase.from("product_foams").select("*").eq("series_id", seriesId).order("position_number"),
      supabase.from("seat_pillow_mapping").select("*").eq("series_id", seriesId),
    ]);
    setSeats(seatsRes.data ?? []);
    setFoams(foamsRes.data ?? []);
    setPillows(pillowsRes.data ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, [seriesId]);

  const hasModels = seats.some((s) => s.model_name);
  const modelNames = useMemo(() => {
    if (!hasModels) return [];
    return [...new Set(seats.map((s) => s.model_name).filter(Boolean))] as string[];
  }, [seats, hasModels]);

  const updateSeatField = async (seatId: string, field: string, value: string) => {
    const boolFields = ["center_strip"];
    const parsed = boolFields.includes(field) ? value === "true" : (value || null);
    const { error } = await supabase.from("seats_sofa").update({ [field]: parsed }).eq("id", seatId);
    if (error) toast.error("Błąd zapisu");
    else { toast.success("Zapisano"); fetchAll(); }
  };

  const toggleCenterStrip = async (seatId: string, current: boolean) => {
    const { error } = await supabase.from("seats_sofa").update({ center_strip: !current }).eq("id", seatId);
    if (error) toast.error("Błąd zapisu");
    else { toast.success("Zapisano"); fetchAll(); }
  };

  const updateFoam = async (foamId: string, field: string, value: string) => {
    const numFields = ["height", "width", "length", "quantity", "position_number"];
    const parsed = numFields.includes(field) ? (value === "" ? null : Number(value)) : value || null;
    const { error } = await supabase.from("product_foams").update({ [field]: parsed, updated_at: new Date().toISOString() }).eq("id", foamId);
    if (error) toast.error("Błąd zapisu");
    else { toast.success("Zapisano"); fetchAll(); }
  };

  const addFoam = async (seatCode: string) => {
    const maxPos = foams.filter((f) => f.seat_code === seatCode).reduce((m, f) => Math.max(m, f.position_number ?? 0), 0);
    const { error } = await supabase.from("product_foams").insert({
      series_id: seriesId, seat_code: seatCode, component: "siedzisko", position_number: maxPos + 1, quantity: 1,
    });
    if (error) toast.error("Błąd dodawania pianki");
    else { toast.success("Dodano piankę"); fetchAll(); }
  };

  const deleteFoam = async (foamId: string) => {
    const { error } = await supabase.from("product_foams").delete().eq("id", foamId);
    if (error) toast.error("Błąd usuwania");
    else { toast.success("Usunięto piankę"); fetchAll(); }
  };

  const handleAddSeat = () => { setEditingSeat(null); setFormOpen(true); };
  const handleEditSeat = (seat: Seat) => { setEditingSeat(seat); setFormOpen(true); };

  const handleSubmitSeat = async (data: any) => {
    setSubmitting(true);
    try {
      if (editingSeat) {
        const { error } = await supabase.from("seats_sofa").update(data).eq("id", editingSeat.id);
        if (error) throw error;
        toast.success("✅ Siedzisko zaktualizowane");
      } else {
        const { error } = await supabase.from("seats_sofa").insert({ ...data, series_id: seriesId });
        if (error) throw error;
        toast.success("✅ Siedzisko dodane");
      }
      setFormOpen(false);
      setEditingSeat(null);
      fetchAll();
    } catch (err: any) {
      toast.error(`❌ ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSeat = async (id: string) => {
    const { error } = await supabase.from("seats_sofa").delete().eq("id", id);
    if (error) toast.error("Błąd usuwania");
    else { toast.success("✅ Siedzisko usunięte"); fetchAll(); }
  };

  if (loading) return <div className="text-muted-foreground py-8 text-center">Ładowanie...</div>;

  const getBaseSeatCode = (code: string): string | null => {
    if (code.endsWith("D")) {
      const base = code.slice(0, -1);
      // SD01ND → SD01N
      return base;
    }
    return null;
  };

  const renderSeatCard = (seat: Seat) => {
    // Filter out backrest foams (component !== 'oparcie')
    let seatFoams = foams.filter((f) => f.seat_code === seat.code && f.component !== "oparcie");
    let foamSource: string | null = null;

    // Split seat foam sharing logic
    if (seatFoams.length === 0) {
      const baseCode = getBaseSeatCode(seat.code);
      if (baseCode) {
        seatFoams = foams.filter((f) => f.seat_code === baseCode && f.component !== "oparcie");
        if (seatFoams.length > 0) {
          foamSource = baseCode;
        }
      }
    }

    const pillow = pillows.find((p) => p.seat_code === seat.code);

    return (
      <Card key={seat.id} className="mb-4">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <InlineEditCell value={seat.code} onSave={(v) => updateSeatField(seat.id, "code", v)} />
              {seat.type && <Badge variant="secondary">{seat.type}</Badge>}
              {seat.spring_type && <Badge variant="outline">Sprężyna: {seat.spring_type}</Badge>}
            </CardTitle>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" onClick={() => handleEditSeat(seat)}>
                <Pencil className="h-4 w-4" />
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Usunąć siedzisko {seat.code}?</AlertDialogTitle>
                    <AlertDialogDescription>Ta operacja jest nieodwracalna.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Anuluj</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleDeleteSeat(seat.id)}>Usuń</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
          {/* Info identyfikacyjne */}
          <div className="text-sm text-muted-foreground space-y-0.5 mt-1">
            <div className="flex gap-4 flex-wrap">
              <span>Model: <InlineEditCell value={seat.model_name} onSave={(v) => updateSeatField(seat.id, "model_name", v)} /></span>
              <span>Typ: <InlineEditCell value={seat.type} onSave={(v) => updateSeatField(seat.id, "type", v)} /></span>
              <span>Sprężyna: <InlineEditCell value={seat.spring_type} onSave={(v) => updateSeatField(seat.id, "spring_type", v)} /></span>
            </div>
            {seat.allowed_finishes && <div>Wykończenia: {seat.allowed_finishes.join(", ")} {seat.default_finish && `(domyślne: ${seat.default_finish})`}</div>}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Dane techniczne */}
          <div className="rounded-md border p-4 space-y-2">
            <h4 className="text-sm font-semibold mb-2">Dane techniczne</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-sm">
              <div className="flex items-center gap-2">
                <span className="font-medium text-muted-foreground w-36 shrink-0">Stelaż:</span>
                <InlineEditCell value={seat.frame} onSave={(v) => updateSeatField(seat.id, "frame", v)} />
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-muted-foreground w-36 shrink-0">Pasek środek:</span>
                <div className="flex items-center gap-1.5">
                  <Checkbox checked={seat.center_strip} onCheckedChange={() => toggleCenterStrip(seat.id, seat.center_strip)} />
                  <span className="text-xs">{seat.center_strip ? "TAK" : "NIE"}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:col-span-2">
                <span className="font-medium text-muted-foreground w-36 shrink-0">Modyfikacja stelaża:</span>
                <InlineEditCell value={seat.frame_modification} onSave={(v) => updateSeatField(seat.id, "frame_modification", v)} />
              </div>
            </div>
          </div>

          {/* Pianki szczegółowe */}
          {seatFoams.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold mb-2">
                Pianki szczegółowe
                {foamSource && <span className="font-normal text-muted-foreground ml-2">(Pianki jak {foamSource} + pasek środkowy)</span>}
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
                    {seatFoams.map((foam) => (
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
          <Button variant="outline" size="sm" onClick={() => addFoam(seat.code)}>
            <Plus className="mr-1 h-3 w-3" /> Dodaj piankę
          </Button>
          {pillow && (
            <div className="text-sm">
              <span className="font-medium">Poduszka oparciowa:</span> {pillow.pillow_code}
              {pillow.pillow_finish && ` (wykończenie: ${pillow.pillow_finish})`}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={handleAddSeat}><Plus className="mr-1 h-4 w-4" /> Dodaj siedzisko</Button>
      </div>

      {hasModels ? (
        <Tabs defaultValue={modelNames[0]}>
          <TabsList className="flex-wrap h-auto">
            {modelNames.map((name) => (
              <TabsTrigger key={name} value={name}>{name}</TabsTrigger>
            ))}
          </TabsList>
          {modelNames.map((name) => (
            <TabsContent key={name} value={name}>
              {seats.filter((s) => s.model_name === name).map(renderSeatCard)}
            </TabsContent>
          ))}
        </Tabs>
      ) : (
        <div>{seats.map(renderSeatCard)}</div>
      )}

      <ComponentForm
        open={formOpen}
        title={editingSeat ? `Edytuj siedzisko ${editingSeat.code}` : "Dodaj siedzisko"}
        fields={seatFields}
        initialData={editingSeat}
        onSubmit={handleSubmitSeat}
        onCancel={() => { setFormOpen(false); setEditingSeat(null); }}
        isLoading={submitting}
      />
    </div>
  );
}
