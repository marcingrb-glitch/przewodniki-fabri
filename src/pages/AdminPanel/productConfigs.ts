import type { FieldDefinition } from "@/components/admin/ComponentForm";

export interface ProductColumnDef {
  key: string;
  label: string;
  render?: (value: any) => string;
}

export interface ProductCategoryConfig {
  category: string;
  title: string;
  labelSingular: string;
  isGlobal: boolean;
  columns: ProductColumnDef[];
  fields: FieldDefinition[];
  propertyKeys: string[];
  orderBy?: string;
}

const renderColors = (v: any) => {
  if (!v || !Array.isArray(v) || v.length === 0) return "-";
  return v.map((c: any) => `${c.code}: ${c.name}`).join(", ");
};

const renderArray = (v: any) => Array.isArray(v) ? v.join(", ") : "-";

export const PRODUCT_CONFIGS: Record<string, ProductCategoryConfig> = {
  // ===== GLOBALNE =====
  fabric: {
    category: "fabric",
    title: "Tkaniny",
    labelSingular: "Tkanina",
    isGlobal: true,
    propertyKeys: ["price_group"],
    columns: [
      { key: "code", label: "Kod" },
      { key: "name", label: "Nazwa" },
      { key: "price_group", label: "Grupa" },
      { key: "colors", label: "Kolory", render: renderColors },
    ],
    fields: [
      { name: "code", label: "Kod", type: "text", required: true },
      { name: "name", label: "Nazwa", type: "text", required: true },
      { name: "price_group", label: "Grupa cenowa", type: "number", required: true },
      { name: "colors", label: "Kolory", type: "colors", required: true },
    ],
  },

  leg: {
    category: "leg",
    title: "Nóżki",
    labelSingular: "Nóżka",
    isGlobal: true,
    propertyKeys: ["material"],
    columns: [
      { key: "code", label: "Kod" },
      { key: "name", label: "Nazwa" },
      { key: "material", label: "Materiał" },
      { key: "colors", label: "Kolory", render: renderColors },
    ],
    fields: [
      { name: "code", label: "Kod", type: "text", required: true },
      { name: "name", label: "Nazwa", type: "text", required: true },
      { name: "material", label: "Materiał", type: "text" },
      { name: "colors", label: "Kolory", type: "colors" },
    ],
  },

  chest: {
    category: "chest",
    title: "Skrzynie",
    labelSingular: "Skrzynia",
    isGlobal: true,
    propertyKeys: ["leg_height_cm", "leg_count"],
    columns: [
      { key: "code", label: "Kod" },
      { key: "name", label: "Nazwa" },
      { key: "leg_height_cm", label: "Wysokość nóżek (cm)" },
      { key: "leg_count", label: "Ilość nóżek" },
    ],
    fields: [
      { name: "code", label: "Kod", type: "text", required: true },
      { name: "name", label: "Nazwa", type: "text", required: true },
      { name: "leg_height_cm", label: "Wysokość nóżek (cm)", type: "number", required: true },
      { name: "leg_count", label: "Ilość nóżek", type: "number", required: true },
    ],
  },

  automat: {
    category: "automat",
    title: "Automaty",
    labelSingular: "Automat",
    isGlobal: true,
    propertyKeys: ["type"],
    columns: [
      { key: "code", label: "Kod" },
      { key: "name", label: "Nazwa" },
      { key: "type", label: "Typ" },
    ],
    fields: [
      { name: "code", label: "Kod", type: "text", required: true },
      { name: "name", label: "Nazwa", type: "text", required: true },
      { name: "type", label: "Typ", type: "text" },
    ],
  },

  pillow: {
    category: "pillow",
    title: "Poduszki",
    labelSingular: "Poduszka",
    isGlobal: true,
    propertyKeys: ["construction_type", "insert_type"],
    columns: [
      { key: "code", label: "Kod" },
      { key: "name", label: "Nazwa" },
      { key: "construction_type", label: "Wygląd" },
      { key: "insert_type", label: "Wkład" },
      { key: "allowed_finishes", label: "Możliwe wykończenia", render: renderArray },
    ],
    fields: [
      { name: "code", label: "Kod", type: "text", required: true },
      { name: "name", label: "Nazwa", type: "text", required: true },
      { name: "construction_type", label: "Wygląd", type: "select", options: [
        { value: "sztanga", label: "Sztanga" },
        { value: "wciągi", label: "Wciągi" },
        { value: "gładka", label: "Gładka" },
      ]},
      { name: "insert_type", label: "Wkład", type: "select", options: [
        { value: "dinaro xl", label: "Dinaro XL" },
        { value: "dinaro 130", label: "Dinaro 130" },
        { value: "dinaro", label: "Dinaro" },
      ]},
      { name: "allowed_finishes", label: "Możliwe wykończenia", type: "multi-select", required: true, options: [
        { value: "A", label: "A (Stebnówka)" },
        { value: "B", label: "B (Szczypanka)" },
        { value: "C", label: "C (Dwuigłówka)" },
      ]},
    ],
  },

  jasiek: {
    category: "jasiek",
    title: "Jaśki",
    labelSingular: "Jasiek",
    isGlobal: true,
    propertyKeys: [],
    columns: [
      { key: "code", label: "Kod" },
      { key: "name", label: "Nazwa" },
    ],
    fields: [
      { name: "code", label: "Kod", type: "text", required: true },
      { name: "name", label: "Nazwa", type: "text", required: true },
    ],
  },

  walek: {
    category: "walek",
    title: "Wałki",
    labelSingular: "Wałek",
    isGlobal: true,
    propertyKeys: [],
    columns: [
      { key: "code", label: "Kod" },
      { key: "name", label: "Nazwa" },
    ],
    fields: [
      { name: "code", label: "Kod", type: "text", required: true },
      { name: "name", label: "Nazwa", type: "text", required: true },
    ],
  },

  finish: {
    category: "finish",
    title: "Wykończenia",
    labelSingular: "Wykończenie",
    isGlobal: true,
    propertyKeys: [],
    columns: [
      { key: "code", label: "Kod" },
      { key: "name", label: "Nazwa" },
    ],
    fields: [
      { name: "code", label: "Kod", type: "text", required: true },
      { name: "name", label: "Nazwa", type: "text", required: true },
    ],
  },

  // ===== PER-SERIA =====
  extra: {
    category: "extra",
    title: "Dodatki",
    labelSingular: "Dodatek",
    isGlobal: false,
    propertyKeys: ["type"],
    columns: [
      { key: "code", label: "Kod" },
      { key: "name", label: "Nazwa" },
      { key: "type", label: "Typ" },
    ],
    fields: [
      { name: "code", label: "Kod", type: "text", required: true },
      { name: "name", label: "Nazwa", type: "text", required: true },
      { name: "type", label: "Typ", type: "text" },
    ],
  },

  seat_pufa: {
    category: "seat_pufa",
    title: "Siedziska Pufa",
    labelSingular: "Siedzisko pufa",
    isGlobal: false,
    propertyKeys: ["front_back", "sides", "base_foam", "box_height"],
    columns: [
      { key: "code", label: "Kod" },
      { key: "front_back", label: "Front/Tył" },
      { key: "sides", label: "Boki" },
      { key: "base_foam", label: "Pianka bazowa" },
      { key: "box_height", label: "Skrzynka" },
    ],
    fields: [
      { name: "code", label: "Kod", type: "text", required: true },
      { name: "front_back", label: "Front/Tył", type: "text" },
      { name: "sides", label: "Boki", type: "text" },
      { name: "base_foam", label: "Pianka bazowa", type: "text" },
      { name: "box_height", label: "Wysokość skrzynki", type: "text" },
    ],
  },
};
