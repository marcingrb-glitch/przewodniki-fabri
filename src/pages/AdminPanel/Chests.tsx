import DataTable from "@/components/admin/DataTable";
import ComponentForm, { FieldDefinition } from "@/components/admin/ComponentForm";
import { useAdminCrud } from "@/hooks/useAdminCrud";

const columns = [
  { key: "code", label: "Kod" },
  { key: "name", label: "Nazwa" },
  { key: "leg_height_cm", label: "Wysokość nóżek (cm)" },
];

const fields: FieldDefinition[] = [
  { name: "code", label: "Kod", type: "text", required: true },
  { name: "name", label: "Nazwa", type: "text", required: true },
  { name: "leg_height_cm", label: "Wysokość nóżek (cm)", type: "number", required: true },
];

export default function Chests() {
  const crud = useAdminCrud({ table: "chests", queryKey: "admin-chests", labelSingular: "Skrzynia" });

  return (
    <>
      <DataTable title="Skrzynie" columns={columns} data={crud.data} onAdd={crud.handleAdd} onEdit={crud.handleEdit} onDelete={crud.handleDelete} isLoading={crud.isLoading} />
      <ComponentForm open={crud.formOpen} title={crud.editingItem ? "Edytuj skrzynię" : "Dodaj skrzynię"} fields={fields} initialData={crud.editingItem} onSubmit={crud.handleSubmit} onCancel={crud.handleCancel} isLoading={crud.submitting} />
    </>
  );
}
