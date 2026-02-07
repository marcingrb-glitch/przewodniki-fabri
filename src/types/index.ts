// Types for the Production Guide System
// Will be expanded in Stage 2+

export interface Order {
  id: string;
  orderNumber: string;
  orderDate: string;
  sku: string;
  createdAt: string;
}

export interface ParsedSKU {
  seria: string;
  tkanina: string;
  siedzisko: string;
  boczek: string;
  oparcie: string;
  skrzynia: string;
  automat: string;
  nozki?: string;
  poduszka?: string;
  jasiek?: string;
  walek?: string;
  dodatki: string[];
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}
