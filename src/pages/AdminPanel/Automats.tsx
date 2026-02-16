import DataTable from "@/components/admin/DataTable";
import ComponentForm, { FieldDefinition } from "@/components/admin/ComponentForm";
import { useAdminCrud } from "@/hooks/useAdminCrud";

const columns = [
  { key: "code", label: "Kod" },
  { key: "name", label: "Nazwa" },
  { key: "type", label: "Typ" },
  { key: "has_seat_legs", label: "Nóżki pod siedziskiem", render: (v: boolean) => v ? "Tak" : "Nie" },
];

const fields: FieldDefinition[] = [
  { name: "code", label: "Kod", type: "text", required: true },
  { name: "name", label: "Nazwa", type: "text", required: true },
  { name: "type", label: "Typ", type: "text" },
  { name: "has_seat_legs", label: "Nóżki pod siedziskiem", type: "boolean" },
];

export default function Automats() {
  const crud = useAdminCrud({ table: "automats", queryKey: "admin-automats", labelSingular: "Automat" });

  return (
    <>
      <DataTable title="Automaty" columns={columns} data={crud.data} onAdd={crud.handleAdd} onEdit={crud.handleEdit} onDelete={crud.handleDelete} onBulkDelete={crud.handleBulkDelete} onDuplicate={crud.handleDuplicate} isLoading={crud.isLoading} />
      <ComponentForm open={crud.formOpen} title={crud.editingItem ? "Edytuj automat" : "Dodaj automat"} fields={fields} initialData={crud.editingItem} onSubmit={crud.handleSubmit} onCancel={crud.handleCancel} isLoading={crud.submitting} />
    </>
  );
}
