import { useOutletContext } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import DataTable from "@/components/admin/DataTable";
import ComponentForm from "@/components/admin/ComponentForm";
import { useProductsCrud } from "@/hooks/useProductsCrud";
import { PRODUCT_CONFIGS } from "./productConfigs";

interface ProductListPageProps {
  category: string;
}

/**
 * Map old series.id → new products.id (category='series') via code lookup.
 * Needed until AdminLayout switches to products-based series selection.
 */
function useSeriesProductId(oldSeriesId: string | undefined) {
  return useQuery({
    queryKey: ["series-product-lookup", oldSeriesId],
    queryFn: async () => {
      if (!oldSeriesId) return null;
      // Get old series code
      const { data: oldSeries } = await supabase
        .from("series")
        .select("code")
        .eq("id", oldSeriesId)
        .single();
      if (!oldSeries) return null;
      // Find matching product with category='series'
      const { data: seriesProduct } = await supabase
        .from("products")
        .select("id")
        .eq("category", "series")
        .eq("code", oldSeries.code)
        .single();
      return seriesProduct?.id ?? null;
    },
    enabled: !!oldSeriesId,
  });
}

export default function ProductListPage({ category }: ProductListPageProps) {
  const config = PRODUCT_CONFIGS[category];
  if (!config) return <p className="text-destructive">Nieznana kategoria: {category}</p>;

  const { selectedSeriesId } = useOutletContext<{ selectedSeriesId: string }>();

  // For per-series categories, map old series ID to new products.id
  const { data: seriesProductId, isLoading: lookupLoading } = useSeriesProductId(
    config.isGlobal ? undefined : selectedSeriesId
  );

  const crud = useProductsCrud({
    config,
    seriesProductId: config.isGlobal ? undefined : (seriesProductId ?? undefined),
  });

  if (!config.isGlobal && !selectedSeriesId) {
    return <p className="text-muted-foreground">Wybierz serię w panelu bocznym.</p>;
  }

  if (!config.isGlobal && lookupLoading) {
    return <p className="text-muted-foreground">Ładowanie...</p>;
  }

  // Build table columns with render functions
  const tableColumns = config.columns.map((col) => ({
    key: col.key,
    label: col.label,
    ...(col.render ? { render: col.render } : {}),
  }));

  return (
    <>
      <DataTable
        title={config.title}
        columns={tableColumns}
        data={crud.data}
        onAdd={crud.handleAdd}
        onEdit={crud.handleEdit}
        onDelete={crud.handleDelete}
        onBulkDelete={crud.handleBulkDelete}
        onDuplicate={crud.handleDuplicate}
        isLoading={crud.isLoading}
      />
      <ComponentForm
        open={crud.formOpen}
        title={crud.editingItem ? `Edytuj ${config.labelSingular.toLowerCase()}` : `Dodaj ${config.labelSingular.toLowerCase()}`}
        fields={config.fields}
        initialData={crud.editingItem}
        onSubmit={crud.handleSubmit}
        onCancel={crud.handleCancel}
        isLoading={crud.submitting}
      />
    </>
  );
}
