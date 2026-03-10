import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, ArrowUp, ArrowDown, ChevronDown, Copy, Eye, Download } from "lucide-react";
import { GuideSection, GuideColumn, FIELD_GROUPS, AVAILABLE_FIELDS, CONDITION_FIELDS } from "./fieldResolver";
import DecodingPreview from "./DecodingPreview";
import PDFPreview from "@/components/PDFPreview";
import { generateDecodingPDF } from "@/utils/pdfGenerators/decodingPDF";
import { buildExampleDecoded } from "./decodingHelpers";

const PRODUCT_TYPE = "decoding";

const emptySection = (): Omit<GuideSection, "id"> => ({
  product_type: PRODUCT_TYPE,
  series_id: null,
  section_name: "",
  sort_order: 0,
  is_conditional: false,
  condition_field: null,
  columns: [],
  enabled: true,
});

export default function DecodingTemplates() {
  const [selectedSeriesId, setSelectedSeriesId] = useState<string>("__global__");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<GuideSection | null>(null);
  const [form, setForm] = useState<Omit<GuideSection, "id">>(emptySection());
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [showPdfPreview, setShowPdfPreview] = useState(false);
  const [generating, setGenerating] = useState(false);
  const queryClient = useQueryClient();

  // Load all guide_sections for decoding
  const { data: sections = [], isLoading } = useQuery({
    queryKey: ["guide-sections"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("guide_sections")
        .select("*")
        .order("sort_order");
      if (error) throw error;
      return data as unknown as GuideSection[];
    },
  });

  const { data: seriesList = [] } = useQuery({
    queryKey: ["series-list"],
    queryFn: async () => {
      const { data, error } = await supabase.from("series").select("id, code, name, collection").order("code");
      if (error) throw error;
      return data;
    },
  });

  // Example data for preview — uses first series or selected
  const seriesFilter = selectedSeriesId !== "__global__" ? selectedSeriesId : seriesList[0]?.id;

  const { data: exampleData } = useQuery({
    queryKey: ["decoding-example-data", seriesFilter],
    queryFn: async () => {
      const sid = seriesFilter;
      const [seatRes, sideRes, backrestRes, chestRes, automatRes, legRes, pufaSeatRes, pillowRes, finishRes, jaskiRes, walekRes, fabricRes] = await Promise.all([
        supabase.from("seats_sofa").select("code, type, frame, front, spring_type, center_strip, frame_modification").eq("series_id", sid!).limit(1).maybeSingle(),
        supabase.from("sides").select("code, name, frame").eq("series_id", sid!).limit(1).maybeSingle(),
        supabase.from("backrests").select("code, height_cm, frame, top, spring_type").eq("series_id", sid!).limit(1).maybeSingle(),
        supabase.from("chests").select("code, name, leg_height_cm, leg_count").limit(1).maybeSingle(),
        supabase.from("automats").select("code, name, type").limit(1).maybeSingle(),
        supabase.from("legs").select("code, name, material, colors").limit(1).maybeSingle(),
        supabase.from("seats_pufa").select("code, front_back, sides, base_foam, box_height").eq("series_id", sid!).limit(1).maybeSingle(),
        supabase.from("pillows").select("code, name").limit(1).maybeSingle(),
        supabase.from("finishes").select("code, name").limit(1).maybeSingle(),
        supabase.from("jaskis").select("code, name").limit(1).maybeSingle(),
        supabase.from("waleks").select("code, name").limit(1).maybeSingle(),
        supabase.from("fabrics").select("code, name, price_group, colors").limit(1).maybeSingle(),
      ]);

      const selectedSeries = seriesList.find(s => s.id === sid);

      return {
        seat: seatRes.data, side: sideRes.data, backrest: backrestRes.data,
        chest: chestRes.data, automat: automatRes.data,
        series: selectedSeries || { code: "S1", name: "Seria", collection: "Kolekcja" },
        leg: legRes.data, pufaSeat: pufaSeatRes.data, pillow: pillowRes.data,
        finish: finishRes.data, jaski: jaskiRes.data, walek: walekRes.data,
        fabric: fabricRes.data,
      };
    },
    enabled: !!seriesFilter,
    staleTime: 5 * 60 * 1000,
  });

  const decoded = useMemo(() => {
    if (!exampleData) return null;
    return buildExampleDecoded(exampleData);
  }, [exampleData]);

  // Filtered sections for decoding type
  const filtered = sections.filter(s =>
    s.product_type === PRODUCT_TYPE &&
    (selectedSeriesId === "__global__" ? s.series_id === null : s.series_id === selectedSeriesId)
  );

  const canCopy = selectedSeriesId !== "__global__" && filtered.length === 0;

  // CRUD mutations
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

  const copyForSeriesMutation = useMutation({
    mutationFn: async (seriesId: string) => {
      const globals = sections.filter(s => s.product_type === PRODUCT_TYPE && s.series_id === null);
      const inserts = globals.map(s => ({
        product_type: s.product_type,
        section_name: s.section_name,
        sort_order: s.sort_order,
        is_conditional: s.is_conditional,
        condition_field: s.condition_field,
        columns: s.columns as any,
        enabled: s.enabled,
        series_id: seriesId,
      }));
      if (inserts.length === 0) return;
      const { error } = await supabase.from("guide_sections").insert(inserts);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guide-sections"] });
      toast.success("Skopiowano sekcje globalne dla serii");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const seedDefaultsMutation = useMutation({
    mutationFn: async () => {
      const sid = selectedSeriesId === "__global__" ? null : selectedSeriesId;
      const defaults = [
        { section_name: "Tkanina", sort_order: 0, columns: [
          { header: "Kod", field: "fabric.code" }, { header: "Nazwa", field: "fabric.name" },
          { header: "Kolor", field: "fabric.color" }, { header: "Grupa", field: "fabric.group" },
        ]},
        { section_name: "Siedzisko — Stolarka", sort_order: 1, columns: [
          { header: "Kod", field: "seat.code" }, { header: "Typ", field: "seat.type" },
          { header: "Stelaż", field: "seat.frame" }, { header: "Mod. stelaża", field: "seat.frameModification" },
          { header: "Sprężyna", field: "seat.springType" }, { header: "Wykończenie", field: "seat.finish_name" },
        ]},
        { section_name: "Siedzisko — Pianki", sort_order: 2, columns: [
          { header: "Pianka", field: "seat.foams_summary" }, { header: "Front", field: "seat.front" },
          { header: "Pasek środek", field: "seat.midStrip_yn" },
        ]},
        { section_name: "Oparcie", sort_order: 3, columns: [
          { header: "Kod", field: "backrest.code" }, { header: "Stelaż", field: "backrest.frame" },
          { header: "Pianka", field: "backrest.foams_summary" }, { header: "Góra", field: "backrest.top" },
          { header: "Sprężyna", field: "backrest.springType" }, { header: "Wykończenie", field: "backrest.finish_name" },
        ]},
        { section_name: "Boczek", sort_order: 4, columns: [
          { header: "Kod", field: "side.code" }, { header: "Stelaż", field: "side.frame" },
          { header: "Wykończenie", field: "side.finish_name" },
        ]},
        { section_name: "Skrzynia + Automat", sort_order: 5, columns: [
          { header: "Skrzynia", field: "chest.name" }, { header: "Automat", field: "automat.code_name" },
        ]},
        { section_name: "Nóżki", sort_order: 6, columns: [
          { header: "Kod + kolor", field: "legs.code_color" },
          { header: "Skrzynia info", field: "legHeights.sofa_chest_info" },
          { header: "Siedzisko info", field: "legHeights.sofa_seat_info" },
        ]},
        { section_name: "Poduszka", sort_order: 7, is_conditional: true, condition_field: "pillow", columns: [
          { header: "Kod", field: "pillow.code" }, { header: "Nazwa", field: "pillow.name" },
          { header: "Wykończenie", field: "pillow.finish_info" },
        ]},
        { section_name: "Jaśki", sort_order: 8, is_conditional: true, condition_field: "jaski", columns: [
          { header: "Kod", field: "jaski.code" }, { header: "Nazwa", field: "jaski.name" },
          { header: "Wykończenie", field: "jaski.finish_info" },
        ]},
        { section_name: "Wałek", sort_order: 9, is_conditional: true, condition_field: "walek", columns: [
          { header: "Kod", field: "walek.code" }, { header: "Nazwa", field: "walek.name" },
          { header: "Wykończenie", field: "walek.finish_info" },
        ]},
        { section_name: "Pufa", sort_order: 10, is_conditional: true, condition_field: "extras_pufa_fotel", columns: [
          { header: "Front/tył", field: "pufaSeat.frontBack" }, { header: "Boki", field: "pufaSeat.sides" },
          { header: "Pianka", field: "pufaSeat.foam" }, { header: "Skrzynka", field: "pufaSeat.box" },
          { header: "Nóżka kod", field: "pufaLegs.code" }, { header: "Wys.", field: "pufaLegs.height_info" },
          { header: "Ilość", field: "pufaLegs.count_info" },
        ]},
        { section_name: "Fotel", sort_order: 11, is_conditional: true, condition_field: "fotelLegs", columns: [
          { header: "Nóżka kod", field: "fotelLegs.code" }, { header: "Wys.", field: "fotelLegs.height_info" },
          { header: "Ilość", field: "fotelLegs.count_info" },
        ]},
      ];
      const inserts = defaults.map(d => ({
        product_type: PRODUCT_TYPE,
        series_id: sid,
        section_name: d.section_name,
        sort_order: d.sort_order,
        is_conditional: d.is_conditional || false,
        condition_field: d.condition_field || null,
        columns: d.columns as any,
        enabled: true,
      }));
      const { error } = await supabase.from("guide_sections").insert(inserts);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guide-sections"] });
      toast.success("Wstawiono domyślne sekcje dekodowania");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const openAdd = () => {
    const maxOrder = filtered.length > 0 ? Math.max(...filtered.map(s => s.sort_order)) : 0;
    setEditingSection(null);
    setForm({
      ...emptySection(),
      sort_order: maxOrder + 1,
      series_id: selectedSeriesId === "__global__" ? null : selectedSeriesId,
    });
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

  const toggleField = (fieldValue: string) => {
    const exists = form.columns.find(c => c.field === fieldValue);
    if (exists) {
      setForm({ ...form, columns: form.columns.filter(c => c.field !== fieldValue) });
    } else {
      const fieldDef = AVAILABLE_FIELDS.find(f => f.value === fieldValue);
      const groupDef = FIELD_GROUPS.find(g => g.key === fieldDef?.group);
      const defaultHeader = fieldDef ? `${groupDef?.label || ""} — ${fieldDef.label}` : fieldValue;
      setForm({ ...form, columns: [...form.columns, { header: defaultHeader, field: fieldValue }] });
    }
  };

  const removeColumn = (i: number) => setForm({ ...form, columns: form.columns.filter((_, idx) => idx !== i) });
  const updateColumnHeader = (i: number, val: string) => {
    const cols = [...form.columns];
    cols[i] = { ...cols[i], header: val };
    setForm({ ...form, columns: cols });
  };
  const moveColumn = (i: number, direction: "up" | "down") => {
    const cols = [...form.columns];
    const swapIdx = direction === "up" ? i - 1 : i + 1;
    if (swapIdx < 0 || swapIdx >= cols.length) return;
    [cols[i], cols[swapIdx]] = [cols[swapIdx], cols[i]];
    setForm({ ...form, columns: cols });
  };

  // PDF actions
  const handlePdfPreview = async () => {
    if (!decoded) { toast.error("Brak danych"); return; }
    setGenerating(true);
    try {
      const blob = await generateDecodingPDF(decoded);
      setPdfBlob(blob);
      setShowPdfPreview(true);
    } catch (err) {
      console.error(err);
      toast.error("Błąd generowania PDF");
    } finally {
      setGenerating(false);
    }
  };

  const handlePdfDownload = async () => {
    if (!decoded) return;
    setGenerating(true);
    try {
      const blob = await generateDecodingPDF(decoded);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "dekodowanie-przyklad.pdf";
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      toast.error("Błąd pobierania PDF");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">🔍 Szablony dekodowania PDF</h1>
      <p className="text-muted-foreground text-sm">
        Konfiguracja sekcji wyświetlanych w dokumencie dekodowania SKU.
        Sekcje globalne obowiązują dla wszystkich serii. Można nadpisać per seria.
      </p>

      {/* Series selector + actions */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Label className="text-sm whitespace-nowrap">Seria:</Label>
          <Select value={selectedSeriesId} onValueChange={setSelectedSeriesId}>
            <SelectTrigger className="w-64"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__global__">Globalny (wszystkie serie)</SelectItem>
              {seriesList.map(s => (
                <SelectItem key={s.id} value={s.id}>{s.code} - {s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {canCopy && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => copyForSeriesMutation.mutate(selectedSeriesId)}
              disabled={copyForSeriesMutation.isPending}
            >
              <Copy className="mr-1 h-4 w-4" /> Nadpisz dla tej serii
            </Button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handlePdfPreview} disabled={generating || !decoded} variant="outline" size="sm">
            <Eye className="mr-1 h-4 w-4" /> Podgląd PDF
          </Button>
          <Button onClick={handlePdfDownload} disabled={generating || !decoded} variant="outline" size="sm">
            <Download className="mr-1 h-4 w-4" /> Pobierz PDF
          </Button>
          <Button onClick={openAdd} size="sm"><Plus className="mr-1 h-4 w-4" /> Dodaj sekcję</Button>
        </div>
      </div>

      {/* Section list */}
      {isLoading ? (
        <p className="text-muted-foreground">Ładowanie...</p>
      ) : filtered.length === 0 ? (
        <div className="space-y-3">
          <p className="text-muted-foreground">
            {selectedSeriesId !== "__global__"
              ? 'Brak nadpisań — używane są sekcje globalne. Kliknij "Nadpisz dla tej serii" aby skopiować.'
              : 'Brak sekcji. Wstaw domyślne lub dodaj ręcznie.'}
          </p>
          <Button
            variant="outline"
            onClick={() => seedDefaultsMutation.mutate()}
            disabled={seedDefaultsMutation.isPending}
          >
            <Plus className="mr-1 h-4 w-4" /> Wstaw domyślne sekcje
          </Button>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">#</TableHead>
              <TableHead>Nazwa sekcji</TableHead>
              <TableHead>Kolumny</TableHead>
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

      {/* Inline preview */}
      <DecodingPreview sections={filtered} exampleData={exampleData} seriesId={selectedSeriesId === "__global__" ? null : selectedSeriesId} />

      {/* PDF preview dialog */}
      {showPdfPreview && (
        <PDFPreview
          pdfBlob={pdfBlob}
          title="Podgląd dekodowania SKU"
          fileName="dekodowanie-przyklad.pdf"
          onClose={() => setShowPdfPreview(false)}
        />
      )}

      {/* Section edit dialog */}
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

            <div className="space-y-3">
              <Label>Kolumny tabeli</Label>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full justify-between text-xs font-normal">
                    <span>
                      {form.columns.length === 0 ? (
                        <span className="text-muted-foreground italic">wybierz pola...</span>
                      ) : (
                        <span>{form.columns.length} pól wybrano</span>
                      )}
                    </span>
                    <ChevronDown className="h-3 w-3 ml-1 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[380px] p-2 max-h-[400px] overflow-y-auto" align="start">
                  <div className="space-y-0.5">
                    {FIELD_GROUPS.map((group, gi) => {
                      const groupFields = AVAILABLE_FIELDS.filter(f => f.group === group.key);
                      if (groupFields.length === 0) return null;
                      return (
                        <div key={group.key}>
                          {gi > 0 && <Separator className="my-1.5" />}
                          <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide px-2 pt-1 pb-0.5">
                            {group.label}
                          </p>
                          {groupFields.map(field => (
                            <label
                              key={field.value}
                              className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-accent cursor-pointer text-sm"
                            >
                              <Checkbox
                                checked={form.columns.some(c => c.field === field.value)}
                                onCheckedChange={() => toggleField(field.value)}
                              />
                              <span className="truncate">{field.label}</span>
                              <span className="text-muted-foreground text-[10px] ml-auto font-mono shrink-0">{field.value}</span>
                            </label>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                </PopoverContent>
              </Popover>

              {form.columns.length > 0 && (
                <div className="space-y-1.5 border rounded-md p-2">
                  {form.columns.map((col, i) => (
                    <div key={`${col.field}-${i}`} className="flex gap-1.5 items-center">
                      <div className="flex flex-col gap-0.5 shrink-0">
                        <Button variant="ghost" size="icon" className="h-4 w-4" onClick={() => moveColumn(i, "up")} disabled={i === 0}>
                          <ArrowUp className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-4 w-4" onClick={() => moveColumn(i, "down")} disabled={i === form.columns.length - 1}>
                          <ArrowDown className="h-3 w-3" />
                        </Button>
                      </div>
                      <Badge variant="outline" className="text-[10px] font-mono shrink-0 max-w-[140px] truncate">
                        {col.field}
                      </Badge>
                      <Input
                        value={col.header}
                        onChange={e => updateColumnHeader(i, e.target.value)}
                        placeholder="Nagłówek"
                        className="h-7 text-xs flex-1"
                      />
                      <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => removeColumn(i)}>
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
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
