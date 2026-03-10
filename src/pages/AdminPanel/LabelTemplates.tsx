import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Trash2, Plus, GripVertical, Copy } from "lucide-react";
import InlineEditCell from "./spec/InlineEditCell";
import { toast } from "sonner";
import DisplayFieldsSelector from "./labels/DisplayFieldsSelector";
import ComponentSelector from "./labels/ComponentSelector";

interface LabelTemplate {
  id: string;
  product_type: string;
  label_name: string;
  component: string;
  content_template: string;
  quantity: number;
  sort_order: number;
  is_conditional: boolean;
  condition_field: string | null;
  series_id: string | null;
  display_fields: string[];
}

interface Series {
  id: string;
  code: string;
  name: string;
}

const PRODUCT_TYPES = ["sofa", "pufa", "fotel"] as const;
const PRODUCT_TYPE_LABELS: Record<string, string> = {
  sofa: "SOFA",
  pufa: "PUFA",
  fotel: "FOTEL",
};

export default function LabelTemplates() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<string>("sofa");
  const [selectedSeries, setSelectedSeries] = useState<string>("all");

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ["label-templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("label_templates")
        .select("*")
        .order("product_type")
        .order("sort_order");
      if (error) throw error;
      return data as LabelTemplate[];
    },
  });

  const { data: seriesList = [] } = useQuery({
    queryKey: ["series-list"],
    queryFn: async () => {
      const { data, error } = await supabase.from("series").select("id, code, name").order("code");
      if (error) throw error;
      return data as Series[];
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, field, value }: { id: string; field: string; value: unknown }) => {
      const { error } = await supabase
        .from("label_templates")
        .update({ [field]: value })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["label-templates"] });
      toast.success("Zapisano");
    },
    onError: () => toast.error("Błąd zapisu"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("label_templates").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["label-templates"] });
      toast.success("Usunięto");
    },
    onError: () => toast.error("Błąd usuwania"),
  });

  const addMutation = useMutation({
    mutationFn: async (productType: string) => {
      const seriesId = selectedSeries === "all" ? null : selectedSeries;
      const filtered = templates.filter(
        (t) => t.product_type === productType && t.series_id === seriesId
      );
      const maxOrder = filtered.length > 0 ? Math.max(...filtered.map((t) => t.sort_order)) : 0;
      const { error } = await supabase.from("label_templates").insert({
        product_type: productType,
        label_name: "Nowa etykieta",
        component: "seat",
        content_template: "",
        quantity: 1,
        sort_order: maxOrder + 1,
        series_id: seriesId,
        display_fields: [],
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["label-templates"] });
      toast.success("Dodano etykietę");
    },
    onError: () => toast.error("Błąd dodawania"),
  });

  const copyForSeriesMutation = useMutation({
    mutationFn: async ({ productType, seriesId }: { productType: string; seriesId: string }) => {
      const globals = templates.filter(
        (t) => t.product_type === productType && t.series_id === null
      );
      const inserts = globals.map((t) => ({
        product_type: t.product_type,
        label_name: t.label_name,
        component: t.component,
        content_template: t.content_template,
        quantity: t.quantity,
        sort_order: t.sort_order,
        is_conditional: t.is_conditional,
        condition_field: t.condition_field,
        series_id: seriesId,
        display_fields: t.display_fields,
      }));
      if (inserts.length === 0) return;
      const { error } = await supabase.from("label_templates").insert(inserts);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["label-templates"] });
      toast.success("Skopiowano szablony dla serii");
    },
    onError: () => toast.error("Błąd kopiowania"),
  });

  const handleUpdate = (id: string, field: string) => async (value: string) => {
    const parsed = field === "quantity" || field === "sort_order" ? parseInt(value) || 0 : value;
    await updateMutation.mutateAsync({ id, field, value: parsed });
  };

  const handleFieldsChange = async (id: string, fields: string[]) => {
    await updateMutation.mutateAsync({ id, field: "display_fields", value: fields });
  };

  // Map leg components to their condition fields
  const LEG_CONDITION_MAP: Record<string, string> = {
    leg_chest: "legHeights.sofa_chest",
    leg_seat: "legHeights.sofa_seat",
    leg: "pufaLegs",
    legs: "legHeights.sofa_chest",
  };

  const isLegComponent = (component: string) => component in LEG_CONDITION_MAP;

  const handleComponentChange = async (id: string, component: string) => {
    await updateMutation.mutateAsync({ id, field: "component", value: component });
    // Clear display_fields when component changes
    await updateMutation.mutateAsync({ id, field: "display_fields", value: [] });
    // Auto-set conditional for leg components
    const isLeg = isLegComponent(component);
    await updateMutation.mutateAsync({ id, field: "is_conditional", value: isLeg });
    await updateMutation.mutateAsync({
      id,
      field: "condition_field",
      value: isLeg ? LEG_CONDITION_MAP[component] : null,
    });
  };

  const filteredTemplates = templates.filter((t) => {
    if (t.product_type !== activeTab) return false;
    if (selectedSeries === "all") return t.series_id === null;
    return t.series_id === selectedSeries;
  });

  const hasSeriesOverride = (productType: string, seriesId: string) =>
    templates.some((t) => t.product_type === productType && t.series_id === seriesId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">🏷️ Szablony etykiet</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Konfiguracja etykiet generowanych dla każdego typu produktu
        </p>
      </div>

      <div className="flex items-center gap-4">
        <div className="w-[220px]">
          <Select value={selectedSeries} onValueChange={setSelectedSeries}>
            <SelectTrigger>
              <SelectValue placeholder="Seria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">🌐 Globalne (domyślne)</SelectItem>
              {seriesList.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.code} — {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {selectedSeries !== "all" && !hasSeriesOverride(activeTab, selectedSeries) && (
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              copyForSeriesMutation.mutate({
                productType: activeTab,
                seriesId: selectedSeries,
              })
            }
          >
            <Copy className="h-4 w-4 mr-1" />
            Nadpisz dla tej serii
          </Button>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          {PRODUCT_TYPES.map((type) => (
            <TabsTrigger key={type} value={type}>
              {PRODUCT_TYPE_LABELS[type]}
              <Badge variant="secondary" className="ml-2 text-xs">
                {templates.filter(
                  (t) =>
                    t.product_type === type &&
                    (selectedSeries === "all" ? t.series_id === null : t.series_id === selectedSeries)
                ).length}
              </Badge>
            </TabsTrigger>
          ))}
        </TabsList>

        {PRODUCT_TYPES.map((type) => (
          <TabsContent key={type} value={type} className="mt-4">
            {isLoading ? (
              <p className="text-muted-foreground text-sm">Ładowanie...</p>
            ) : (
              <>
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[40px]">#</TableHead>
                        <TableHead className="w-[160px]">Nazwa etykiety</TableHead>
                        <TableHead className="w-[140px]">Komponent</TableHead>
                        <TableHead>Wyświetlane pola</TableHead>
                        <TableHead className="w-[80px]">Ilość</TableHead>
                        <TableHead className="w-[90px]">Kolejność</TableHead>
                        <TableHead className="w-[120px]">Status</TableHead>
                        <TableHead className="w-[60px]" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTemplates.map((tpl) => (
                        <TableRow key={tpl.id}>
                          <TableCell>
                            <GripVertical className="h-4 w-4 text-muted-foreground" />
                          </TableCell>
                          <TableCell>
                            <InlineEditCell
                              value={tpl.label_name}
                              onSave={handleUpdate(tpl.id, "label_name")}
                              placeholder="nazwa"
                            />
                          </TableCell>
                          <TableCell>
                            <ComponentSelector
                              value={tpl.component}
                              productType={tpl.product_type}
                              onChange={(v) => handleComponentChange(tpl.id, v)}
                            />
                          </TableCell>
                          <TableCell>
                            <DisplayFieldsSelector
                              component={tpl.component}
                              selectedFields={tpl.display_fields || []}
                              onChange={(fields) => handleFieldsChange(tpl.id, fields)}
                            />
                          </TableCell>
                          <TableCell>
                            <InlineEditCell
                              value={tpl.quantity}
                              onSave={handleUpdate(tpl.id, "quantity")}
                              type="number"
                              className="w-16"
                            />
                          </TableCell>
                          <TableCell>
                            <InlineEditCell
                              value={tpl.sort_order}
                              onSave={handleUpdate(tpl.id, "sort_order")}
                              type="number"
                              className="w-16"
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              <Checkbox
                                checked={tpl.is_conditional}
                                onCheckedChange={(checked) =>
                                  updateMutation.mutate({
                                    id: tpl.id,
                                    field: "is_conditional",
                                    value: !!checked,
                                  })
                                }
                              />
                              {tpl.is_conditional && (
                                <Input
                                  className="h-7 text-xs w-[140px]"
                                  placeholder="np. legHeights.sofa_seat"
                                  value={tpl.condition_field || ""}
                                  onChange={(e) =>
                                    updateMutation.mutate({
                                      id: tpl.id,
                                      field: "condition_field",
                                      value: e.target.value || null,
                                    })
                                  }
                                />
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteMutation.mutate(tpl.id)}
                              className="h-8 w-8 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {filteredTemplates.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                            {selectedSeries !== "all"
                              ? "Brak nadpisań dla tej serii — używane są szablony globalne"
                              : "Brak szablonów etykiet dla tego typu produktu"}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={() => addMutation.mutate(type)}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Dodaj etykietę
                </Button>
              </>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
