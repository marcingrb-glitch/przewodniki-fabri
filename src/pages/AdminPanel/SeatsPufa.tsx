import { useOutletContext } from "react-router-dom";
import DataTable from "@/components/admin/DataTable";
import ComponentForm, { FieldDefinition } from "@/components/admin/ComponentForm";
import { useAdminCrud } from "@/hooks/useAdminCrud";

const columns = [
  { key: "code", label: "Kod" },
  { key: "front_back", label: "Front/Tył" },
  { key: "sides", label: "Boki" },
  { key: "base_foam", label: "Pianka bazowa" },
  { key: "box_height", label: "Skrzynka" },
];

const fields: FieldDefinition[] = [
  { name: "code", label: "Kod", type: "text", required: true },
  { name: "front_back", label: "Front/Tył", type: "text" },
  { name: "sides", label: "Boki", type: "text" },
  { name: "base_foam", label: "Pianka bazowa", type: "text" },
  { name: "box_height", label: "Wysokość skrzynki", type: "text" },
];

export default function SeatsPufa() {
  const { selectedSeriesId } = useOutletContext<{ selectedSeriesId: string }>();
  const crud = useAdminCrud({ table: "seats_pufa", queryKey: "admin-seats-pufa", labelSingular: "Siedzisko pufa", filterColumn: "series_id", filterValue: selectedSeriesId });

  const handleSubmit = async (data: any) => {
    await crud.handleSubmit({ ...data, series_id: selectedSeriesId });
  };

  if (!selectedSeriesId) return <p className="text-muted-foreground">Wybierz serię w panelu bocznym.</p>;

  return (
    <>
      <DataTable title="Siedziska Pufa" columns={columns} data={crud.data} onAdd={crud.handleAdd} onEdit={crud.handleEdit} onDelete={crud.handleDelete} isLoading={crud.isLoading} />
      <ComponentForm open={crud.formOpen} title={crud.editingItem ? "Edytuj siedzisko" : "Dodaj siedzisko"} fields={fields} initialData={crud.editingItem} onSubmit={handleSubmit} onCancel={crud.handleCancel} isLoading={crud.submitting} />
    </>
  );
}
