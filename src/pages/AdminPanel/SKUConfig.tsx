import { useOutletContext } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useAdminCrud } from "@/hooks/useAdminCrud";
import DataTable, { Column } from "@/components/admin/DataTable";
import ComponentForm, { FieldDefinition } from "@/components/admin/ComponentForm";
import { Badge } from "@/components/ui/badge";

// ---- Tab 1: Parse Rules (series-specific) ----
const parseRulesColumns: Column[] = [
  { key: "component_type", label: "Komponent" },
  {
    key: "zero_padded",
    label: "Zero-padded",
    render: (val: boolean) => (
      <Badge variant={val ? "default" : "secondary"}>{val ? "Tak" : "Nie"}</Badge>
    ),
  },
  { key: "code_format", label: "Format" },
  { key: "notes", label: "Notatki" },
];

const parseRulesFields: FieldDefinition[] = [
  { name: "component_type", label: "Typ komponentu", type: "text", required: true },
  { name: "zero_padded", label: "Zero-padded (wiodące zero)", type: "boolean" },
  { name: "code_format", label: "Format kodu", type: "text" },
  { name: "notes", label: "Notatki", type: "textarea" },
];

// ---- Tab 2: Side Exceptions (series-specific) ----
const sideExColumns: Column[] = [
  { key: "original_code", label: "Kod oryginalny" },
  { key: "mapped_code", label: "Kod zamapowany" },
  { key: "description", label: "Opis" },
  {
    key: "active",
    label: "Aktywny",
    render: (val: boolean) => (
      <Badge variant={val ? "default" : "outline"}>{val ? "Tak" : "Nie"}</Badge>
    ),
  },
];

const sideExFields: FieldDefinition[] = [
  { name: "original_code", label: "Kod oryginalny (Shopify)", type: "text", required: true },
  { name: "mapped_code", label: "Kod zamapowany (poprawny)", type: "text", required: true },
  { name: "description", label: "Opis", type: "textarea" },
  { name: "active", label: "Aktywny", type: "boolean" },
];

// ---- Tab 3: Seat Types (shared) ----
const seatTypesColumns: Column[] = [
  { key: "code", label: "Kod" },
  { key: "name", label: "Nazwa" },
];

const seatTypesFields: FieldDefinition[] = [
  { name: "code", label: "Kod (np. N, ND, W, D)", type: "text", required: true },
  { name: "name", label: "Nazwa", type: "text", required: true },
];

function ParseRulesTab({ seriesId }: { seriesId: string }) {
  const crud = useAdminCrud({
    table: "sku_parse_rules",
    queryKey: "admin-sku-parse-rules",
    labelSingular: "Reguła parsowania",
    filterColumn: "series_id",
    filterValue: seriesId,
    orderBy: "component_type",
  });

  const handleSubmit = async (formData: any) => {
    await crud.handleSubmit({ ...formData, series_id: seriesId });
  };

  return (
    <>
      <DataTable
        title="Reguły parsowania SKU"
        columns={parseRulesColumns}
        data={crud.data}
        onAdd={crud.handleAdd}
        onEdit={crud.handleEdit}
        onDelete={crud.handleDelete}
        onBulkDelete={crud.handleBulkDelete}
        onDuplicate={crud.handleDuplicate}
        isLoading={crud.isLoading}
      />
      <ComponentForm
        open={crud.formOpen}
        title={crud.editingItem ? "Edytuj regułę" : "Dodaj regułę"}
        fields={parseRulesFields}
        initialData={crud.editingItem}
        onSubmit={handleSubmit}
        onCancel={crud.handleCancel}
        isLoading={crud.submitting}
      />
    </>
  );
}

function SideExceptionsTab({ seriesId }: { seriesId: string }) {
  const crud = useAdminCrud({
    table: "side_exceptions",
    queryKey: "admin-side-exceptions",
    labelSingular: "Wyjątek boczka",
    filterColumn: "series_id",
    filterValue: seriesId,
    orderBy: "original_code",
  });

  const handleSubmit = async (formData: any) => {
    await crud.handleSubmit({ ...formData, series_id: seriesId });
  };

  return (
    <>
      <DataTable
        title="Wyjątki boczków (Shopify legacy)"
        columns={sideExColumns}
        data={crud.data}
        onAdd={crud.handleAdd}
        onEdit={crud.handleEdit}
        onDelete={crud.handleDelete}
        onBulkDelete={crud.handleBulkDelete}
        onDuplicate={crud.handleDuplicate}
        isLoading={crud.isLoading}
      />
      <ComponentForm
        open={crud.formOpen}
        title={crud.editingItem ? "Edytuj wyjątek" : "Dodaj wyjątek"}
        fields={sideExFields}
        initialData={crud.editingItem}
        onSubmit={handleSubmit}
        onCancel={crud.handleCancel}
        isLoading={crud.submitting}
      />
    </>
  );
}

function SeatTypesTab() {
  const crud = useAdminCrud({
    table: "seat_types",
    queryKey: "admin-seat-types",
    labelSingular: "Typ siedziska",
  });

  return (
    <>
      <DataTable
        title="Typy siedzisk"
        columns={seatTypesColumns}
        data={crud.data}
        onAdd={crud.handleAdd}
        onEdit={crud.handleEdit}
        onDelete={crud.handleDelete}
        onBulkDelete={crud.handleBulkDelete}
        onDuplicate={crud.handleDuplicate}
        isLoading={crud.isLoading}
      />
      <ComponentForm
        open={crud.formOpen}
        title={crud.editingItem ? "Edytuj typ" : "Dodaj typ"}
        fields={seatTypesFields}
        initialData={crud.editingItem}
        onSubmit={crud.handleSubmit}
        onCancel={crud.handleCancel}
        isLoading={crud.submitting}
      />
    </>
  );
}

export default function SKUConfig() {
  const { selectedSeriesId } = useOutletContext<{ selectedSeriesId: string }>();

  return (
    <Tabs defaultValue="rules" className="space-y-4">
      <TabsList>
        <TabsTrigger value="rules">Reguły parsowania</TabsTrigger>
        <TabsTrigger value="side-exceptions">Wyjątki boczków</TabsTrigger>
        <TabsTrigger value="seat-types">Typy siedzisk</TabsTrigger>
      </TabsList>

      <TabsContent value="rules">
        {selectedSeriesId ? (
          <ParseRulesTab seriesId={selectedSeriesId} />
        ) : (
          <p className="text-muted-foreground py-8 text-center">Wybierz serię w sidebarze, aby zobaczyć reguły.</p>
        )}
      </TabsContent>

      <TabsContent value="side-exceptions">
        {selectedSeriesId ? (
          <SideExceptionsTab seriesId={selectedSeriesId} />
        ) : (
          <p className="text-muted-foreground py-8 text-center">Wybierz serię w sidebarze, aby zobaczyć wyjątki.</p>
        )}
      </TabsContent>

      <TabsContent value="seat-types">
        <SeatTypesTab />
      </TabsContent>
    </Tabs>
  );
}
