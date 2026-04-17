/**
 * Admin panel — Etykiety V2 (duże 100×150mm, generator labelsV2.ts).
 *
 * MVP: tabela + JSON editor dla `sections` (rich editor w przyszłej iteracji).
 * Sekcje są seedowane w migracji `20260416_03_label_templates_v2.sql`.
 */
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Edit, Copy } from "lucide-react";
import { toast } from "sonner";

interface SheetV2 {
  id: string;
  product_type: string;
  series_id: string | null;
  sheet_name: string;
  sort_order: number;
  is_conditional: boolean;
  condition_field: string | null;
  header_template: string | null;
  show_meta_row: boolean;
  include_in_v3: boolean;
  sections: unknown;
}

interface Series {
  id: string;
  code: string;
  name: string;
}

const PRODUCT_TYPES = ["sofa", "naroznik", "pufa", "fotel"] as const;
const PRODUCT_TYPE_LABELS: Record<string, string> = {
  sofa: "Sofa",
  naroznik: "Narożnik",
  pufa: "Pufa",
  fotel: "Fotel",
};

const CONDITION_FIELDS: { value: string; label: string }[] = [
  { value: "", label: "(brak)" },
  { value: "has_special_notes", label: "Tylko gdy są uwagi specjalne" },
  { value: "has_chaise", label: "Tylko gdy jest szezlong" },
  { value: "extras_pufa_fotel", label: "Tylko z pufą lub fotelem" },
];

