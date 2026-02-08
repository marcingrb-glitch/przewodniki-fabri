import DataTable from "@/components/admin/DataTable";
import ComponentForm, { FieldDefinition } from "@/components/admin/ComponentForm";
import { useAdminCrud } from "@/hooks/useAdminCrud";

const columns = [
  { key: "code", label: "Kod" },
  { key: "name", label: "Nazwa" },
  { key: "allowed_finishes", label: "Możliwe wykończenia", render: (v: string[]) => Array.isArray(v) ? v.join(", ") : "-" },
];

const fields: FieldDefinition[] = [
  { name: "code", label: "Kod", type: "text", required: true },
  { name: "name", label: "Nazwa", type: "text", required: true },
  { name: "allowed_finishes", label: "Możliwe wykończenia", type: "multi-select", required: true, options: [
    { value: "A", label: "A (Stebnówka)" },
    { value: "B", label: "B (Szczypanka)" },
    { value: "C", label: "C (Dwuigłówka)" },
  ]},
];

export default function Pillows() {
  const crud = useAdminCrud({ table: "pillows", queryKey: "admin-pillows", labelSingular: "Poduszka" });

  return (
    <>
      <DataTable title="Poduszki" columns={columns} data={crud.data} onAdd={crud.handleAdd} onEdit={crud.handleEdit} onDelete={crud.handleDelete} isLoading={crud.isLoading} />
      <ComponentForm open={crud.formOpen} title={crud.editingItem ? "Edytuj poduszkę" : "Dodaj poduszkę"} fields={fields} initialData={crud.editingItem} onSubmit={crud.handleSubmit} onCancel={crud.handleCancel} isLoading={crud.submitting} />
    </>
  );
}
