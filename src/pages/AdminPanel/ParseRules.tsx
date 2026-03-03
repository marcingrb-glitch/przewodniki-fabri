import { useOutletContext } from "react-router-dom";
import DataTable, { Column } from "@/components/admin/DataTable";
import ComponentForm, { FieldDefinition } from "@/components/admin/ComponentForm";
import { useAdminCrud } from "@/hooks/useAdminCrud";
import { Badge } from "@/components/ui/badge";

const columns: Column[] = [
  { key: "component_type", label: "Komponent" },
  {
    key: "zero_padded",
    label: "Zero-padded",
    render: (val: boolean) => (
      <Badge variant={val ? "default" : "secondary"}>{val ? "Tak" : "Nie"}</Badge>
    ),
  },
  { key: "code_format", label: "Format" },
  { key: "notes", label: "Notatki" },
];

const fields: FieldDefinition[] = [
  { name: "component_type", label: "Typ komponentu", type: "text", required: true },
  { name: "zero_padded", label: "Zero-padded (wiodące zero)", type: "boolean" },
  { name: "code_format", label: "Format kodu", type: "text" },
  { name: "notes", label: "Notatki", type: "textarea" },
];

export default function ParseRules() {
  const { selectedSeriesId } = useOutletContext<{ selectedSeriesId: string }>();

  const crud = useAdminCrud({
    table: "sku_parse_rules",
    queryKey: "admin-sku-parse-rules",
    labelSingular: "Reguła parsowania",
    filterColumn: "series_id",
    filterValue: selectedSeriesId,
    orderBy: "component_type",
  });

  const handleSubmit = async (formData: any) => {
    await crud.handleSubmit({ ...formData, series_id: selectedSeriesId });
  };

  if (!selectedSeriesId) {
    return <p className="text-muted-foreground py-8 text-center">Wybierz serię w sidebarze, aby zobaczyć reguły.</p>;
  }

  return (
    <>
      <DataTable title="Reguły parsowania SKU" columns={columns} data={crud.data} onAdd={crud.handleAdd} onEdit={crud.handleEdit} onDelete={crud.handleDelete} onBulkDelete={crud.handleBulkDelete} onDuplicate={crud.handleDuplicate} isLoading={crud.isLoading} />
      <ComponentForm open={crud.formOpen} title={crud.editingItem ? "Edytuj regułę" : "Dodaj regułę"} fields={fields} initialData={crud.editingItem} onSubmit={handleSubmit} onCancel={crud.handleCancel} isLoading={crud.submitting} />
    </>
  );
}
