import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Trash2, Plus, GripVertical } from "lucide-react";
import InlineEditCell from "./spec/InlineEditCell";
import { toast } from "sonner";

interface LabelTemplate {
  id: string;
  product_type: string;
  label_name: string;
  component: string;
  content_template: string;
  quantity: number;
  sort_order: number;
  is_conditional: boolean;
  condition_field: string | null;
}

const PRODUCT_TYPES = ["sofa", "pufa", "fotel"] as const;

const PRODUCT_TYPE_LABELS: Record<string, string> = {
  sofa: "SOFA",
  pufa: "PUFA",
  fotel: "FOTEL",
};

export default function LabelTemplates() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<string>("sofa");

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ["label-templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("label_templates")
        .select("*")
        .order("product_type")
        .order("sort_order");
      if (error) throw error;
      return data as LabelTemplate[];
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, field, value }: { id: string; field: string; value: string | number | boolean }) => {
      const { error } = await supabase
        .from("label_templates")
        .update({ [field]: value })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["label-templates"] });
      toast.success("Zapisano");
    },
    onError: () => toast.error("Błąd zapisu"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("label_templates").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["label-templates"] });
      toast.success("Usunięto");
    },
    onError: () => toast.error("Błąd usuwania"),
  });

  const addMutation = useMutation({
    mutationFn: async (productType: string) => {
      const filtered = templates.filter((t) => t.product_type === productType);
      const maxOrder = filtered.length > 0 ? Math.max(...filtered.map((t) => t.sort_order)) : 0;
      const { error } = await supabase.from("label_templates").insert({
        product_type: productType,
        label_name: "Nowa etykieta",
        component: "custom",
        content_template: "",
        quantity: 1,
        sort_order: maxOrder + 1,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["label-templates"] });
      toast.success("Dodano etykietę");
    },
    onError: () => toast.error("Błąd dodawania"),
  });

  const handleUpdate = (id: string, field: string) => async (value: string) => {
    const parsed = field === "quantity" || field === "sort_order" ? parseInt(value) || 0 : value;
    await updateMutation.mutateAsync({ id, field, value: parsed });
  };

  const filteredTemplates = templates.filter((t) => t.product_type === activeTab);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">🏷️ Szablony etykiet</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Konfiguracja etykiet generowanych dla każdego typu produktu
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          {PRODUCT_TYPES.map((type) => (
            <TabsTrigger key={type} value={type}>
              {PRODUCT_TYPE_LABELS[type]}
              <Badge variant="secondary" className="ml-2 text-xs">
                {templates.filter((t) => t.product_type === type).length}
              </Badge>
            </TabsTrigger>
          ))}
        </TabsList>

        {PRODUCT_TYPES.map((type) => (
          <TabsContent key={type} value={type} className="mt-4">
            {isLoading ? (
              <p className="text-muted-foreground text-sm">Ładowanie...</p>
            ) : (
              <>
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[40px]">#</TableHead>
                        <TableHead className="w-[160px]">Nazwa etykiety</TableHead>
                        <TableHead className="w-[120px]">Komponent</TableHead>
                        <TableHead>Dane na etykiecie</TableHead>
                        <TableHead className="w-[80px]">Ilość</TableHead>
                        <TableHead className="w-[90px]">Kolejność</TableHead>
                        <TableHead className="w-[100px]">Warunkowa</TableHead>
                        <TableHead className="w-[60px]" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTemplates.map((tpl) => (
                        <TableRow key={tpl.id}>
                          <TableCell>
                            <GripVertical className="h-4 w-4 text-muted-foreground" />
                          </TableCell>
                          <TableCell>
                            <InlineEditCell
                              value={tpl.label_name}
                              onSave={handleUpdate(tpl.id, "label_name")}
                              placeholder="nazwa"
                            />
                          </TableCell>
                          <TableCell>
                            <InlineEditCell
                              value={tpl.component}
                              onSave={handleUpdate(tpl.id, "component")}
                              placeholder="komponent"
                            />
                          </TableCell>
                          <TableCell>
                            <InlineEditCell
                              value={tpl.content_template}
                              onSave={handleUpdate(tpl.id, "content_template")}
                              placeholder="szablon treści"
                              className="font-mono text-xs"
                            />
                          </TableCell>
                          <TableCell>
                            <InlineEditCell
                              value={tpl.quantity}
                              onSave={handleUpdate(tpl.id, "quantity")}
                              type="number"
                              className="w-16"
                            />
                          </TableCell>
                          <TableCell>
                            <InlineEditCell
                              value={tpl.sort_order}
                              onSave={handleUpdate(tpl.id, "sort_order")}
                              type="number"
                              className="w-16"
                            />
                          </TableCell>
                          <TableCell>
                            {tpl.is_conditional ? (
                              <Badge variant="outline" className="text-xs">
                                {tpl.condition_field || "tak"}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground text-xs">nie</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteMutation.mutate(tpl.id)}
                              className="h-8 w-8 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {filteredTemplates.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                            Brak szablonów etykiet dla tego typu produktu
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={() => addMutation.mutate(type)}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Dodaj etykietę
                </Button>
              </>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
