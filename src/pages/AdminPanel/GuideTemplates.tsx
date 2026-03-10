import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, ArrowUp, ArrowDown, GripVertical } from "lucide-react";

interface GuideColumn {
  header: string;
  field: string;
}

interface GuideSection {
  id: string;
  product_type: string;
  series_id: string | null;
  section_name: string;
  sort_order: number;
  is_conditional: boolean;
  condition_field: string | null;
  columns: GuideColumn[];
  enabled: boolean;
}

const AVAILABLE_FIELDS = [
  { value: "seat.code_finish", label: "Siedzisko (kod + wykończenie)" },
  { value: "seat.frame", label: "Siedzisko — stelaż" },
  { value: "seat.foams_summary", label: "Siedzisko — pianka" },
  { value: "seat.front", label: "Siedzisko — front" },
  { value: "seat.midStrip_yn", label: "Siedzisko — pasek środek" },
  { value: "backrest.code_finish", label: "Oparcie (kod + wykończenie)" },
  { value: "backrest.frame", label: "Oparcie — stelaż" },
  { value: "backrest.foams_summary", label: "Oparcie — pianka" },
  { value: "backrest.top", label: "Oparcie — góra" },
  { value: "side.code_finish", label: "Boczek (kod + wykończenie)" },
  { value: "side.frame", label: "Boczek — stelaż" },
  { value: "side.foam", label: "Boczek — pianka" },
  { value: "chest.name", label: "Skrzynia — nazwa" },
  { value: "chest_automat.label", label: "Skrzynia + Automat (etykieta)" },
  { value: "automat.code_name", label: "Automat (kod + nazwa)" },
  { value: "legs.code_color", label: "Nóżka (kod + kolor)" },
  { value: "legHeights.sofa_chest_info", label: "Nóżka — skrzynia info" },
  { value: "legHeights.sofa_seat_info", label: "Nóżka — siedzisko info" },
  { value: "pillow.code", label: "Poduszka — kod" },
  { value: "pillow.name", label: "Poduszka — nazwa" },
  { value: "pillow.finish_info", label: "Poduszka — wykończenie" },
  { value: "jaski.code", label: "Jaśki — kod" },
  { value: "jaski.name", label: "Jaśki — nazwa" },
  { value: "jaski.finish_info", label: "Jaśki — wykończenie" },
  { value: "walek.code", label: "Wałek — kod" },
  { value: "walek.name", label: "Wałek — nazwa" },
  { value: "walek.finish_info", label: "Wałek — wykończenie" },
  { value: "pufaSeat.frontBack", label: "Pufa — front/tył" },
  { value: "pufaSeat.sides", label: "Pufa — boki" },
  { value: "pufaSeat.foam", label: "Pufa — pianka bazowa" },
  { value: "pufaSeat.box", label: "Pufa — skrzynka" },
  { value: "pufaLegs.code", label: "Pufa nóżka — kod" },
  { value: "pufaLegs.count_info", label: "Pufa nóżka — ilość" },
  { value: "pufaLegs.height_info", label: "Pufa nóżka — wysokość" },
  { value: "fotelLegs.code", label: "Fotel nóżka — kod" },
  { value: "fotelLegs.count_info", label: "Fotel nóżka — ilość" },
  { value: "fotelLegs.height_info", label: "Fotel nóżka — wysokość" },
  { value: "extras.label", label: "Dodatki — etykieta" },
  { value: "extras.pufa_sku", label: "Dodatki — pufa SKU" },
  { value: "extras.fotel_sku", label: "Dodatki — fotel SKU" },
];

const CONDITION_FIELDS = [
  { value: "pillow", label: "Poduszka istnieje" },
  { value: "jaski", label: "Jaśki istnieją" },
  { value: "walek", label: "Wałek istnieje" },
  { value: "pufaLegs", label: "Nóżki pufy istnieją" },
  { value: "fotelLegs", label: "Nóżki fotela istnieją" },
  { value: "extras_pufa_fotel", label: "Pufa lub fotel w dodatkach" },
];

const emptySection = (productType: string): Omit<GuideSection, "id"> => ({
  product_type: productType,
  series_id: null,
  section_name: "",
  sort_order: 0,
  is_conditional: false,
  condition_field: null,
  columns: [{ header: "", field: "" }],
  enabled: true,
});

