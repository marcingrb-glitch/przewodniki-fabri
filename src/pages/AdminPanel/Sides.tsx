import { useOutletContext } from "react-router-dom";
import DataTable from "@/components/admin/DataTable";
import ComponentForm, { FieldDefinition } from "@/components/admin/ComponentForm";
import { useAdminCrud } from "@/hooks/useAdminCrud";

const columns = [
  { key: "code", label: "Kod" },
  { key: "name", label: "Nazwa" },
  { key: "frame", label: "Stelaż" },
];

const fields: FieldDefinition[] = [
  { name: "code", label: "Kod", type: "text", required: true },
  { name: "name", label: "Nazwa", type: "text", required: true },
  { name: "frame", label: "Stelaż", type: "text" },
];

export default function Sides() {
  const { selectedSeriesId } = useOutletContext<{ selectedSeriesId: string }>();
  const crud = useAdminCrud({ table: "sides", queryKey: "admin-sides", labelSingular: "Boczek", filterColumn: "series_id", filterValue: selectedSeriesId });

  const handleSubmit = async (data: any) => {
    await crud.handleSubmit({ ...data, series_id: selectedSeriesId });
  };

  if (!selectedSeriesId) return <p className="text-muted-foreground">Wybierz serię w panelu bocznym.</p>;

  return (
    <>
      <DataTable title="Boczki" columns={columns} data={crud.data} onAdd={crud.handleAdd} onEdit={crud.handleEdit} onDelete={crud.handleDelete} isLoading={crud.isLoading} />
      <ComponentForm open={crud.formOpen} title={crud.editingItem ? "Edytuj boczek" : "Dodaj boczek"} fields={fields} initialData={crud.editingItem} onSubmit={handleSubmit} onCancel={crud.handleCancel} isLoading={crud.submitting} />
    </>
  );
}
