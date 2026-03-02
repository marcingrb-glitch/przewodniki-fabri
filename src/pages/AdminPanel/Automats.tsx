import { useOutletContext } from "react-router-dom";
import DataTable from "@/components/admin/DataTable";
import ComponentForm, { FieldDefinition } from "@/components/admin/ComponentForm";
import { useAdminCrud } from "@/hooks/useAdminCrud";

const columns = [
  { key: "code", label: "Kod" },
  { key: "name", label: "Nazwa" },
  { key: "type", label: "Typ" },
  { key: "has_seat_legs", label: "Nóżki pod siedziskiem", render: (v: boolean) => v ? "Tak" : "Nie" },
  { key: "seat_leg_height_cm", label: "Wys. nóżek (cm)" },
  { key: "seat_leg_count", label: "Ilość nóżek" },
];

const fields: FieldDefinition[] = [
  { name: "code", label: "Kod", type: "text", required: true },
  { name: "name", label: "Nazwa", type: "text", required: true },
  { name: "type", label: "Typ", type: "text" },
  { name: "has_seat_legs", label: "Nóżki pod siedziskiem", type: "boolean" },
  { name: "seat_leg_height_cm", label: "Wysokość nóżek pod siedziskiem (cm)", type: "number" },
  { name: "seat_leg_count", label: "Ilość nóżek pod siedziskiem", type: "number" },
];

export default function Automats() {
  const { selectedSeriesId } = useOutletContext<{ selectedSeriesId: string }>();

  const crud = useAdminCrud({
    table: "automats",
    queryKey: "admin-automats",
    labelSingular: "Automat",
    filterColumn: "series_id",
    filterValue: selectedSeriesId,
  });

  const handleSubmit = async (formData: any) => {
    await crud.handleSubmit({ ...formData, series_id: selectedSeriesId });
  };

  if (!selectedSeriesId) {
    return <p className="text-muted-foreground p-4">Wybierz serię w sidebarze, aby zobaczyć automaty.</p>;
  }

  return (
    <>
      <DataTable title="Automaty" columns={columns} data={crud.data} onAdd={crud.handleAdd} onEdit={crud.handleEdit} onDelete={crud.handleDelete} onBulkDelete={crud.handleBulkDelete} onDuplicate={crud.handleDuplicate} isLoading={crud.isLoading} />
      <ComponentForm open={crud.formOpen} title={crud.editingItem ? "Edytuj automat" : "Dodaj automat"} fields={fields} initialData={crud.editingItem} onSubmit={handleSubmit} onCancel={crud.handleCancel} isLoading={crud.submitting} />
    </>
  );
}