export default function LabelTemplatesV2() {
  const queryClient = useQueryClient();
  const [filterProduct, setFilterProduct] = useState<string>("all");
  const [filterSeries, setFilterSeries] = useState<string>("all");
  const [editing, setEditing] = useState<SheetV2 | null>(null);

  const { data: sheets = [], isLoading } = useQuery({
    queryKey: ["label-templates-v2"],
    queryFn: async () => {
      const client = supabase.from("label_templates_v2" as never) as any;
      const { data, error } = await client
        .select("*")
        .order("product_type")
        .order("sort_order");
      if (error) throw error;
      return data as SheetV2[];
    },
  });

  const { data: seriesList = [] } = useQuery({
    queryKey: ["series-list-v2"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, code, name")
        .eq("category", "series")
        .eq("active", true)
        .order("code");
      if (error) throw error;
      return data as Series[];
    },
  });

  const seriesById = Object.fromEntries(seriesList.map((s) => [s.id, s]));

  const saveMutation = useMutation({
    mutationFn: async (sheet: SheetV2) => {
      const client = supabase.from("label_templates_v2" as never) as any;
      const { error } = await client
        .update({
          product_type: sheet.product_type,
          series_id: sheet.series_id,
          sheet_name: sheet.sheet_name,
          sort_order: sheet.sort_order,
          is_conditional: sheet.is_conditional,
          condition_field: sheet.condition_field,
          header_template: sheet.header_template,
          show_meta_row: sheet.show_meta_row,
          include_in_v3: sheet.include_in_v3,
          sections: sheet.sections,
          updated_at: new Date().toISOString(),
        })
        .eq("id", sheet.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Zapisano zmiany");
      queryClient.invalidateQueries({ queryKey: ["label-templates-v2"] });
      setEditing(null);
    },
    onError: (e: any) => toast.error(`Błąd zapisu: ${e.message || e}`),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const client = supabase.from("label_templates_v2" as never) as any;
      const { error } = await client.delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Usunięto");
      queryClient.invalidateQueries({ queryKey: ["label-templates-v2"] });
    },
    onError: (e: any) => toast.error(`Błąd usuwania: ${e.message || e}`),
  });

  const createMutation = useMutation({
    mutationFn: async (sheet: Omit<SheetV2, "id">) => {
      const client = supabase.from("label_templates_v2" as never) as any;
      const { error } = await client.insert(sheet);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Utworzono nowy szablon");
      queryClient.invalidateQueries({ queryKey: ["label-templates-v2"] });
    },
    onError: (e: any) => toast.error(`Błąd tworzenia: ${e.message || e}`),
  });

  const duplicate = (sheet: SheetV2) => {
    const { id, ...rest } = sheet;
    createMutation.mutate({
      ...rest,
      sheet_name: `${rest.sheet_name} (kopia)`,
      sort_order: rest.sort_order + 1,
    });
  };

  const createBlank = () => {
    createMutation.mutate({
      product_type: "sofa",
      series_id: null,
      sheet_name: "Nowy szablon",
      sort_order: 99,
      is_conditional: false,
      condition_field: null,
      header_template: "{sheet_name} · {series.code}",
      show_meta_row: true,
      include_in_v3: false,
      sections: [],
    });
  };

  const filtered = sheets.filter((s) => {
    if (filterProduct !== "all" && s.product_type !== filterProduct) return false;
    if (filterSeries !== "all") {
      if (filterSeries === "global" && s.series_id !== null) return false;
      if (filterSeries !== "global" && s.series_id !== filterSeries) return false;
    }
    return true;
  });

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>🏷️ Etykiety V2 (duże 100×150mm)</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                Duże etykiety z pełnym briefem dla tapicera. Sekcje w JSONB (plain/bullet_list/table/diagram_box).
                V1 zostaje nietknięte.
              </p>
            </div>
            <Button size="sm" onClick={createBlank}>
              <Plus className="h-4 w-4 mr-1" /> Nowy szablon
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-3 items-end">
            <div>
              <Label className="text-xs">Typ produktu</Label>
              <Select value={filterProduct} onValueChange={setFilterProduct}>
                <SelectTrigger className="w-40 h-8"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Wszystkie</SelectItem>
                  {PRODUCT_TYPES.map((t) => <SelectItem key={t} value={t}>{PRODUCT_TYPE_LABELS[t]}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Seria</Label>
              <Select value={filterSeries} onValueChange={setFilterSeries}>
                <SelectTrigger className="w-48 h-8"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Wszystkie</SelectItem>
                  <SelectItem value="global">Globalne (bez serii)</SelectItem>
                  {seriesList.map((s) => <SelectItem key={s.id} value={s.id}>{s.code} · {s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {isLoading ? (
            <p className="text-sm text-muted-foreground">Ładowanie…</p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground">Brak szablonów dla wybranych filtrów.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Typ</TableHead>
                  <TableHead>Seria</TableHead>
                  <TableHead>Nazwa</TableHead>
                  <TableHead className="w-16 text-center">Sort</TableHead>
                  <TableHead className="w-20 text-center">V3?</TableHead>
                  <TableHead className="w-32 text-center">Warunek</TableHead>
                  <TableHead className="w-20 text-center">Sekcje</TableHead>
                  <TableHead className="w-32 text-right">Akcje</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((sheet) => {
                  const series = sheet.series_id ? seriesById[sheet.series_id] : null;
                  const sectionsCount = Array.isArray(sheet.sections) ? sheet.sections.length : 0;
                  return (
                    <TableRow key={sheet.id}>
                      <TableCell><Badge variant="outline">{PRODUCT_TYPE_LABELS[sheet.product_type]}</Badge></TableCell>
                      <TableCell>{series ? `${series.code}·${series.name}` : <span className="text-muted-foreground italic">global</span>}</TableCell>
                      <TableCell className="font-medium">{sheet.sheet_name}</TableCell>
                      <TableCell className="text-center">{sheet.sort_order}</TableCell>
                      <TableCell className="text-center">{sheet.include_in_v3 ? "✅" : "—"}</TableCell>
                      <TableCell className="text-center text-xs">
                        {sheet.is_conditional ? (sheet.condition_field || "?") : "—"}
                      </TableCell>
                      <TableCell className="text-center">{sectionsCount}</TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditing(sheet)} title="Edytuj">
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => duplicate(sheet)} title="Duplikuj">
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => {
                            if (confirm(`Usunąć szablon "${sheet.sheet_name}"?`)) deleteMutation.mutate(sheet.id);
                          }}
                          title="Usuń"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {editing && (
        <EditSheetDialog
          sheet={editing}
          seriesList={seriesList}
          onClose={() => setEditing(null)}
          onSave={(s) => saveMutation.mutate(s)}
          isPending={saveMutation.isPending}
        />
      )}
    </div>
  );
}

function EditSheetDialog({
  sheet,
  seriesList,
  onClose,
  onSave,
  isPending,
}: {
  sheet: SheetV2;
  seriesList: Series[];
  onClose: () => void;
  onSave: (s: SheetV2) => void;
  isPending: boolean;
}) {
  const [draft, setDraft] = useState<SheetV2>(sheet);
  const [sectionsJson, setSectionsJson] = useState(() =>
    JSON.stringify(sheet.sections ?? [], null, 2)
  );
  const [jsonError, setJsonError] = useState<string | null>(null);

  const handleSave = () => {
    try {
      const parsed = JSON.parse(sectionsJson);
      if (!Array.isArray(parsed)) throw new Error("sections must be an array");
      onSave({ ...draft, sections: parsed });
    } catch (e: any) {
      setJsonError(`JSON błąd: ${e.message || e}`);
    }
  };

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edycja szablonu: {sheet.sheet_name}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Typ produktu</Label>
            <Select value={draft.product_type} onValueChange={(v) => setDraft({ ...draft, product_type: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {PRODUCT_TYPES.map((t) => <SelectItem key={t} value={t}>{PRODUCT_TYPE_LABELS[t]}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Seria</Label>
            <Select
              value={draft.series_id ?? "global"}
              onValueChange={(v) => setDraft({ ...draft, series_id: v === "global" ? null : v })}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="global">Globalne (bez serii)</SelectItem>
                {seriesList.map((s) => <SelectItem key={s.id} value={s.id}>{s.code} · {s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-2">
            <Label>Nazwa szablonu</Label>
            <Input value={draft.sheet_name} onChange={(e) => setDraft({ ...draft, sheet_name: e.target.value })} />
          </div>
          <div>
            <Label>Kolejność (sort_order)</Label>
            <Input
              type="number"
              value={draft.sort_order}
              onChange={(e) => setDraft({ ...draft, sort_order: parseInt(e.target.value) || 0 })}
            />
          </div>
          <div className="flex items-center gap-2 pt-6">
            <Switch checked={draft.include_in_v3} onCheckedChange={(v) => setDraft({ ...draft, include_in_v3: v })} />
            <Label>Włącz do trybu V3 (hybrid)</Label>
          </div>
          <div className="col-span-2">
            <Label>Szablon nagłówka (np. "{"{sheet_name}"} · {"{series.code}"}")</Label>
            <Input
              value={draft.header_template ?? ""}
              onChange={(e) => setDraft({ ...draft, header_template: e.target.value || null })}
              placeholder="{sheet_name} · {series.code}"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Dostępne zmienne: {"{sheet_name}, {series.code}, {series.name}, {series.collection}, {orientation}"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={draft.show_meta_row} onCheckedChange={(v) => setDraft({ ...draft, show_meta_row: v })} />
            <Label>Pokaż linię meta (zamówienie + wymiary)</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={draft.is_conditional} onCheckedChange={(v) => setDraft({ ...draft, is_conditional: v })} />
            <Label>Warunkowy (pomiń gdy nie spełniony)</Label>
          </div>
          {draft.is_conditional && (
            <div className="col-span-2">
              <Label>Warunek (condition_field)</Label>
              <Select
                value={draft.condition_field ?? ""}
                onValueChange={(v) => setDraft({ ...draft, condition_field: v || null })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CONDITION_FIELDS.map((c) => <SelectItem key={c.value} value={c.value || "__none__"}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <div>
          <Label>Sekcje (JSON)</Label>
          <p className="text-xs text-muted-foreground mb-2">
            Tablica obiektów. Każda sekcja: <code className="text-[10px]">{"{ title?, component, style, display_fields[][], fields?, box_size_mm?, condition_field? }"}</code>.
            Style: <code>plain</code>, <code>bullet_list</code>, <code>table</code>, <code>diagram_box</code>.
          </p>
          <Textarea
            value={sectionsJson}
            onChange={(e) => { setSectionsJson(e.target.value); setJsonError(null); }}
            className="font-mono text-xs min-h-[200px]"
            rows={15}
          />
          {jsonError && <p className="text-xs text-destructive mt-1">{jsonError}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Anuluj</Button>
          <Button onClick={handleSave} disabled={isPending}>
            {isPending ? "Zapisywanie…" : "Zapisz"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
