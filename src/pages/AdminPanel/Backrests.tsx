import { useOutletContext } from "react-router-dom";
import DataTable from "@/components/admin/DataTable";
import ComponentForm, { FieldDefinition } from "@/components/admin/ComponentForm";
import { useAdminCrud } from "@/hooks/useAdminCrud";

const columns = [
  { key: "code", label: "Kod" },
  { key: "height_cm", label: "Wysokość (cm)" },
  { key: "frame", label: "Stelaż" },
  { key: "foam", label: "Pianka" },
  { key: "top", label: "Góra" },
  { key: "allowed_finishes", label: "Możliwe wykończenia", render: (v: string[]) => Array.isArray(v) ? v.join(", ") : "-" },
];

const fields: FieldDefinition[] = [
  { name: "code", label: "Kod", type: "text", required: true },
  { name: "height_cm", label: "Wysokość (cm)", type: "text" },
  { name: "frame", label: "Stelaż", type: "text" },
  { name: "foam", label: "Pianka", type: "text" },
  { name: "top", label: "Góra", type: "text" },
  { name: "allowed_finishes", label: "Możliwe wykończenia", type: "multi-select", required: true, options: [
    { value: "A", label: "A (Stebnówka)" },
    { value: "B", label: "B (Szczypanka)" },
    { value: "C", label: "C (Dwuigłówka)" },
  ]},
];

export default function Backrests() {
  const { selectedSeriesId } = useOutletContext<{ selectedSeriesId: string }>();
  const crud = useAdminCrud({ table: "backrests", queryKey: "admin-backrests", labelSingular: "Oparcie", filterColumn: "series_id", filterValue: selectedSeriesId });

  const handleSubmit = async (data: any) => {
    await crud.handleSubmit({ ...data, series_id: selectedSeriesId });
  };

  if (!selectedSeriesId) return <p className="text-muted-foreground">Wybierz serię w panelu bocznym.</p>;

  return (
    <>
      <DataTable title="Oparcia" columns={columns} data={crud.data} onAdd={crud.handleAdd} onEdit={crud.handleEdit} onDelete={crud.handleDelete} onBulkDelete={crud.handleBulkDelete} onDuplicate={crud.handleDuplicate} isLoading={crud.isLoading} />
      <ComponentForm open={crud.formOpen} title={crud.editingItem ? "Edytuj oparcie" : "Dodaj oparcie"} fields={fields} initialData={crud.editingItem} onSubmit={handleSubmit} onCancel={crud.handleCancel} isLoading={crud.submitting} />
    </>
  );
}
