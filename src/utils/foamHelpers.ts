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
 * Format: [name]: [wys]×[szer]×[dł] [materiał] | [qty] szt.
 *
 * Reguła: jeśli nazwa pianki kończy się kodem SKU-like (np. "Półwałek SD04",
 * "Półwałek SD02N") — pomijamy wymiary i materiał (to gotowy komponent).
 * Wyświetlamy samą nazwę.
 */
const PREFABRICATED_SUFFIX = /\b[A-Z]+\d+[A-Z]*$/;

export function formatFoamsDetailed(foams?: ProductFoamItem[]): string[] {
  if (!foams || foams.length === 0) return [];

  return foams.map(f => {
    const name = f.name?.trim() ?? "";
    const qtySuffix = (f.quantity ?? 1) > 1 ? ` | ${f.quantity} szt.` : "";

    // Pre-fabricated component (nazwa kończy się kodem SKU) → bez wymiarów
    if (name && PREFABRICATED_SUFFIX.test(name)) {
      return `${name}${qtySuffix}`;
    }

    const dims = [f.height, f.width, f.length].filter(v => v != null).join("×");
    const prefix = name ? `${name}: ` : "";
    return `${prefix}${dims}${qtySuffix}`;
  });
}

/**
 * Filtruj pianki wg `role` (base / front / side). Zwraca sformatowane linie.
 */
export function formatFoamsByRole(
  foams: ProductFoamItem[] | undefined,
  role: "base" | "front" | "side" | "back",
): string[] {
  if (!foams) return [];
  const filtered = foams.filter(f => (f.role ?? "base") === role);
  return formatFoamsDetailed(filtered);
}
