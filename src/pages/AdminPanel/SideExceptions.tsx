import { useOutletContext } from "react-router-dom";
import DataTable, { Column } from "@/components/admin/DataTable";
import ComponentForm, { FieldDefinition } from "@/components/admin/ComponentForm";
import { useAdminCrud } from "@/hooks/useAdminCrud";
import { Badge } from "@/components/ui/badge";

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
  const { selectedSeriesId } = useOutletContext<{ selectedSeriesId: string }>();

  const crud = useAdminCrud({
    table: "side_exceptions",
    queryKey: "admin-side-exceptions",
    labelSingular: "Wyjątek boczka",
    filterColumn: "series_id",
    filterValue: selectedSeriesId,
    orderBy: "original_code",
  });

  const handleSubmit = async (formData: any) => {
    await crud.handleSubmit({ ...formData, series_id: selectedSeriesId });
  };

  if (!selectedSeriesId) {
    return <p className="text-muted-foreground py-8 text-center">Wybierz serię w sidebarze, aby zobaczyć wyjątki.</p>;
  }

  return (
    <>
      <DataTable title="Wyjątki boczków (Shopify legacy)" columns={columns} data={crud.data} onAdd={crud.handleAdd} onEdit={crud.handleEdit} onDelete={crud.handleDelete} onBulkDelete={crud.handleBulkDelete} onDuplicate={crud.handleDuplicate} isLoading={crud.isLoading} />
      <ComponentForm open={crud.formOpen} title={crud.editingItem ? "Edytuj wyjątek" : "Dodaj wyjątek"} fields={fields} initialData={crud.editingItem} onSubmit={handleSubmit} onCancel={crud.handleCancel} isLoading={crud.submitting} />
    </>
  );
}
