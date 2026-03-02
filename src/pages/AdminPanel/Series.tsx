import DataTable from "@/components/admin/DataTable";
import ComponentForm, { FieldDefinition } from "@/components/admin/ComponentForm";
import { useAdminCrud } from "@/hooks/useAdminCrud";

const columns = [
  { key: "code", label: "Kod" },
  { key: "name", label: "Nazwa" },
  { key: "collection", label: "Kolekcja" },
  { key: "seat_leg_default", label: "Wbudowane nóżki", render: (v: boolean) => v ? "Tak" : "Nie" },
  { key: "seat_leg_height_cm", label: "Wys. nóżek (cm)" },
  { key: "seat_leg_count", label: "Ilość nóżek" },
];

const fields: FieldDefinition[] = [
  { name: "code", label: "Kod", type: "text", required: true },
  { name: "name", label: "Nazwa", type: "text", required: true },
  { name: "collection", label: "Kolekcja", type: "text" },
  { name: "seat_leg_default", label: "Wbudowane nóżki pod siedziskiem", type: "boolean" },
  { name: "seat_leg_height_cm", label: "Wysokość nóżek pod siedziskiem (cm)", type: "number" },
  { name: "seat_leg_count", label: "Ilość nóżek pod siedziskiem", type: "number" },
];

export default function Series() {
  const crud = useAdminCrud({ table: "series", queryKey: "admin-series", labelSingular: "Seria" });

  return (
    <>
      <DataTable title="Serie" columns={columns} data={crud.data} onAdd={crud.handleAdd} onEdit={crud.handleEdit} onDelete={crud.handleDelete} onBulkDelete={crud.handleBulkDelete} onDuplicate={crud.handleDuplicate} isLoading={crud.isLoading} />
      <ComponentForm open={crud.formOpen} title={crud.editingItem ? "Edytuj serię" : "Dodaj serię"} fields={fields} initialData={crud.editingItem} onSubmit={crud.handleSubmit} onCancel={crud.handleCancel} isLoading={crud.submitting} />
    </>
  );
}
