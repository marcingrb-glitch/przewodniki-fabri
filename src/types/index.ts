// Types for the Production Guide System

export interface Order {
  id: string;
  order_number: string;
  order_date: string;
  sku: string;
  series_code?: string;
  decoded_data?: DecodedSKU;
  created_at: string;
}

export interface ParsedSKU {
  series: string;
  fabric: { code: string; color: string };
  seat: { base: string; type: string; finish?: string };
  side: { code: string; finish: string };
  backrest: { code: string; finish: string };
  chest: string;
  automat: string;
  legs?: { code: string; color?: string };
  pillow?: string;
  jaski?: string;
  walek?: string;
  extras: string[];
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface DecodedSKU {
  series: { code: string; name: string; collection: string };
  fabric: { code: string; name: string; color: string; colorName: string; group: number };
  seat: { code: string; type: string; typeName: string; finish: string; finishName: string; frame: string; foam: string; front: string; midStrip: boolean };
  side: { code: string; name: string; frame: string; finish: string; finishName: string };
  backrest: { code: string; height: string; frame: string; foam: string; top: string; finish: string; finishName: string };
  chest: { code: string; name: string; legHeight: number; legCount: number };
  automat: { code: string; name: string; type: string; seatLegs: boolean; seatLegHeight: number; seatLegCount: number };
  legs?: { code: string; name: string; material: string; color?: string; colorName?: string };
  pillow?: { code: string; name: string; finish: string; finishName: string };
  jaski?: { code: string; name: string; finish: string; finishName: string };
  walek?: { code: string; name: string; finish: string; finishName: string };
  extras: { code: string; name: string; type: string }[];
  legHeights: {
    sofa_chest: { leg: string; height: number; count: number } | null;
    sofa_seat: { leg: string; height: number; count: number } | null;
  };
  pufaSKU?: string;
  fotelSKU?: string;
  orderNumber?: string;
  orderDate?: string;
  rawSKU?: string;
  fabricOverride?: { name: string; color: string };
}
