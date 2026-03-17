import { Tables } from "@/integrations/supabase/types";

export interface CheatsheetSection {
  id: string;
  workstation_id: string;
  section_name: string;
  renderer_type: string;
  data_source: string;
  columns: ColumnDef[];
  filters: Record<string, any>;
  renderer_config: Record<string, any>;
  sort_order: number;
  show_specs: boolean;
  notes: string | null;
  active: boolean;
}

export interface ColumnDef {
  key: string;
  label: string;
  mono?: boolean;
  bold?: boolean;
  format?: "join" | "boolean" | "colors";
  suffix?: string;
}

export type ProductRow = Tables<"products">;
export type ProductSpec = Tables<"product_specs">;
export type ProductRelation = Tables<"product_relations">;
export type SewingVariant = Tables<"sewing_variants">;
export type SeriesConfig = Tables<"series_config">;

export interface CheatsheetData {
  sections: CheatsheetSection[];
  seriesProduct: ProductRow | null;
  seriesConfig: (SeriesConfig & { product_id?: string }) | null;
  seriesComponents: ProductRow[];
  globalProducts: ProductRow[];
  productSpecs: ProductSpec[];
  productRelations: ProductRelation[];
  sewingVariants: any[];
  isLoading: boolean;
  // helpers
  getByCategory: (category: string) => ProductRow[];
  getSpecsForProduct: (productId: string) => ProductSpec[];
  getRelationsByType: (type: string) => ProductRelation[];
  getSpringForSeat: (seat: ProductRow) => string;
  formatFoamsInline: (productId: string) => string;
  formatFoamsInlineWithFallback: (seat: ProductRow) => string;
  getAllowedChestCodes: () => string[];
  formatFoamsInlineWithFallback: (seat: ProductRow) => string;
}

export interface SectionRendererProps {
  section: CheatsheetSection;
  data: CheatsheetData;
  seriesProduct: ProductRow;
}
