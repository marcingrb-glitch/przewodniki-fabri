import { useState, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getUserFriendlyError } from "@/utils/errorHandler";
import type { ProductCategoryConfig } from "@/pages/AdminPanel/productConfigs";

/** Flatten properties JSONB keys to top-level */
function flattenProduct(product: any, propertyKeys: string[]): any {
  const flat = { ...product };
  for (const key of propertyKeys) {
    flat[key] = product.properties?.[key] ?? null;
  }
  return flat;
}

/** Pack top-level form keys back into properties JSONB */
function packProduct(formData: any, propertyKeys: string[]): any {
  const properties: Record<string, any> = {};
  const rest: Record<string, any> = {};
  for (const [k, v] of Object.entries(formData)) {
    if (propertyKeys.includes(k)) {
      properties[k] = v;
    } else {
      rest[k] = v;
    }
  }
  return { ...rest, properties };
}

interface UseProductsCrudOptions {
  config: ProductCategoryConfig;
  seriesProductId?: string; // new products.id for the series (for per-series categories)
}

export function useProductsCrud({ config, seriesProductId }: UseProductsCrudOptions) {
  const queryClient = useQueryClient();
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const queryKey = ["products", config.category, seriesProductId ?? "global"];

  const { data = [], isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      let q = supabase
        .from("products")
        .select("*")
        .eq("category", config.category)
        .eq("active", true)
        .order(config.orderBy ?? "code", { ascending: true });

      if (config.isGlobal) {
        q = q.eq("is_global", true);
      } else if (seriesProductId) {
        q = q.eq("series_id", seriesProductId);
      }

      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []).map((p: any) => flattenProduct(p, config.propertyKeys));
    },
    enabled: config.isGlobal ? true : !!seriesProductId,
  });

  const handleAdd = () => { setEditingItem(null); setFormOpen(true); };
  const handleEdit = (item: any) => { setEditingItem(item); setFormOpen(true); };
  const handleCancel = () => { setFormOpen(false); setEditingItem(null); };

  const handleSubmit = useCallback(async (formData: any) => {
    setSubmitting(true);
    try {
      const packed = packProduct(formData, config.propertyKeys);
      packed.category = config.category;
      packed.is_global = config.isGlobal;
      if (!config.isGlobal && seriesProductId) {
        packed.series_id = seriesProductId;
      }

      if (editingItem) {
        const { error } = await supabase.from("products").update(packed).eq("id", editingItem.id);
        if (error) throw error;
        toast.success(`✅ ${config.labelSingular} zaktualizowany`);
      } else {
        const { error } = await supabase.from("products").insert([packed]);
        if (error) throw error;
        toast.success(`✅ ${config.labelSingular} dodany`);
      }
      queryClient.invalidateQueries({ queryKey });
      setFormOpen(false);
      setEditingItem(null);
    } catch (err: any) {
      toast.error(`❌ ${getUserFriendlyError(err)}`);
    } finally {
      setSubmitting(false);
    }
  }, [editingItem, config, seriesProductId, queryClient, queryKey]);

  const handleDelete = useCallback(async (id: string) => {
    try {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
      toast.success(`✅ ${config.labelSingular} usunięty`);
      queryClient.invalidateQueries({ queryKey });
    } catch (err: any) {
      toast.error(`❌ ${getUserFriendlyError(err)}`);
    }
  }, [config, queryClient, queryKey]);

  const handleBulkDelete = useCallback(async (ids: string[]) => {
    try {
      const { error } = await supabase.from("products").delete().in("id", ids);
      if (error) throw error;
      toast.success(`✅ Usunięto ${ids.length} rekordów`);
      queryClient.invalidateQueries({ queryKey });
    } catch (err: any) {
      toast.error(`❌ ${getUserFriendlyError(err)}`);
    }
  }, [queryClient, queryKey]);

  const handleDuplicate = useCallback(async (item: any) => {
    try {
      const packed = packProduct(item, config.propertyKeys);
      const { id, created_at, updated_at, ...rest } = packed;
      if (rest.code) rest.code = rest.code + " (kopia)";
      rest.category = config.category;
      rest.is_global = config.isGlobal;
      if (!config.isGlobal && seriesProductId) {
        rest.series_id = seriesProductId;
      }
      const { error } = await supabase.from("products").insert([rest]);
      if (error) throw error;
      toast.success("✅ Rekord został zduplikowany");
      queryClient.invalidateQueries({ queryKey });
    } catch (err: any) {
      toast.error(`❌ ${getUserFriendlyError(err)}`);
    }
  }, [config, seriesProductId, queryClient, queryKey]);

  return {
    data,
    isLoading,
    editingItem,
    formOpen,
    submitting,
    handleAdd,
    handleEdit,
    handleCancel,
    handleSubmit,
    handleDelete,
    handleBulkDelete,
    handleDuplicate,
  };
}
