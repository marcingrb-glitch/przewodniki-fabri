import { useState, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { getUserFriendlyError } from "@/utils/errorHandler";
import { Tables } from "@/integrations/supabase/types";

interface Props {
  seriesProductId: string;
}

type ProductRow = Tables<"products">;
type RelationRow = Tables<"product_relations">;

export default function SeriesAutomats({ seriesProductId }: Props) {
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<RelationRow | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [selectedAutomatId, setSelectedAutomatId] = useState("");
  const [hasSeatLegs, setHasSeatLegs] = useState(false);
  const [seatLegHeight, setSeatLegHeight] = useState("0");
  const [seatLegCount, setSeatLegCount] = useState("0");

  const queryKey = ["series-automats", seriesProductId];

  const { data: globalAutomats = [] } = useQuery({
    queryKey: ["global-automats-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, code, name, properties")
        .eq("category", "automat")
        .eq("is_global", true)
        .order("code");
      if (error) throw error;
      return data as ProductRow[];
    },
  });

  const { data: seriesAutomats = [], isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_relations")
        .select("id, source_product_id, target_product_id, properties, series_id, relation_type, active, created_at")
        .eq("series_id", seriesProductId)
        .eq("relation_type", "automat_config")
        .order("created_at");
      if (error) throw error;
      return data as RelationRow[];
    },
    enabled: !!seriesProductId,
  });

  const automatMap = new Map(globalAutomats.map(a => [a.id, a]));

  const openAdd = () => {
    setEditing(null);
    setSelectedAutomatId("");
    setHasSeatLegs(false);
    setSeatLegHeight("0");
    setSeatLegCount("0");
    setFormOpen(true);
  };

  const openEdit = (sa: RelationRow) => {
    setEditing(sa);
    setSelectedAutomatId(sa.source_product_id ?? "");
    const saProps = (sa.properties as Record<string, any>) ?? {};
    setHasSeatLegs(saProps.has_seat_legs ?? false);
    setSeatLegHeight(String(saProps.seat_leg_height_cm ?? 0));
    setSeatLegCount(String(saProps.seat_leg_count ?? 0));
    setFormOpen(true);
  };

  const handleSubmit = useCallback(async () => {
    if (!selectedAutomatId) { toast.error("Wybierz automat"); return; }
    setSubmitting(true);
    try {
      const properties = {
        has_seat_legs: hasSeatLegs,
        seat_leg_height_cm: parseFloat(seatLegHeight) || 0,
        seat_leg_count: parseInt(seatLegCount) || 0,
      };
      if (editing) {
        const { error } = await supabase
          .from("product_relations")
          .update({ properties })
          .eq("id", editing.id);
        if (error) throw error;
        toast.success("✅ Zaktualizowano");
      } else {
        const { error } = await supabase
          .from("product_relations")
          .insert([{
            series_id: seriesProductId,
            relation_type: "automat_config",
            source_product_id: selectedAutomatId,
            properties,
          }]);
        if (error) throw error;
        toast.success("✅ Dodano automat do serii");
      }
      queryClient.invalidateQueries({ queryKey });
      setFormOpen(false);
    } catch (err: any) {
      toast.error(`❌ ${getUserFriendlyError(err)}`);
    } finally {
      setSubmitting(false);
    }
  }, [selectedAutomatId, hasSeatLegs, seatLegHeight, seatLegCount, editing, seriesProductId, queryClient, queryKey]);

  const handleDelete = useCallback(async (id: string) => {
    try {
      const { error } = await supabase.from("product_relations").delete().eq("id", id);
      if (error) throw error;
      toast.success("✅ Usunięto");
      queryClient.invalidateQueries({ queryKey });
    } catch (err: any) {
      toast.error(`❌ ${getUserFriendlyError(err)}`);
    }
  }, [queryClient, queryKey]);

  // IDs already assigned
  const assignedIds = new Set(seriesAutomats.map(sa => sa.source_product_id));
  const availableForAdd = globalAutomats.filter(a => !assignedIds.has(a.id) || editing?.source_product_id === a.id);

  if (isLoading) return <div className="text-muted-foreground py-8 text-center">Ładowanie...</div>;

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Automaty przypisane do serii</CardTitle>
          <Button size="sm" onClick={openAdd}><Plus className="h-4 w-4 mr-1" /> Dodaj</Button>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">
            Globalne automaty zarządzasz w <strong>Wspólne → Automaty</strong>. Tutaj przypisujesz je do serii i ustawiasz parametry nóżek pod siedziskiem.
          </p>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kod</TableHead>
                  <TableHead>Nazwa</TableHead>
                  <TableHead>Typ</TableHead>
                  <TableHead>Nóżki</TableHead>
                  <TableHead>Wysokość (cm)</TableHead>
                  <TableHead>Ilość</TableHead>
                  <TableHead className="w-[80px]">Akcje</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {seriesAutomats.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-4">Brak automatów w tej serii</TableCell></TableRow>
                ) : seriesAutomats.map((sa) => {
                  const global = automatMap.get(sa.source_product_id ?? "");
                  const saProps = (sa.properties as Record<string, any>) ?? {};
                  return (
                    <TableRow key={sa.id}>
                      <TableCell className="font-mono font-bold">{global?.code ?? "?"}</TableCell>
                      <TableCell>{global?.name ?? "?"}</TableCell>
                      <TableCell>{(global?.properties as any)?.type ?? "—"}</TableCell>
                      <TableCell>{saProps.has_seat_legs ? "Tak" : "Nie"}</TableCell>
                      <TableCell>{saProps.has_seat_legs ? saProps.seat_leg_height_cm : "—"}</TableCell>
                      <TableCell>{saProps.has_seat_legs ? `${saProps.seat_leg_count} szt` : "—"}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(sa)}><Pencil className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(sa.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edytuj automat w serii" : "Dodaj automat do serii"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Automat</Label>
              <Select value={selectedAutomatId} onValueChange={setSelectedAutomatId} disabled={!!editing}>
                <SelectTrigger><SelectValue placeholder="Wybierz automat..." /></SelectTrigger>
                <SelectContent>
                  {(editing ? globalAutomats : availableForAdd).map(a => (
                    <SelectItem key={a.id} value={a.id}>{a.code} — {a.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={hasSeatLegs} onCheckedChange={setHasSeatLegs} />
              <Label>Nóżki pod siedziskiem</Label>
            </div>
            {hasSeatLegs && (
              <>
                <div>
                  <Label>Wysokość nóżek (cm)</Label>
                  <Input type="number" value={seatLegHeight} onChange={e => setSeatLegHeight(e.target.value)} />
                </div>
                <div>
                  <Label>Ilość nóżek</Label>
                  <Input type="number" value={seatLegCount} onChange={e => setSeatLegCount(e.target.value)} />
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Anuluj</Button>
            <Button onClick={handleSubmit} disabled={submitting}>{submitting ? "Zapisuję..." : "Zapisz"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
