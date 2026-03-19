import { useState, useMemo } from "react";
import GuidePdfPreview from "./guides/GuidePdfPreview";
import { useSkuPreviewDecoder } from "@/hooks/useSkuPreviewDecoder";
import { DEFAULT_EXAMPLE_SKUS, FALLBACK_EXAMPLE_SKU } from "./labels/defaultExampleSkus";
import GuideSettings from "./guides/GuideSettings";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Plus, Pencil, Trash2, ArrowUp, ArrowDown, ChevronDown, Copy, Loader2 } from "lucide-react";
import { GuideSection, GuideColumn, FIELD_GROUPS, AVAILABLE_FIELDS, CONDITION_FIELDS } from "./fieldResolver";

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
  const [selectedSeriesId, setSelectedSeriesId] = useState<string>("__global__");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<GuideSection | null>(null);
  const [form, setForm] = useState<Omit<GuideSection, "id">>(emptySection("sofa"));

  // Resolve series code from selectedSeriesId
  const selectedSeriesCode = useMemo(() => {
    if (selectedSeriesId === "__global__") return undefined;
    return seriesList.find(s => s.id === selectedSeriesId)?.code;
  }, [selectedSeriesId, seriesList]);

  const defaultSku = useMemo(() => {
    if (selectedSeriesCode) return DEFAULT_EXAMPLE_SKUS[selectedSeriesCode] || FALLBACK_EXAMPLE_SKU;
    return FALLBACK_EXAMPLE_SKU;
  }, [selectedSeriesCode]);

  const { decoded, isLoading: isDecoding, error: decodeError, skuInput, setSkuInput } = useSkuPreviewDecoder(defaultSku);
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
      const { data, error } = await supabase.from("products").select("id, code, name").eq("category", "series").eq("active", true).order("code");
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

  const copyForSeriesMutation = useMutation({
    mutationFn: async ({ productType, seriesId }: { productType: string; seriesId: string }) => {
      const globals = sections.filter(
        (s) => s.product_type === productType && s.series_id === null
      );
      const inserts = globals.map((s) => ({
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

  const filtered = sections.filter(s =>
    s.product_type === activeTab &&
    (selectedSeriesId === "__global__" ? s.series_id === null : s.series_id === selectedSeriesId)
  );

  const canCopy = selectedSeriesId !== "__global__" && filtered.length === 0;

  const openAdd = () => {
    const maxOrder = filtered.length > 0 ? Math.max(...filtered.map(s => s.sort_order)) : 0;
    setEditingSection(null);
    setForm({
      ...emptySection(activeTab),
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
      const defaultHeader = fieldDef ? fieldDef.label : fieldValue;
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

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">📄 Szablony przewodników PDF</h1>
      <p className="text-muted-foreground text-sm">
        Konfiguracja sekcji (tabel) wyświetlanych w przewodnikach produkcyjnych PDF.
        Sekcje globalne (bez serii) obowiązują dla wszystkich. Można nadpisać per seria.
      </p>

      <GuideSettings />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="sofa">SOFA</TabsTrigger>
          <TabsTrigger value="pufa">PUFA</TabsTrigger>
          <TabsTrigger value="fotel">FOTEL</TabsTrigger>
        </TabsList>

        {["sofa", "pufa", "fotel"].map(type => (
          <TabsContent key={type} value={type} className="space-y-4">
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
                    onClick={() => copyForSeriesMutation.mutate({ productType: activeTab, seriesId: selectedSeriesId })}
                    disabled={copyForSeriesMutation.isPending}
                  >
                    <Copy className="mr-1 h-4 w-4" /> Nadpisz dla tej serii
                  </Button>
                )}
              </div>
              <Button onClick={openAdd} size="sm"><Plus className="mr-1 h-4 w-4" /> Dodaj sekcję</Button>
            </div>

            {isLoading ? (
              <p className="text-muted-foreground">Ładowanie...</p>
            ) : filtered.length === 0 ? (
              <p className="text-muted-foreground">
                {selectedSeriesId !== "__global__"
                  ? 'Brak nadpisań — używane są sekcje globalne. Kliknij "Nadpisz dla tej serii" aby skopiować globalne sekcje.'
                  : "Brak sekcji dla tego typu."}
              </p>
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
          </TabsContent>
        ))}
      </Tabs>

      <Card className="mt-4">
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            📄 Podgląd przewodnika ({activeTab.toUpperCase()})
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-3">
          <div className="flex gap-2 items-center">
            <Label className="text-xs whitespace-nowrap">SKU:</Label>
            <Input
              value={skuInput}
              onChange={(e) => setSkuInput(e.target.value)}
              className="h-8 text-xs font-mono"
              placeholder="Wpisz SKU do podglądu..."
            />
            {isDecoding && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          </div>
          {decodeError && (
            <p className="text-xs text-destructive">{decodeError}</p>
          )}
          <GuidePdfPreview
            decoded={decoded}
            productType={activeTab as "sofa" | "pufa" | "fotel"}
            width={550}
          />
        </CardContent>
      </Card>

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
                    <span className="flex flex-wrap gap-1">
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
