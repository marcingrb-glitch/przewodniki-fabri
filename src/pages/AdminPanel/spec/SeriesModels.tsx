import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Tables } from "@/integrations/supabase/types";
import InlineEditCell from "./InlineEditCell";

interface Props {
  seriesId: string;
}

type Seat = Tables<"seats_sofa">;
type Foam = Tables<"product_foams">;
type PillowMap = Tables<"seat_pillow_mapping">;

export default function SeriesModels({ seriesId }: Props) {
  const [seats, setSeats] = useState<Seat[]>([]);
  const [foams, setFoams] = useState<Foam[]>([]);
  const [pillows, setPillows] = useState<PillowMap[]>([]);
  const [loading, setLoading] = useState(true);

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
    const names = [...new Set(seats.map((s) => s.model_name).filter(Boolean))] as string[];
    return names;
  }, [seats, hasModels]);

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
      series_id: seriesId,
      seat_code: seatCode,
      component: "siedzisko",
      position_number: maxPos + 1,
      quantity: 1,
    });
    if (error) toast.error("Błąd dodawania pianki");
    else { toast.success("Dodano piankę"); fetchAll(); }
  };

  if (loading) return <div className="text-muted-foreground py-8 text-center">Ładowanie...</div>;

  const renderSeatCard = (seat: Seat) => {
    const seatFoams = foams.filter((f) => f.seat_code === seat.code);
    const pillow = pillows.find((p) => p.seat_code === seat.code);

    return (
      <Card key={seat.id} className="mb-4">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            {seat.code}
            {seat.type && <Badge variant="secondary">{seat.type_name || seat.type}</Badge>}
            {seat.spring_type && <Badge variant="outline">Sprężyna: {seat.spring_type}</Badge>}
          </CardTitle>
          <div className="text-sm text-muted-foreground space-y-0.5">
            {seat.frame_modification && <div>Modyfikacja stelaża: {seat.frame_modification}</div>}
            {seat.allowed_finishes && <div>Wykończenia: {seat.allowed_finishes.join(", ")} {seat.default_finish && `(domyślne: ${seat.default_finish})`}</div>}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Foams table */}
          {seatFoams.length > 0 && (
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
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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

  if (hasModels) {
    return (
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
    );
  }

  return <div>{seats.map(renderSeatCard)}</div>;
}
