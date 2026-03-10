import { ProductFoamItem } from "@/types";

/**
 * Format foams array into a summary string for PDF display.
 * Falls back to the legacy foam text field if no foams data available.
 */
export function formatFoamsSummary(foams?: ProductFoamItem[], legacyFoam?: string): string {
  if (!foams || foams.length === 0) {
    return legacyFoam || "-";
  }

  // Extract unique materials
  const materials = [...new Set(foams.map(f => f.material).filter(Boolean))];
  if (materials.length === 0) return legacyFoam || "-";
  
  return materials.join(", ");
}

/**
 * Format foams as detailed lines for extended display.
 * Format: [ilość]× [wys]×[szer]×[dł] [materiał]
 */
export function formatFoamsDetailed(foams?: ProductFoamItem[]): string[] {
  if (!foams || foams.length === 0) return [];
  
  return foams.map(f => {
    const dims = [f.height, f.width, f.length].filter(v => v != null).join("×");
    const qty = (f.quantity ?? 1) > 1 ? `${f.quantity}× ` : "";
    const mat = f.material ? ` ${f.material}` : "";
    const name = f.name ? `${f.name}: ` : "";
    return `${name}${qty}${dims}${mat}`;
  });
}
