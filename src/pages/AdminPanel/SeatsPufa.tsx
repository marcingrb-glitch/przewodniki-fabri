import { useOutletContext } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Info } from "lucide-react";
import DataTable from "@/components/admin/DataTable";
import ComponentForm, { FieldDefinition } from "@/components/admin/ComponentForm";
import { useAdminCrud } from "@/hooks/useAdminCrud";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";

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

  // Fetch sofa seats to get inherited allowed_finishes
  const { data: sofaSeats = [] } = useQuery({
    queryKey: ["admin-seats-sofa-finishes", selectedSeriesId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("seats_sofa")
        .select("code, allowed_finishes, default_finish")
        .eq("series_id", selectedSeriesId);
      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedSeriesId,
  });

  // Merge pufa data with sofa finishes
  const mergedData = (crud.data || []).map((pufaSeat: any) => {
    const sofaSeat = sofaSeats.find((s: any) => s.code === pufaSeat.code);
    return {
      ...pufaSeat,
      _allowed_finishes: sofaSeat?.allowed_finishes || [],
      _default_finish: sofaSeat?.default_finish,
    };
  });

  const columns = [
    { key: "code", label: "Kod" },
    { key: "front_back", label: "Front/Tył" },
    { key: "sides", label: "Boki" },
    { key: "base_foam", label: "Pianka bazowa" },
    { key: "box_height", label: "Skrzynka" },
    {
      key: "_allowed_finishes",
      label: "Możliwe wykończenia",
      render: (value: string[], row: any) => {
        if (!value || value.length === 0) return <span className="text-muted-foreground">-</span>;
        return (
          <TooltipProvider>
            <span className="text-muted-foreground italic text-sm">
              {value.join(", ")}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="inline ml-1 h-3.5 w-3.5 text-muted-foreground/60" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Dziedziczone z siedziska sofy {row.code}</p>
                </TooltipContent>
              </Tooltip>
            </span>
          </TooltipProvider>
        );
      },
    },
  ];

  const handleSubmit = async (data: any) => {
    await crud.handleSubmit({ ...data, series_id: selectedSeriesId });
  };

  if (!selectedSeriesId) return <p className="text-muted-foreground">Wybierz serię w panelu bocznym.</p>;

  return (
    <>
      <DataTable title="Siedziska Pufa" columns={columns} data={mergedData} onAdd={crud.handleAdd} onEdit={crud.handleEdit} onDelete={crud.handleDelete} onBulkDelete={crud.handleBulkDelete} onDuplicate={crud.handleDuplicate} isLoading={crud.isLoading} />
      <ComponentForm open={crud.formOpen} title={crud.editingItem ? "Edytuj siedzisko" : "Dodaj siedzisko"} fields={fields} initialData={crud.editingItem} onSubmit={handleSubmit} onCancel={crud.handleCancel} isLoading={crud.submitting} />
    </>
  );
}
