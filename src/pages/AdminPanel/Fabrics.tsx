import DataTable from "@/components/admin/DataTable";
import ComponentForm, { FieldDefinition } from "@/components/admin/ComponentForm";
import { useAdminCrud } from "@/hooks/useAdminCrud";

const columns = [
  { key: "code", label: "Kod" },
  { key: "name", label: "Nazwa" },
  { key: "price_group", label: "Grupa" },
  { key: "colors", label: "Kolory", render: (v: any) => {
    if (!v || !Array.isArray(v)) return "-";
    return v.map((c: any) => `${c.code}: ${c.name}`).join(", ");
  }},
];

const fields: FieldDefinition[] = [
  { name: "code", label: "Kod", type: "text", required: true },
  { name: "name", label: "Nazwa", type: "text", required: true },
  { name: "price_group", label: "Grupa cenowa", type: "number", required: true },
  { name: "colors", label: "Kolory", type: "colors", required: true },
];

export default function Fabrics() {
  const crud = useAdminCrud({ table: "fabrics", queryKey: "admin-fabrics", labelSingular: "Tkanina" });

  return (
    <>
      <DataTable title="Tkaniny" columns={columns} data={crud.data} onAdd={crud.handleAdd} onEdit={crud.handleEdit} onDelete={crud.handleDelete} isLoading={crud.isLoading} />
      <ComponentForm open={crud.formOpen} title={crud.editingItem ? "Edytuj tkaninę" : "Dodaj tkaninę"} fields={fields} initialData={crud.editingItem} onSubmit={crud.handleSubmit} onCancel={crud.handleCancel} isLoading={crud.submitting} />
    </>
  );
}
