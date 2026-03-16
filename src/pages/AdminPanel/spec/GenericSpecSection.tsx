import { useState, useMemo, useCallback, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import ComponentForm from "@/components/admin/ComponentForm";
import type { FieldDefinition } from "@/components/admin/ComponentForm";
import InlineEditCell from "./InlineEditCell";
import FoamSubTable from "./plugins/FoamSubTable";
import SewingVariants from "./plugins/SewingVariants";
import CompatibilityMatrix from "./plugins/CompatibilityMatrix";
import PillowMapping from "./plugins/PillowMapping";
import type { SpecSectionConfig } from "./specSectionConfigs";

/** Flatten properties JSONB keys to top-level for display/edit */
function flattenProduct(product: any, propertyKeys: string[]): any {
  const flat = { ...product };
  for (const key of propertyKeys) {
    flat[key] = product.properties?.[key] ?? null;
  }
  return flat;
}

/** Pack top-level form keys back into properties JSONB for save */
function packProduct(formData: any, propertyKeys: string[]): any {
  const properties: Record<string, any> = {};
  const rest: Record<string, any> = {};
  for (const [k, v] of Object.entries(formData)) {
    if (propertyKeys.includes(k)) {
      properties[k] = v;
    } else {
      rest[k] = v;
    }
  }
  return { ...rest, properties };
}

interface GenericSpecSectionProps {
  seriesProductId: string;
  category: string;
  config: SpecSectionConfig;
}

export default function GenericSpecSection({ seriesProductId, category, config }: GenericSpecSectionProps) {
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("");

  const queryKey = ["spec-products", category, seriesProductId];

  // 1. Fetch products for this category + series
  const { data: products = [], isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("category", category)
        .eq("series_id", seriesProductId)
        .eq("active", true)
        .order("code");
      if (error) throw error;
      return (data ?? []).map((p: any) => flattenProduct(p, config.propertyKeys));
    },
  });

  // 2. For backrest model_name multi-select: load seat model names from this series
  const { data: seatModels = [] } = useQuery({
    queryKey: ["spec-seat-models", seriesProductId],
    queryFn: async () => {
      const { data } = await supabase
        .from("products")
        .select("properties")
        .eq("category", "seat")
        .eq("series_id", seriesProductId)
        .eq("active", true);
      const names = (data ?? [])
        .map((p: any) => p.properties?.model_name)
        .filter(Boolean)
        .flatMap((m: string) => m.split(/\s*[,\/]\s*/))
        .map((s: string) => s.trim())
        .filter(Boolean);
      return [...new Set(names)].sort();
    },
    enabled: category === "backrest",
  });

  // 3. Build dynamic fields for backrest (model_name options from seats)
  const dynamicFields = useMemo((): FieldDefinition[] => {
    if (category !== "backrest") return config.fields;
    return config.fields.map((f) => {
      if (f.name === "model_name") {
        return { ...f, options: seatModels.map((m) => ({ value: m, label: m })) };
      }
      return f;
    });
  }, [config.fields, seatModels, category]);

  // Grouping by model_name
  const hasModels = config.groupByModel && products.some((p: any) => p.model_name);
  const modelNames = useMemo(() => {
    if (!hasModels) return [];
    return [...new Set(products.map((p: any) => p.model_name).filter(Boolean))] as string[];
  }, [products, hasModels]);

  // CRUD: inline update single field on products table
  const updateField = useCallback(async (productId: string, field: string, value: string) => {
    const product = products.find((p: any) => p.id === productId);
    if (!product) return;

    if (config.propertyKeys.includes(field)) {
      const currentProps = product.properties ?? {};
      const boolFields = ["center_strip"];
      const newValue = boolFields.includes(field)
        ? value === "true"
        : (value || null);
      const updatedProps = { ...currentProps, [field]: newValue };
      const { error } = await supabase.from("products")
        .update({ properties: updatedProps, updated_at: new Date().toISOString() })
        .eq("id", productId);
      if (error) toast.error("Błąd zapisu");
      else { toast.success("Zapisano"); queryClient.invalidateQueries({ queryKey }); }
    } else {
      const { error } = await supabase.from("products")
        .update({ [field]: value || null, updated_at: new Date().toISOString() } as any)
        .eq("id", productId);
      if (error) toast.error("Błąd zapisu");
      else { toast.success("Zapisano"); queryClient.invalidateQueries({ queryKey }); }
    }
  }, [products, config.propertyKeys, queryClient, queryKey]);

  // CRUD: toggle boolean (center_strip)
  const toggleBoolean = useCallback(async (productId: string, field: string, current: boolean) => {
    const product = products.find((p: any) => p.id === productId);
    if (!product) return;
    const currentProps = product.properties ?? {};
    const updatedProps = { ...currentProps, [field]: !current };
    const { error } = await supabase.from("products")
      .update({ properties: updatedProps, updated_at: new Date().toISOString() })
      .eq("id", productId);
    if (error) toast.error("Błąd zapisu");
    else { toast.success("Zapisano"); queryClient.invalidateQueries({ queryKey }); }
  }, [products, queryClient, queryKey]);

  // CRUD: add/edit via ComponentForm
  const handleSubmit = useCallback(async (formData: any) => {
    setSubmitting(true);
    try {
      const packed = packProduct(formData, config.propertyKeys);
      packed.category = category;
      packed.is_global = false;
      packed.series_id = seriesProductId;

      // Handle model_name: if array (backrest multi-select), join with " / "
      if (Array.isArray(packed.properties?.model_name)) {
        packed.properties.model_name = packed.properties.model_name.join(" / ");
      }

      if (editingItem) {
        const { error } = await supabase.from("products")
          .update(packed).eq("id", editingItem.id);
        if (error) throw error;
        toast.success(`✅ ${config.labelSingular} zaktualizowany`);
      } else {
        const { error } = await supabase.from("products").insert([packed]);
        if (error) throw error;
        toast.success(`✅ ${config.labelSingular} dodany`);
      }
      queryClient.invalidateQueries({ queryKey });
      setFormOpen(false);
      setEditingItem(null);
    } catch (err: any) {
      toast.error(`❌ ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  }, [editingItem, config, category, seriesProductId, queryClient, queryKey]);

  // CRUD: delete
  const handleDelete = useCallback(async (id: string) => {
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) toast.error("Błąd usuwania");
    else { toast.success(`✅ ${config.labelSingular} usunięty`); queryClient.invalidateQueries({ queryKey }); }
  }, [config, queryClient, queryKey]);

  // Open edit form — for backrests, convert model_name string to array
  const openEditForm = (item: any) => {
    if (category === "backrest" && typeof item.model_name === "string") {
      const models = item.model_name.split(/\s*\/\s*/).map((m: string) => m.trim()).filter(Boolean);
      setEditingItem({ ...item, model_name: models });
    } else {
      setEditingItem(item);
    }
    setFormOpen(true);
  };

  if (isLoading) return <div className="text-muted-foreground py-8 text-center">Ładowanie...</div>;

  // ====== Render single product card (for seat + backrest) ======
  const renderProductCard = (product: any) => (
    <Card key={product.id} className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <InlineEditCell value={product.code} onSave={(v) => updateField(product.id, "code", v)} />
            {category === "seat" && product.seat_type && (
              <Badge variant="secondary">{product.seat_type}</Badge>
            )}
            {product.spring_type && (
              <Badge variant="outline">Sprężyna: {product.spring_type}</Badge>
            )}
          </CardTitle>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" onClick={() => openEditForm(product)}>
              <Pencil className="h-4 w-4" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    Usunąć {config.labelSingular.toLowerCase()} {product.code}
                    {product.model_name ? ` (${product.model_name})` : ""}?
                  </AlertDialogTitle>
                  <AlertDialogDescription>Ta operacja jest nieodwracalna.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Anuluj</AlertDialogCancel>
                  <AlertDialogAction onClick={() => handleDelete(product.id)}>Usuń</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
        {/* Sub-info line */}
        <div className="text-sm text-muted-foreground space-y-0.5 mt-1">
          {category === "seat" && (
            <div className="flex gap-4 flex-wrap">
              <span>Model: <InlineEditCell value={product.model_name} onSave={(v) => updateField(product.id, "model_name", v)} /></span>
              <span>Typ: <InlineEditCell value={product.seat_type} onSave={(v) => updateField(product.id, "seat_type", v)} /></span>
              <span>Sprężyna: <InlineEditCell value={product.spring_type} onSave={(v) => updateField(product.id, "spring_type", v)} /></span>
            </div>
          )}
          {product.allowed_finishes && (
            <div>Wykończenia: {product.allowed_finishes.join(", ")} {product.default_finish && `(domyślne: ${product.default_finish})`}</div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Dane techniczne — seat */}
        {category === "seat" && (
          <div className="rounded-md border p-4 space-y-2">
            <h4 className="text-sm font-semibold mb-2">Dane techniczne</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-sm">
              <div className="flex items-center gap-2">
                <span className="font-medium text-muted-foreground w-36 shrink-0">Stelaż:</span>
                <InlineEditCell value={product.frame} onSave={(v) => updateField(product.id, "frame", v)} />
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-muted-foreground w-36 shrink-0">Pasek środek:</span>
                <div className="flex items-center gap-1.5">
                  <Checkbox checked={!!product.center_strip} onCheckedChange={() => toggleBoolean(product.id, "center_strip", !!product.center_strip)} />
                  <span className="text-xs">{product.center_strip ? "TAK" : "NIE"}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:col-span-2">
                <span className="font-medium text-muted-foreground w-36 shrink-0">Modyfikacja stelaża:</span>
                <InlineEditCell value={product.frame_modification} onSave={(v) => updateField(product.id, "frame_modification", v)} />
              </div>
            </div>
          </div>
        )}

        {/* Dane techniczne — backrest */}
        {category === "backrest" && (
          <div className="rounded-md border p-4 space-y-2">
            <h4 className="text-sm font-semibold mb-2">Dane techniczne</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-sm">
              <div className="flex items-center gap-2">
                <span className="font-medium text-muted-foreground w-36 shrink-0">Stelaż:</span>
                <InlineEditCell value={product.frame} onSave={(v) => updateField(product.id, "frame", v)} />
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-muted-foreground w-36 shrink-0">Wysokość:</span>
                <InlineEditCell value={product.height_cm} onSave={(v) => updateField(product.id, "height_cm", v)} />
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-muted-foreground w-36 shrink-0">Sprężyna:</span>
                <InlineEditCell value={product.spring_type} onSave={(v) => updateField(product.id, "spring_type", v)} />
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-muted-foreground w-36 shrink-0">Model:</span>
                <span className="text-sm">{product.model_name ?? "—"}</span>
              </div>
            </div>
          </div>
        )}

        {/* Plugin: FoamSubTable */}
        {config.withFoams && (
          <FoamSubTable productId={product.id} productCode={product.code} category={category} seriesProductId={seriesProductId} />
        )}

        {/* Plugin: SewingVariants (backrest only) */}
        {config.withSewingVariants && (
          <SewingVariants
            productId={product.id}
            productCode={product.code}
            modelName={product.model_name}
            seriesProductId={seriesProductId}
            seatModels={seatModels}
          />
        )}

        {/* Plugin: PillowMapping (seat only) */}
        {config.withPillowMapping && (
          <PillowMapping productId={product.id} seriesProductId={seriesProductId} />
        )}
      </CardContent>
    </Card>
  );

  // ====== Main render ======
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => { setEditingItem(null); setFormOpen(true); }}>
          <Plus className="mr-1 h-4 w-4" /> Dodaj {config.labelSingular.toLowerCase()}
        </Button>
      </div>

      {products.length === 0 ? (
        <div className="text-center text-muted-foreground py-8">
          Brak {config.title.toLowerCase()}
        </div>
      ) : config.groupByModel && hasModels ? (
        /* Seat: grouped by model_name in tabs */
        <Tabs defaultValue={modelNames[0]}>
          <TabsList className="flex-wrap h-auto">
            {modelNames.map((name) => (
              <TabsTrigger key={name} value={name}>{name}</TabsTrigger>
            ))}
          </TabsList>
          {modelNames.map((name) => (
            <TabsContent key={name} value={name}>
              {products.filter((p: any) => p.model_name === name).map(renderProductCard)}
            </TabsContent>
          ))}
        </Tabs>
      ) : category === "side" ? (
        /* Side: table + compatibility matrix below */
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{config.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      {config.columns.map((col) => (
                        <th key={col.key} className="text-left p-3 text-sm font-medium text-muted-foreground">{col.label}</th>
                      ))}
                      <th className="w-[80px]"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product: any) => (
                      <tr key={product.id} className="border-b">
                        <td className="p-3"><InlineEditCell value={product.code} onSave={(v) => updateField(product.id, "code", v)} /></td>
                        <td className="p-3"><InlineEditCell value={product.name} onSave={(v) => updateField(product.id, "name", v)} /></td>
                        <td className="p-3"><InlineEditCell value={product.frame} onSave={(v) => updateField(product.id, "frame", v)} /></td>
                        <td className="p-3">{product.allowed_finishes?.join(", ") ?? "—"}</td>
                        <td className="p-3">{product.default_finish ?? "—"}</td>
                        <td className="p-3">
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditForm(product)}>
                              <Pencil className="h-3 w-3" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7"><Trash2 className="h-3 w-3 text-destructive" /></Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Usunąć boczek {product.code}?</AlertDialogTitle>
                                  <AlertDialogDescription>Ta operacja jest nieodwracalna.</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Anuluj</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDelete(product.id)}>Usuń</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Plugin: CompatibilityMatrix */}
          {config.withCompatibilityMatrix && (
            <CompatibilityMatrix
              sides={products}
              seriesProductId={seriesProductId}
            />
          )}
        </div>
      ) : (
        /* Default: card list (backrests) */
        <div>{products.map(renderProductCard)}</div>
      )}

      <ComponentForm
        open={formOpen}
        title={editingItem ? `Edytuj ${config.labelSingular.toLowerCase()} ${editingItem.code ?? ""}` : `Dodaj ${config.labelSingular.toLowerCase()}`}
        fields={dynamicFields}
        initialData={editingItem}
        onSubmit={handleSubmit}
        onCancel={() => { setFormOpen(false); setEditingItem(null); }}
        isLoading={submitting}
      />
    </div>
  );
}
