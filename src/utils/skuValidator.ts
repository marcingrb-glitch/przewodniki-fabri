import { ParsedSKU, ValidationResult } from "@/types";
import { parseSKU } from "./skuParser";

export function validateSKU(sku: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  const parsed = parseSKU(sku);

  // Required components
  if (!parsed.series) errors.push("Brak serii (S1, S2, N1...)");
  if (!parsed.fabric.code) errors.push("Brak tkaniny (T1-T13)");
  if (!parsed.seat.rawSegment) errors.push("Brak siedziska");
  if (!parsed.side.code) errors.push("Brak boczka (B1-B9)");
  if (!parsed.backrest.code) errors.push("Brak oparcia (OP62, OP68)");
  if (!parsed.chest) errors.push("Brak skrzyni (SK15, SK17, SK23)");
  if (!parsed.automat) errors.push("Brak automatu (AT1, AT2)");

  // Note: finish validations are handled by DB-based validateFinishesFromDB
  // which checks allowed_finishes and default_finish intelligently

  // Legs validation
  const hasExtras = parsed.extras.length > 0;
  const isSK23 = parsed.chest === "SK23";
  const isAT2 = parsed.automat === "AT2";

  if (hasExtras && !parsed.legs) {
    errors.push("Dodatki (PF/PFO/FT) wymagają nóżek (N) w SKU");
  }

  if (!isSK23 && (parsed.chest === "SK15" || parsed.chest === "SK17") && !parsed.legs) {
    if (!isAT2 || hasExtras) {
      errors.push("SK15/SK17 wymaga nóżek (N) w SKU");
    }
  }

  // Warnings
  if (isSK23 && isAT2 && hasExtras && parsed.legs) {
    warnings.push("Nóżki w SKU są dla dodatku (pufy/fotela), nie dla sofy");
  }

  if (isSK23 && !isAT2) {
    warnings.push("SK23 zwykle występuje z AT2 (wyrzutkowym)");
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
