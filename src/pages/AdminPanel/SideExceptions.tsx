import { useState, useEffect, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getUserFriendlyError } from "@/utils/errorHandler";
import DataTable, { Column } from "@/components/admin/DataTable";
import ComponentForm, { FieldDefinition } from "@/components/admin/ComponentForm";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Transform product_relations row into flat object for DataTable
interface FlatException {
  id: string;
  original_code: string;
  mapped_code: string;
  description: string;
  active: boolean;
}

function flattenRow(row: any): FlatException {
  const props = row.properties as Record<string, any> ?? {};
  return {
    id: row.id,
    original_code: props.original_code ?? "",
    mapped_code: props.mapped_code ?? "",
    description: props.description ?? "",
    active: row.active ?? true,
  };
}

const columns: Column[] = [
  { key: "original_code", label: "Kod oryginalny" },
  { key: "mapped_code", label: "Kod zamapowany" },
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
  { name: "description", label: "Opis", type: "textarea" },
  { name: "active", label: "Aktywny", type: "boolean" },
];

export default function SideExceptions() {
  const queryClient = useQueryClient();

  // Series list for dropdown
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

  const [selectedSeriesId, setSelectedSeriesId] = useState<string>(() =>
    localStorage.getItem("admin_series_id") || ""
  );

  useEffect(() => {
    if (!selectedSeriesId && seriesList.length > 0) {
      setSelectedSeriesId(seriesList[0].id);
    }
  }, [seriesList, selectedSeriesId]);

  const queryKey = ["admin-side-exceptions", selectedSeriesId];

  const { data = [], isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_relations")
        .select("id, properties, active")
        .eq("series_id", selectedSeriesId)
        .eq("relation_type", "side_exception")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []).map(flattenRow);
    },
    enabled: !!selectedSeriesId,
  });

  const [editingItem, setEditingItem] = useState<FlatException | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleAdd = () => { setEditingItem(null); setFormOpen(true); };
  const handleEdit = (item: any) => { setEditingItem(item); setFormOpen(true); };
  const handleCancel = () => { setFormOpen(false); setEditingItem(null); };

  const handleSubmit = useCallback(async (formData: any) => {
    setSubmitting(true);
    try {
      const properties = {
        original_code: (formData.original_code || "").toUpperCase(),
        mapped_code: (formData.mapped_code || "").toUpperCase(),
        description: formData.description || "",
      };
      const active = formData.active ?? true;

      if (editingItem) {
        const { error } = await supabase
          .from("product_relations")
          .update({ properties, active })
          .eq("id", editingItem.id);
        if (error) throw error;
        toast.success("✅ Wyjątek zaktualizowany");
      } else {
        const { error } = await supabase
          .from("product_relations")
          .insert([{
            series_id: selectedSeriesId,
            relation_type: "side_exception",
            properties,
            active,
          }]);
        if (error) throw error;
        toast.success("✅ Wyjątek dodany");
      }
      queryClient.invalidateQueries({ queryKey });
      setFormOpen(false);
      setEditingItem(null);
    } catch (err: any) {
      toast.error(`❌ ${getUserFriendlyError(err)}`);
    } finally {
      setSubmitting(false);
    }
  }, [editingItem, selectedSeriesId, queryClient, queryKey]);

  const handleDelete = useCallback(async (id: string) => {
    try {
      const { error } = await supabase.from("product_relations").delete().eq("id", id);
      if (error) throw error;
      toast.success("✅ Wyjątek usunięty");
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
          series_id: selectedSeriesId,
          relation_type: "side_exception",
          properties: {
            original_code: item.original_code + " (kopia)",
            mapped_code: item.mapped_code,
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
  }, [selectedSeriesId, queryClient, queryKey]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium whitespace-nowrap">Seria:</label>
        <Select value={selectedSeriesId} onValueChange={setSelectedSeriesId}>
          <SelectTrigger className="w-[240px]">
            <SelectValue placeholder="Wybierz serię" />
          </SelectTrigger>
          <SelectContent>
            {seriesList.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.code} — {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {!selectedSeriesId ? (
        <p className="text-muted-foreground py-8 text-center">Wybierz serię, aby zobaczyć wyjątki.</p>
      ) : (
        <>
          <DataTable
            title="Wyjątki boczków (Shopify legacy)"
            columns={columns}
            data={data}
            onAdd={handleAdd}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onBulkDelete={handleBulkDelete}
            onDuplicate={handleDuplicate}
            isLoading={isLoading}
          />
          <ComponentForm
            open={formOpen}
            title={editingItem ? "Edytuj wyjątek" : "Dodaj wyjątek"}
            fields={fields}
            initialData={editingItem}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isLoading={submitting}
          />
        </>
      )}
    </div>
  );
}
