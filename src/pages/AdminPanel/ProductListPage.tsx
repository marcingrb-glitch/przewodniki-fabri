import { useOutletContext } from "react-router-dom";
import DataTable from "@/components/admin/DataTable";
import ComponentForm from "@/components/admin/ComponentForm";
import { useProductsCrud } from "@/hooks/useProductsCrud";
import { PRODUCT_CONFIGS } from "./productConfigs";
import LegCompletionTable from "./LegCompletionTable";

interface ProductListPageProps {
  category: string;
}

export default function ProductListPage({ category }: ProductListPageProps) {
  const config = PRODUCT_CONFIGS[category];
  if (!config) return <p className="text-destructive">Nieznana kategoria: {category}</p>;

  const { selectedSeriesId } = useOutletContext<{ selectedSeriesId: string }>();

  const crud = useProductsCrud({
    config,
    seriesProductId: config.isGlobal ? undefined : selectedSeriesId,
  });

  if (!config.isGlobal && !selectedSeriesId) {
    return <p className="text-muted-foreground">Wybierz serię w panelu bocznym.</p>;
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
      {category === "leg" && (
        <div className="mt-6">
          <LegCompletionTable />
        </div>
      )}
    </>
  );
}
