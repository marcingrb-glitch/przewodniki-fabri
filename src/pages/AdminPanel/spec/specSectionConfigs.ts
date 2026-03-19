import type { FieldDefinition } from "@/components/admin/ComponentForm";

export interface SpecColumnDef {
  key: string;
  label: string;
  source?: "property" | "field";
  render?: (value: any) => string;
}

export interface SpecSectionConfig {
  category: string;
  title: string;
  labelSingular: string;
  columns: SpecColumnDef[];
  fields: FieldDefinition[];
  propertyKeys: string[];
  withFoams?: boolean;
  withSewingVariants?: boolean;
  withCompatibilityMatrix?: boolean;
  withPillowMapping?: boolean;
  groupByModel?: boolean;
}

export const SPEC_SECTION_CONFIGS: Record<string, SpecSectionConfig> = {
  seat: {
    category: "seat",
    title: "Modele / Siedziska",
    labelSingular: "Siedzisko",
    propertyKeys: [
      "seat_type", "frame", "front", "center_strip",
      "model_name", "frame_modification", "spring_type",
      "foam_set",
    ],
    columns: [
      { key: "code", label: "Kod" },
      { key: "model_name", label: "Model" },
      { key: "seat_type", label: "Typ" },
      { key: "spring_type", label: "Sprężyna" },
      { key: "frame", label: "Stelaż" },
    ],
    fields: [
      { name: "code", label: "Kod", type: "text", required: true },
      { name: "name", label: "Nazwa", type: "text", required: true },
      { name: "model_name", label: "Model", type: "text" },
      { name: "seat_type", label: "Typ (kod)", type: "text" },
      { name: "frame", label: "Stelaż", type: "text" },
      { name: "front", label: "Przód", type: "text" },
      { name: "spring_type", label: "Sprężyna", type: "text" },
      { name: "frame_modification", label: "Modyfikacja stelaża", type: "text" },
      { name: "center_strip", label: "Środkowy pas", type: "boolean" },
      { name: "allowed_finishes", label: "Wykończenia", type: "multi-select", options: [
        { value: "A", label: "A" }, { value: "B", label: "B" },
        { value: "C", label: "C" }, { value: "D", label: "D" },
        { value: "E", label: "E" },
      ]},
      { name: "default_finish", label: "Domyślne wykończenie", type: "text" },
    ],
    withFoams: true,
    withPillowMapping: true,
    groupByModel: true,
  },

  backrest: {
    category: "backrest",
    title: "Oparcia",
    labelSingular: "Oparcie",
    propertyKeys: [
      "frame", "height_cm", "top", "spring_type", "model_name",
    ],
    columns: [
      { key: "code", label: "Kod" },
      { key: "model_name", label: "Model" },
      { key: "height_cm", label: "Wysokość (cm)" },
      { key: "spring_type", label: "Sprężyna" },
    ],
    fields: [
      { name: "code", label: "Kod", type: "text", required: true },
      { name: "name", label: "Nazwa", type: "text", required: true },
      { name: "model_name", label: "Model (np. Modena / Sienna)", type: "multi-select", options: [] },
      { name: "height_cm", label: "Wysokość (cm)", type: "text" },
      { name: "frame", label: "Stelaż", type: "text" },
      { name: "top", label: "Góra", type: "text" },
      { name: "spring_type", label: "Sprężyna", type: "text" },
      { name: "allowed_finishes", label: "Wykończenia", type: "multi-select", options: [
        { value: "A", label: "A" }, { value: "B", label: "B" },
        { value: "C", label: "C" }, { value: "D", label: "D" },
        { value: "E", label: "E" },
      ]},
      { name: "default_finish", label: "Domyślne wykończenie", type: "text" },
    ],
    withFoams: true,
    withSewingVariants: true,
    groupByModel: false,
  },

  side: {
    category: "side",
    title: "Boczki",
    labelSingular: "Boczek",
    propertyKeys: ["frame", "model_name", "commercial_name"],
    columns: [
      { key: "code", label: "Kod" },
      { key: "name", label: "Nazwa (prod.)", source: "field" },
      { key: "commercial_name", label: "Handlowa" },
      { key: "frame", label: "Stelaż" },
      { key: "allowed_finishes", label: "Wykończenia", source: "field", render: (v: any) => Array.isArray(v) ? v.join(", ") : "—" },
      { key: "default_finish", label: "Domyślne", source: "field", render: (v: any) => v ?? "—" },
    ],
    fields: [
      { name: "code", label: "Kod", type: "text", required: true },
      { name: "name", label: "Nazwa (produkcyjna)", type: "text", required: true },
      { name: "model_name", label: "Model", type: "text" },
      { name: "commercial_name", label: "Nazwa handlowa", type: "text" },
      { name: "frame", label: "Stelaż", type: "text" },
      { name: "allowed_finishes", label: "Wykończenia", type: "multi-select", options: [
        { value: "A", label: "A" }, { value: "B", label: "B" },
        { value: "C", label: "C" }, { value: "D", label: "D" },
        { value: "E", label: "E" },
      ]},
      { name: "default_finish", label: "Domyślne wykończenie", type: "text" },
    ],
    withCompatibilityMatrix: true,
    groupByModel: false,
  },
};
