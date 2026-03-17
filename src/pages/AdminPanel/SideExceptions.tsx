import { useState, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getUserFriendlyError } from "@/utils/errorHandler";
import DataTable, { Column } from "@/components/admin/DataTable";
import ComponentForm, { FieldDefinition } from "@/components/admin/ComponentForm";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface FlatException {
  id: string;
  original_code: string;
  mapped_code: string;
  component_type: string;
  is_global: boolean;
  description: string;
  active: boolean;
  series_id: string;
  series_label: string;
}

const COMPONENT_TYPES = [
  { value: "side", label: "Boczek" },
  { value: "chest", label: "Skrzynia" },
  { value: "fabric", label: "Tkanina" },
  { value: "seat", label: "Siedzisko" },
  { value: "backrest", label: "Oparcie" },
  { value: "leg", label: "Nóżka" },
  { value: "automat", label: "Automat" },
];

const columns: Column[] = [
  { key: "original_code", label: "Kod oryginalny" },
  { key: "mapped_code", label: "Kod zamapowany" },
  {
    key: "component_type",
    label: "Komponent",
    render: (val: string) => {
      const found = COMPONENT_TYPES.find((c) => c.value === val);
      return <Badge variant="outline">{found?.label ?? val}</Badge>;
    },
  },
  {
    key: "series_label",
    label: "Seria",
    render: (val: string, item: any) =>
      item.is_global ? <Badge variant="default">Globalny</Badge> : <span>{val}</span>,
  },
  { key: "description", label: "Opis" },
  {
    key: "active",
    label: "Aktywny",
    render: (val: boolean) => (
      <Badge variant={val ? "default" : "outline"}>{val ? "Tak" : "Nie"}</Badge>
    ),
  },
];

const fields: FieldDefinition[] = [
  { name: "original_code", label: "Kod oryginalny (Shopify)", type: "text", required: true },
  { name: "mapped_code", label: "Kod zamapowany (poprawny)", type: "text", required: true },
  {
    name: "component_type",
    label: "Komponent",
    type: "select",
    options: COMPONENT_TYPES.map((c) => ({ value: c.value, label: c.label })),
    required: true,
  },
  { name: "is_global", label: "Globalny (dotyczy wszystkich serii)", type: "boolean" },
  { name: "description", label: "Opis", type: "textarea" },
  { name: "active", label: "Aktywny", type: "boolean" },
];