export default function GuideTemplates() {
  const [activeTab, setActiveTab] = useState("sofa");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<GuideSection | null>(null);
  const [form, setForm] = useState<Omit<GuideSection, "id">>(emptySection("sofa"));
  const queryClient = useQueryClient();

  const { data: sections = [], isLoading } = useQuery({
    queryKey: ["guide-sections"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("guide_sections")
        .select("*")
        .order("sort_order");
      if (error) throw error;
      return (data as unknown as GuideSection[]);
    },
  });

  const { data: seriesList = [] } = useQuery({
    queryKey: ["series-list"],
    queryFn: async () => {
      const { data, error } = await supabase.from("series").select("id, code, name").order("code");
      if (error) throw error;
      return data as { id: string; code: string; name: string }[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (section: Omit<GuideSection, "id"> & { id?: string }) => {
      const payload = {
        product_type: section.product_type,
        series_id: section.series_id || null,
        section_name: section.section_name,
        sort_order: section.sort_order,
        is_conditional: section.is_conditional,
        condition_field: section.is_conditional ? section.condition_field : null,
        columns: section.columns as any,
        enabled: section.enabled,
      };
      if (section.id) {
        const { error } = await supabase.from("guide_sections").update(payload).eq("id", section.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("guide_sections").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guide-sections"] });
      setDialogOpen(false);
      toast.success("Zapisano sekcję");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("guide_sections").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guide-sections"] });
      toast.success("Usunięto sekcję");
    },
  });

  const reorderMutation = useMutation({
    mutationFn: async ({ id, newOrder }: { id: string; newOrder: number }) => {
      const { error } = await supabase.from("guide_sections").update({ sort_order: newOrder }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["guide-sections"] }),
  });

  const filtered = sections.filter(s => s.product_type === activeTab);

  const openAdd = () => {
    const maxOrder = filtered.length > 0 ? Math.max(...filtered.map(s => s.sort_order)) : 0;
    setEditingSection(null);
    setForm({ ...emptySection(activeTab), sort_order: maxOrder + 1 });
    setDialogOpen(true);
  };

  const openEdit = (s: GuideSection) => {
    setEditingSection(s);
    setForm({
      product_type: s.product_type,
      series_id: s.series_id,
      section_name: s.section_name,
      sort_order: s.sort_order,
      is_conditional: s.is_conditional,
      condition_field: s.condition_field,
      columns: s.columns,
      enabled: s.enabled,
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.section_name.trim()) {
      toast.error("Podaj nazwę sekcji");
      return;
    }
    const validCols = form.columns.filter(c => c.header && c.field);
    if (validCols.length === 0) {
      toast.error("Dodaj przynajmniej jedną kolumnę");
      return;
    }
    saveMutation.mutate({
      ...form,
      columns: validCols,
      id: editingSection?.id,
    });
  };

  const moveSection = (s: GuideSection, direction: "up" | "down") => {
    const idx = filtered.indexOf(s);
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= filtered.length) return;
    const other = filtered[swapIdx];
    reorderMutation.mutate({ id: s.id, newOrder: other.sort_order });
    reorderMutation.mutate({ id: other.id, newOrder: s.sort_order });
  };

  const addColumn = () => setForm({ ...form, columns: [...form.columns, { header: "", field: "" }] });
  const removeColumn = (i: number) => setForm({ ...form, columns: form.columns.filter((_, idx) => idx !== i) });
  const updateColumn = (i: number, key: keyof GuideColumn, val: string) => {
    const cols = [...form.columns];
    cols[i] = { ...cols[i], [key]: val };
    setForm({ ...form, columns: cols });
  };

  const getSeriesName = (id: string | null) => {
    if (!id) return "Globalny";
    const s = seriesList.find(x => x.id === id);
    return s ? `${s.code} - ${s.name}` : id;
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">📄 Szablony przewodników PDF</h1>
      <p className="text-muted-foreground text-sm">
        Konfiguracja sekcji (tabel) wyświetlanych w przewodnikach produkcyjnych PDF.
        Sekcje globalne (bez serii) obowiązują dla wszystkich. Można nadpisać per seria.
      </p>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="sofa">SOFA</TabsTrigger>
          <TabsTrigger value="pufa">PUFA</TabsTrigger>
          <TabsTrigger value="fotel">FOTEL</TabsTrigger>
        </TabsList>

        {["sofa", "pufa", "fotel"].map(type => (
          <TabsContent key={type} value={type} className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={openAdd} size="sm"><Plus className="mr-1 h-4 w-4" /> Dodaj sekcję</Button>
            </div>

            {isLoading ? (
              <p className="text-muted-foreground">Ładowanie...</p>
            ) : filtered.length === 0 ? (
              <p className="text-muted-foreground">Brak sekcji dla tego typu.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">#</TableHead>
                    <TableHead>Nazwa sekcji</TableHead>
                    <TableHead>Kolumny</TableHead>
                    <TableHead>Seria</TableHead>
                    <TableHead>Warunkowa</TableHead>
                    <TableHead>Aktywna</TableHead>
                    <TableHead className="w-32">Akcje</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((s, idx) => (
                    <TableRow key={s.id} className={!s.enabled ? "opacity-50" : ""}>
                      <TableCell>
                        <div className="flex flex-col items-center gap-0.5">
                          <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => moveSection(s, "up")} disabled={idx === 0}>
                            <ArrowUp className="h-3 w-3" />
                          </Button>
                          <span className="text-xs text-muted-foreground">{s.sort_order}</span>
                          <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => moveSection(s, "down")} disabled={idx === filtered.length - 1}>
                            <ArrowDown className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{s.section_name}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {(s.columns as GuideColumn[]).map(c => c.header).join(" | ")}
                      </TableCell>
                      <TableCell className="text-xs">{getSeriesName(s.series_id)}</TableCell>
                      <TableCell className="text-xs">
                        {s.is_conditional ? `✓ (${s.condition_field})` : "—"}
                      </TableCell>
                      <TableCell>{s.enabled ? "✓" : "✗"}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(s)}><Pencil className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => { if (confirm("Usunąć sekcję?")) deleteMutation.mutate(s.id); }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TabsContent>
        ))}
      </Tabs>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingSection ? "Edytuj sekcję" : "Nowa sekcja"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Nazwa sekcji</Label>
                <Input value={form.section_name} onChange={e => setForm({ ...form, section_name: e.target.value })} placeholder="np. Siedzisko" />
              </div>
              <div>
                <Label>Kolejność</Label>
                <Input type="number" value={form.sort_order} onChange={e => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Seria (puste = globalny)</Label>
                <Select value={form.series_id || "__global__"} onValueChange={v => setForm({ ...form, series_id: v === "__global__" ? null : v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__global__">Globalny (wszystkie serie)</SelectItem>
                    {seriesList.map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.code} - {s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end gap-4">
                <div className="flex items-center gap-2">
                  <Switch checked={form.enabled} onCheckedChange={v => setForm({ ...form, enabled: v })} />
                  <Label>Aktywna</Label>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch checked={form.is_conditional} onCheckedChange={v => setForm({ ...form, is_conditional: v })} />
                <Label>Warunkowa</Label>
              </div>
              {form.is_conditional && (
                <Select value={form.condition_field || ""} onValueChange={v => setForm({ ...form, condition_field: v })}>
                  <SelectTrigger className="w-64"><SelectValue placeholder="Pole warunku" /></SelectTrigger>
                  <SelectContent>
                    {CONDITION_FIELDS.map(cf => (
                      <SelectItem key={cf.value} value={cf.value}>{cf.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Kolumny tabeli</Label>
                <Button variant="outline" size="sm" onClick={addColumn}><Plus className="mr-1 h-3 w-3" /> Kolumna</Button>
              </div>
              {form.columns.map((col, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
                  <Input
                    placeholder="Nagłówek"
                    value={col.header}
                    onChange={e => updateColumn(i, "header", e.target.value)}
                    className="flex-1"
                  />
                  <Select value={col.field} onValueChange={v => updateColumn(i, "field", v)}>
                    <SelectTrigger className="flex-1"><SelectValue placeholder="Pole danych" /></SelectTrigger>
                    <SelectContent>
                      {AVAILABLE_FIELDS.map(f => (
                        <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button variant="ghost" size="icon" onClick={() => removeColumn(i)} disabled={form.columns.length <= 1}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Anuluj</Button>
            <Button onClick={handleSave} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? "Zapisywanie..." : "Zapisz"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
