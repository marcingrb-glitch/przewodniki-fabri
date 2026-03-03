import { useOutletContext } from "react-router-dom";
import DataTable from "@/components/admin/DataTable";
import ComponentForm, { FieldDefinition } from "@/components/admin/ComponentForm";
import { useAdminCrud } from "@/hooks/useAdminCrud";

const columns = [
  { key: "code", label: "Kod" },
  { key: "type", label: "Typ (kod)" },
  { key: "type_name", label: "Typ (nazwa)" },
  { key: "frame", label: "Stelaż" },
  { key: "foam", label: "Pianka" },
  { key: "front", label: "Front" },
  { key: "center_strip", label: "Pasek środek", render: (v: boolean) => v ? "TAK" : "NIE" },
  { key: "allowed_finishes", label: "Możliwe wykończenia", render: (v: string[]) => Array.isArray(v) ? v.join(", ") : "-" },
];

const fields: FieldDefinition[] = [
  { name: "code", label: "Kod", type: "text", required: true },
  { name: "type", label: "Typ (kod np. N, ND, W)", type: "text" },
  { name: "type_name", label: "Typ (nazwa np. Niskie, Wysokie)", type: "text" },
  { name: "frame", label: "Stelaż", type: "text" },
  { name: "foam", label: "Pianka", type: "text" },
  { name: "front", label: "Front", type: "text" },
  { name: "center_strip", label: "Pasek środek", type: "boolean" },
  { name: "allowed_finishes", label: "Możliwe wykończenia", type: "multi-select", required: true, options: [
    { value: "A", label: "A (Stebnówka)" },
    { value: "B", label: "B (Szczypanka)" },
    { value: "C", label: "C (Dwuigłówka)" },
    { value: "D", label: "D (Zwykły)" },
  ]},
];

export default function SeatsSofa() {
  const { selectedSeriesId } = useOutletContext<{ selectedSeriesId: string }>();
  const crud = useAdminCrud({ table: "seats_sofa", queryKey: "admin-seats-sofa", labelSingular: "Siedzisko sofa", filterColumn: "series_id", filterValue: selectedSeriesId });

  const handleSubmit = async (data: any) => {
    await crud.handleSubmit({ ...data, series_id: selectedSeriesId });
  };

  if (!selectedSeriesId) return <p className="text-muted-foreground">Wybierz serię w panelu bocznym.</p>;

  return (
    <>
      <DataTable title="Siedziska Sofa" columns={columns} data={crud.data} onAdd={crud.handleAdd} onEdit={crud.handleEdit} onDelete={crud.handleDelete} onBulkDelete={crud.handleBulkDelete} onDuplicate={crud.handleDuplicate} isLoading={crud.isLoading} />
      <ComponentForm open={crud.formOpen} title={crud.editingItem ? "Edytuj siedzisko" : "Dodaj siedzisko"} fields={fields} initialData={crud.editingItem} onSubmit={handleSubmit} onCancel={crud.handleCancel} isLoading={crud.submitting} />
    </>
  );
}