export default function SideExceptions() {
  const queryClient = useQueryClient();

  const { data: seriesList = [] } = useQuery({
    queryKey: ["admin-series-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, code, name")
        .eq("category", "series")
        .eq("active", true)
        .order("code");
      if (error) throw error;
      return data as { id: string; code: string; name: string }[];
    },
  });

  const seriesMap = Object.fromEntries(seriesList.map((s) => [s.id, s]));

  const queryKey = ["admin-sku-aliases-all"];

  const { data: allData = [], isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_relations")
        .select("id, series_id, properties, active")
        .eq("relation_type", "sku_alias")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []).map((row: any): FlatException => {
        const props = (row.properties as Record<string, any>) ?? {};
        const series = seriesMap[row.series_id];
        return {
          id: row.id,
          original_code: props.original_code ?? "",
          mapped_code: props.mapped_code ?? "",
          component_type: props.component_type ?? "side",
          is_global: props.is_global ?? false,
          description: props.description ?? "",
          active: row.active ?? true,
          series_id: row.series_id,
          series_label: series ? `${series.code} — ${series.name}` : row.series_id,
        };
      });
    },
    enabled: seriesList.length > 0,
  });

  const [filter, setFilter] = useState("all");

  const filtered = filter === "all"
    ? allData
    : filter === "global"
      ? allData.filter((r) => r.is_global)
      : allData.filter((r) => r.series_id === filter);

  const [editingItem, setEditingItem] = useState<FlatException | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleAdd = () => { setEditingItem(null); setFormOpen(true); };
  const handleEdit = (item: any) => { setEditingItem(item); setFormOpen(true); };
  const handleCancel = () => { setFormOpen(false); setEditingItem(null); };

  // Default series for insert — first series
  const defaultSeriesId = seriesList.length > 0 ? seriesList[0].id : "";

  const handleSubmit = useCallback(async (formData: any) => {
    setSubmitting(true);
    try {
      const properties = {
        original_code: (formData.original_code || "").toUpperCase(),
        mapped_code: (formData.mapped_code || "").toUpperCase(),
        component_type: formData.component_type || "side",
        is_global: formData.is_global ?? false,
        description: formData.description || "",
      };
      const active = formData.active ?? true;

      if (editingItem) {
        const { error } = await supabase
          .from("product_relations")
          .update({ properties, active })
          .eq("id", editingItem.id);
        if (error) throw error;
        toast.success("✅ Alias zaktualizowany");
      } else {
        const seriesId = filter !== "all" && filter !== "global" ? filter : defaultSeriesId;
        const { error } = await supabase
          .from("product_relations")
          .insert([{
            series_id: seriesId,
            relation_type: "sku_alias",
            properties,
            active,
          }]);
        if (error) throw error;
        toast.success("✅ Alias dodany");
      }
      queryClient.invalidateQueries({ queryKey });
      setFormOpen(false);
      setEditingItem(null);
    } catch (err: any) {
      toast.error(`❌ ${getUserFriendlyError(err)}`);
    } finally {
      setSubmitting(false);
    }
  }, [editingItem, filter, defaultSeriesId, queryClient, queryKey]);

  const handleDelete = useCallback(async (id: string) => {
    try {
      const { error } = await supabase.from("product_relations").delete().eq("id", id);
      if (error) throw error;
      toast.success("✅ Alias usunięty");
      queryClient.invalidateQueries({ queryKey });
    } catch (err: any) {
      toast.error(`❌ ${getUserFriendlyError(err)}`);
    }
  }, [queryClient, queryKey]);

  const handleBulkDelete = useCallback(async (ids: string[]) => {
    try {
      const { error } = await supabase.from("product_relations").delete().in("id", ids);
      if (error) throw error;
      toast.success(`✅ Usunięto ${ids.length} rekordów`);
      queryClient.invalidateQueries({ queryKey });
    } catch (err: any) {
      toast.error(`❌ ${getUserFriendlyError(err)}`);
    }
  }, [queryClient, queryKey]);

  const handleDuplicate = useCallback(async (item: any) => {
    try {
      const { error } = await supabase
        .from("product_relations")
        .insert([{
          series_id: item.series_id,
          relation_type: "sku_alias",
          properties: {
            original_code: item.original_code + " (kopia)",
            mapped_code: item.mapped_code,
            component_type: item.component_type || "side",
            is_global: item.is_global ?? false,
            description: item.description,
          },
          active: item.active,
        }]);
      if (error) throw error;
      toast.success("✅ Rekord zduplikowany");
      queryClient.invalidateQueries({ queryKey });
    } catch (err: any) {
      toast.error(`❌ ${getUserFriendlyError(err)}`);
    }
  }, [queryClient, queryKey]);

  return (
    <div className="space-y-4">
      <Tabs value={filter} onValueChange={setFilter}>
        <TabsList>
          <TabsTrigger value="all">Wszystkie</TabsTrigger>
          {seriesList.map((s) => (
            <TabsTrigger key={s.id} value={s.id}>{s.code}</TabsTrigger>
          ))}
          <TabsTrigger value="global">Globalne</TabsTrigger>
        </TabsList>
      </Tabs>

      <DataTable
        title="Wyjątki SKU (aliasy Shopify)"
        columns={columns}
        data={filtered}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onBulkDelete={handleBulkDelete}
        onDuplicate={handleDuplicate}
        isLoading={isLoading}
      />
      <ComponentForm
        open={formOpen}
        title={editingItem ? "Edytuj alias SKU" : "Dodaj alias SKU"}
        fields={fields}
        initialData={editingItem}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isLoading={submitting}
      />
    </div>
  );
}
