/** Domyślne SKU per seria — zawierają PF i FT żeby podgląd pufy/fotela też działał */
export const DEFAULT_EXAMPLE_SKUS: Record<string, string> = {
  S1: "S1-T3D-SD02NA-B8C-OP62A-SK15-AT1-N5A-P1-J1-W1-PF-FT",
  S2: "S2-T13C-SD4B-B5B-OP68A-SK23-AT1-N4-P01-J1-W1",
};

/** Fallback gdy seria nie ma example SKU */
export const FALLBACK_EXAMPLE_SKU = "S1-T3D-SD02NA-B8C-OP62A-SK15-AT1-N5A-P1-J1-W1-PF-FT";
