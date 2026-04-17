/**
 * Helpers for automat-related data derived from series × automat combination.
 * Keep rules centralized here so decoder, warehouse guide, and labels stay in sync.
 */

/**
 * Lock bolt positions in the frame (widok od tyłu ramy).
 *
 * Rules from KOBIK-PRODUCTS.md §6:
 * - S1 + AT2 (wyrzutkowy) → Poz. 1 i 3
 * - S1 + AT1, S2 + AT1    → Poz. 1 i 2
 *
 * Hardcoded for now. If more series/automat combos appear, move to
 * `product_relations` (automat_config) as a property.
 */
export function getLockBoltPositions(seriesCode: string, automatCode: string): string {
  if (seriesCode === "S1" && automatCode === "AT2") return "Poz. 1 i 3";
  return "Poz. 1 i 2";
}
