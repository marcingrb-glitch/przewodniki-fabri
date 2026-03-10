import DataTable from "@/components/admin/DataTable";
import ComponentForm, { FieldDefinition } from "@/components/admin/ComponentForm";
import { useAdminCrud } from "@/hooks/useAdminCrud";

const columns = [
  { key: "code", label: "Kod" },
  { key: "name", label: "Nazwa" },
  { key: "material", label: "Materiał" },
  { key: "completed_by", label: "Kto kompletuje" },
  { key: "colors", label: "Kolory", render: (v: any) => {
    if (!v || !Array.isArray(v) || v.length === 0) return "-";
    return v.map((c: any) => `${c.code}: ${c.name}`).join(", ");
  }},
];

const fields: FieldDefinition[] = [
  { name: "code", label: "Kod", type: "text", required: true },
  { name: "name", label: "Nazwa", type: "text", required: true },
  { name: "material", label: "Materiał", type: "text" },
  { name: "completed_by", label: "Kto kompletuje", type: "text" },
  { name: "colors", label: "Kolory", type: "colors" },
];

export default function Legs() {
  const crud = useAdminCrud({ table: "legs", queryKey: "admin-legs", labelSingular: "Nóżka" });

  return (
    <>
      <DataTable title="Nóżki" columns={columns} data={crud.data} onAdd={crud.handleAdd} onEdit={crud.handleEdit} onDelete={crud.handleDelete} onBulkDelete={crud.handleBulkDelete} onDuplicate={crud.handleDuplicate} isLoading={crud.isLoading} />
      <ComponentForm open={crud.formOpen} title={crud.editingItem ? "Edytuj nóżkę" : "Dodaj nóżkę"} fields={fields} initialData={crud.editingItem} onSubmit={crud.handleSubmit} onCancel={crud.handleCancel} isLoading={crud.submitting} />
    </>
  );
}
