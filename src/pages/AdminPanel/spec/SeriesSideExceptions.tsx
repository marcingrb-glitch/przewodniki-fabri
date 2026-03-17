import { useState, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getUserFriendlyError } from "@/utils/errorHandler";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2, AlertTriangle } from "lucide-react";

interface Props {
  seriesProductId: string;
}

interface SideException {
  id: string;
  original_code: string;
  mapped_code: string;
  description: string;
}

export default function SeriesSideExceptions({ seriesProductId }: Props) {
  const queryClient = useQueryClient();
  const queryKey = ["side-exceptions", seriesProductId];

  const { data: exceptions = [], isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_relations")
        .select("id, properties")
        .eq("series_id", seriesProductId)
        .eq("relation_type", "side_exception")
        .eq("active", true);
      if (error) throw error;
      return (data ?? []).map((r) => ({
        id: r.id,
        original_code: (r.properties as any)?.original_code ?? "",
        mapped_code: (r.properties as any)?.mapped_code ?? "",
        description: (r.properties as any)?.description ?? "",
      })) as SideException[];
    },
  });

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<SideException | null>(null);
  const [form, setForm] = useState({ original_code: "", mapped_code: "", description: "" });
  const [submitting, setSubmitting] = useState(false);

  const openAdd = () => {
    setEditing(null);
    setForm({ original_code: "", mapped_code: "", description: "" });
    setFormOpen(true);
  };

  const openEdit = (item: SideException) => {
    setEditing(item);
    setForm({ original_code: item.original_code, mapped_code: item.mapped_code, description: item.description });
    setFormOpen(true);
  };

  const handleSubmit = useCallback(async () => {
    if (!form.original_code || !form.mapped_code) {
      toast.error("Kod oryginalny i zamapowany są wymagane");
      return;
    }
    setSubmitting(true);
    try {
      const properties = {
        original_code: form.original_code.toUpperCase(),
        mapped_code: form.mapped_code.toUpperCase(),
        description: form.description,
      };
      if (editing) {
        const { error } = await supabase
          .from("product_relations")
          .update({ properties })
          .eq("id", editing.id);
        if (error) throw error;
        toast.success("✅ Wyjątek zaktualizowany");
      } else {
        const { error } = await supabase
          .from("product_relations")
          .insert([{
            series_id: seriesProductId,
            relation_type: "side_exception",
            properties,
          }]);
        if (error) throw error;
        toast.success("✅ Wyjątek dodany");
      }
      queryClient.invalidateQueries({ queryKey });
      setFormOpen(false);
    } catch (err: any) {
      toast.error(`❌ ${getUserFriendlyError(err)}`);
    } finally {
      setSubmitting(false);
    }
  }, [form, editing, seriesProductId, queryClient, queryKey]);

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm("Usunąć ten wyjątek?")) return;
    try {
      const { error } = await supabase.from("product_relations").delete().eq("id", id);
      if (error) throw error;
      toast.success("✅ Wyjątek usunięty");
      queryClient.invalidateQueries({ queryKey });
    } catch (err: any) {
      toast.error(`❌ ${getUserFriendlyError(err)}`);
    }
  }, [queryClient, queryKey]);

  const isAlias = (mapped: string) => !/[A-D]$/.test(mapped);

  if (isLoading) return <p className="text-muted-foreground text-center py-8">Ładowanie...</p>;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Wyjątki boczków (Shopify)</CardTitle>
            <CardDescription className="mt-1">
              Mapowania kodów boczków z zewnętrznych systemów na kody wewnętrzne
            </CardDescription>
          </div>
          <Button size="sm" onClick={openAdd}>
            <Plus className="h-4 w-4 mr-1" /> Dodaj wyjątek
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-md border bg-muted/30 p-3 text-sm text-muted-foreground flex gap-2">
          <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
          <div>
            <strong>Alias kodu</strong> (np. B6S→B6): finish z SKU zostanie zachowany (B6SC→B6C).
            <br />
            <strong>Exact mapping</strong> (np. B6D→B6C): cały segment zostanie zamieniony as-is.
          </div>
        </div>

        {exceptions.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">Brak wyjątków dla tej serii.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kod w SKU (Shopify)</TableHead>
                <TableHead>Zamień na</TableHead>
                <TableHead>Typ</TableHead>
                <TableHead>Opis</TableHead>
                <TableHead className="w-24">Akcje</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {exceptions.map((ex) => (
                <TableRow key={ex.id}>
                  <TableCell className="font-mono font-medium">{ex.original_code}</TableCell>
                  <TableCell className="font-mono font-medium">{ex.mapped_code}</TableCell>
                  <TableCell>
                    <Badge variant={isAlias(ex.mapped_code) ? "default" : "secondary"}>
                      {isAlias(ex.mapped_code) ? "Alias" : "Exact"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{ex.description}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(ex)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(ex.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        <Dialog open={formOpen} onOpenChange={setFormOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? "Edytuj wyjątek" : "Dodaj wyjątek"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Kod w SKU (Shopify)</label>
                <Input
                  value={form.original_code}
                  onChange={(e) => setForm({ ...form, original_code: e.target.value })}
                  placeholder="np. B6S"
                  className="font-mono"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Zamień na</label>
                <Input
                  value={form.mapped_code}
                  onChange={(e) => setForm({ ...form, mapped_code: e.target.value })}
                  placeholder="np. B6"
                  className="font-mono"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Opis</label>
                <Textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="np. Shopify standard → Aera"
                  rows={2}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setFormOpen(false)}>Anuluj</Button>
              <Button onClick={handleSubmit} disabled={submitting}>
                {submitting ? "Zapisywanie..." : editing ? "Zapisz" : "Dodaj"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
