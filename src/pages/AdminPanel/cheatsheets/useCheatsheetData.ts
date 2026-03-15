import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { CheatsheetData, CheatsheetSection, ProductRow, ProductSpec, SeriesConfig } from "./types";
import { getSpringForSeat as getSpring, formatFoamsInline as formatFoams, formatFoamsInlineWithFallback } from "./shared/helpers";

export function useCheatsheetData(seriesProductId: string, workstationCode: string): CheatsheetData {
  // Load sections
  const { data: sections = [], isLoading: sectionsLoading } = useQuery({
    queryKey: ["cheatsheet-sections", workstationCode],
    queryFn: async () => {
      const { data } = await supabase
        .from("cheatsheet_sections")
        .select("*")
        .eq("active", true)
        .order("sort_order");
      if (!data) return [];
      // Filter by workstation - need to resolve code to id
      const { data: ws } = await supabase.from("workstations").select("id").eq("code", workstationCode).single();
      if (!ws) return [];
      return data
        .filter((s: any) => s.workstation_id === ws.id)
        .map((s: any) => ({
          ...s,
          columns: typeof s.columns === "string" ? JSON.parse(s.columns) : (Array.isArray(s.columns) ? s.columns : []),
          filters: typeof s.filters === "string" ? JSON.parse(s.filters) : (s.filters ?? {}),
          renderer_config: typeof s.renderer_config === "string" ? JSON.parse(s.renderer_config) : (s.renderer_config ?? {}),
        })) as CheatsheetSection[];
    },
    enabled: !!workstationCode,
  });

  // Series product
  const { data: seriesProduct = null, isLoading: spLoading } = useQuery({
    queryKey: ["cheatsheet-series-product", seriesProductId],
    queryFn: async () => {
      const { data } = await supabase.from("products").select("*").eq("id", seriesProductId).single();
      return data as ProductRow | null;
    },
    enabled: !!seriesProductId,
  });

  // Series config via product_id
  const { data: seriesConfig = null, isLoading: scLoading } = useQuery({
    queryKey: ["cheatsheet-config", seriesProductId],
    queryFn: async () => {
      // Try product_id lookup first (new FK)
      const { data } = await (supabase
        .from("series_config")
        .select("*") as any)
        .eq("product_id", seriesProductId)
        .maybeSingle();
      if (data) return data as any as (SeriesConfig & { product_id?: string });
      // Fallback: lookup via old series table
      if (!seriesProduct) return null;
      const { data: oldSeries } = await supabase.from("series").select("id").eq("code", seriesProduct.code).maybeSingle();
      if (!oldSeries) return null;
      const { data: cfg } = await supabase.from("series_config").select("*").eq("series_id", oldSeries.id).maybeSingle();
      return cfg as any;
    },
    enabled: !!seriesProductId,
  });

  // Series components
  const { data: seriesComponents = [], isLoading: compLoading } = useQuery({
    queryKey: ["cheatsheet-components", seriesProductId],
    queryFn: async () => {
      const { data } = await supabase
        .from("products")
        .select("*")
        .eq("series_id", seriesProductId)
        .eq("active", true)
        .order("sort_order")
        .order("code");
      return (data ?? []) as ProductRow[];
    },
    enabled: !!seriesProductId,
  });

  // Global products
  const { data: globalProducts = [], isLoading: globalLoading } = useQuery({
    queryKey: ["cheatsheet-global-products"],
    queryFn: async () => {
      const { data } = await supabase
        .from("products")
        .select("*")
        .eq("is_global", true)
        .eq("active", true)
        .order("category")
        .order("code");
      return (data ?? []) as ProductRow[];
    },
  });

  // Product specs for series components
  const componentIds = seriesComponents.map(c => c.id);
  const { data: productSpecs = [], isLoading: specsLoading } = useQuery({
    queryKey: ["cheatsheet-specs", seriesProductId, componentIds.length],
    queryFn: async () => {
      if (componentIds.length === 0) return [];
      const { data } = await supabase
        .from("product_specs")
        .select("*")
        .in("product_id", componentIds)
        .order("position_number");
      return (data ?? []) as ProductSpec[];
    },
    enabled: componentIds.length > 0,
  });

  // Product relations
  const { data: productRelations = [], isLoading: relLoading } = useQuery({
    queryKey: ["cheatsheet-relations", seriesProductId],
    queryFn: async () => {
      const { data } = await supabase
        .from("product_relations")
        .select("*")
        .eq("series_id", seriesProductId)
        .eq("active", true);
      return (data ?? []) as any[];
    },
    enabled: !!seriesProductId,
  });

  // Sewing variants (uses old series.id)
  const { data: sewingVariants = [], isLoading: svLoading } = useQuery({
    queryKey: ["cheatsheet-sewing", seriesProductId],
    queryFn: async () => {
      if (!seriesProduct) return [];
      const { data: oldSeries } = await supabase.from("series").select("id").eq("code", seriesProduct.code).maybeSingle();
      if (!oldSeries) return [];
      const { data } = await supabase
        .from("sewing_variants")
        .select("*")
        .eq("series_id", oldSeries.id)
        .eq("component_type", "backrest")
        .order("variant_name");
      return (data ?? []) as any[];
    },
    enabled: !!seriesProduct,
  });

  const isLoading = sectionsLoading || spLoading || scLoading || compLoading || globalLoading || specsLoading || relLoading || svLoading;

  const allProducts = [...seriesComponents, ...globalProducts];

  const getByCategory = (category: string): ProductRow[] => {
    return allProducts.filter(p => p.category === category);
  };

  const getSpecsForProduct = (productId: string): ProductSpec[] => {
    return productSpecs.filter(s => s.product_id === productId);
  };

  const getRelationsByType = (type: string) => {
    return productRelations.filter((r: any) => r.relation_type === type);
  };

  const getSpringForSeatFn = (seat: ProductRow): string => {
    return getSpring(seat, seriesConfig);
  };

  const formatFoamsInlineFn = (productId: string): string => {
    const specs = getSpecsForProduct(productId)
      .filter(s => s.spec_type === "foam")
      .filter(s => s.height != null || s.width != null || s.length != null);
    return formatFoams(specs);
  };

  const formatFoamsInlineWithFallbackFn = (seat: ProductRow): string => {
    return formatFoamsInlineWithFallback(seat, productSpecs, getByCategory('seat'));
  };

  return {
    sections,
    seriesProduct,
    seriesConfig,
    seriesComponents,
    globalProducts,
    productSpecs,
    productRelations,
    sewingVariants,
    isLoading,
    getByCategory,
    getSpecsForProduct,
    getRelationsByType,
    getSpringForSeat: getSpringForSeatFn,
    formatFoamsInline: formatFoamsInlineFn,
    formatFoamsInlineWithFallback: formatFoamsInlineWithFallbackFn,
  };
}
