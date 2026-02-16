import { useState, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getUserFriendlyError } from "@/utils/errorHandler";

interface UseAdminCrudOptions {
  table: string;
  queryKey: string;
  labelSingular: string;
  filterColumn?: string;
  filterValue?: string;
}

export function useAdminCrud({ table, queryKey, labelSingular, filterColumn, filterValue }: UseAdminCrudOptions) {
  const queryClient = useQueryClient();
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formOpen, setFormOpen] = useState(false);

  const fullKey = filterColumn && filterValue ? [queryKey, filterValue] : [queryKey];

  const { data = [], isLoading } = useQuery({
    queryKey: fullKey,
    queryFn: async () => {
      let q = supabase.from(table as any).select("*").order("code", { ascending: true });
      if (filterColumn && filterValue) {
        q = q.eq(filterColumn, filterValue);
      }
      const { data, error } = await q;
      if (error) throw error;
      return data as any[];
    },
    enabled: filterColumn ? !!filterValue : true,
  });

  const [submitting, setSubmitting] = useState(false);

  const handleAdd = () => { setEditingItem(null); setFormOpen(true); };
  const handleEdit = (item: any) => { setEditingItem(item); setFormOpen(true); };
  const handleCancel = () => { setFormOpen(false); setEditingItem(null); };

  const handleSubmit = useCallback(async (formData: any) => {
    setSubmitting(true);
    try {
      if (editingItem) {
        const { error } = await supabase.from(table as any).update(formData).eq("id", editingItem.id);
        if (error) throw error;
        toast.success(`✅ ${labelSingular} zaktualizowany`);
      } else {
        const { error } = await supabase.from(table as any).insert([formData]);
        if (error) throw error;
        toast.success(`✅ ${labelSingular} dodany`);
      }
      queryClient.invalidateQueries({ queryKey: fullKey });
      setFormOpen(false);
      setEditingItem(null);
    } catch (err: any) {
      toast.error(`❌ ${getUserFriendlyError(err)}`);
    } finally {
      setSubmitting(false);
    }
  }, [editingItem, table, labelSingular, queryClient, fullKey]);

  const handleDelete = useCallback(async (id: string) => {
    try {
      const { error } = await supabase.from(table as any).delete().eq("id", id);
      if (error) throw error;
      toast.success(`✅ ${labelSingular} usunięty`);
      queryClient.invalidateQueries({ queryKey: fullKey });
    } catch (err: any) {
      toast.error(`❌ ${getUserFriendlyError(err)}`);
    }
  }, [table, labelSingular, queryClient, fullKey]);

  const handleBulkDelete = useCallback(async (ids: string[]) => {
    try {
      const { error } = await supabase.from(table as any).delete().in("id", ids);
      if (error) throw error;
      toast.success(`✅ Usunięto ${ids.length} rekordów`);
      queryClient.invalidateQueries({ queryKey: fullKey });
    } catch (err: any) {
      toast.error(`❌ ${getUserFriendlyError(err)}`);
    }
  }, [table, queryClient, fullKey]);

  const handleDuplicate = useCallback(async (item: any) => {
    try {
      const { id, created_at, ...rest } = item;
      if (rest.code) {
        rest.code = rest.code + " (kopia)";
      }
      const { error } = await supabase.from(table as any).insert([rest]);
      if (error) throw error;
      toast.success("✅ Rekord został zduplikowany");
      queryClient.invalidateQueries({ queryKey: fullKey });
    } catch (err: any) {
      toast.error(`❌ ${getUserFriendlyError(err)}`);
    }
  }, [table, queryClient, fullKey]);

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
