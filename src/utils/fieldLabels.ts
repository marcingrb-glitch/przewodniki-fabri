/**
 * Short human-readable labels for decoded SKU field paths.
 * Used in label preview (admin) and PDF generation.
 * Keys match the dot-notation paths from COMPONENT_FIELDS / resolveField.
 */
export const SHORT_FIELD_LABELS: Record<string, string> = {
  // Seat
  "seat.code": "Kod",
  "seat.type": "Typ",
  "seat.frame": "Rama",
  "seat.foamsList": "Pianki",
  "seat.front": "Front",
  "seat.finish": "Wyk.",
  "seat.finishName": "Wykończenie",
  "seat.midStrip": "Śr. pasek",
  "seat.springType": "Sprężyna",

  // Automat
  "automat.code": "Automat",
  "automat.name": "Automat",
  "automat.type": "Typ automatu",

  // Side
  "side.code": "Kod",
  "side.name": "Nazwa",
  "side.frame": "Rama",
  "side.finish": "Wyk.",
  "side.finishName": "Wykończenie",

  // Backrest
  "backrest.code": "Kod",
  "backrest.height": "Wys.",
  "backrest.frame": "Rama",
  "backrest.foamsList": "Pianki",
  "backrest.top": "Góra",
  "backrest.finish": "Wyk.",
  "backrest.finishName": "Wykończenie",
  "backrest.springType": "Sprężyna",

  // Chest
  "chest.code": "Kod",
  "chest.name": "Nazwa",
  "chest.legHeight": "Wys. nóżki",
  "chest.legCount": "Ilość nóżek",

  // Legs (sofa chest)
  "legHeights.sofa_chest.leg": "Noga",
  "legHeights.sofa_chest.height": "Wys.",
  "legHeights.sofa_chest.count": "Ilość",
  "leg.code": "Noga",
  "leg.height": "Wys.",
  "leg.count": "Ilość",

  // Legs (sofa seat)
  "legHeights.sofa_seat.leg": "Noga",
  "legHeights.sofa_seat.height": "Wys.",
  "legHeights.sofa_seat.count": "Ilość",

  // Pufa legs
  "pufaLegs.code": "Noga",
  "pufaLegs.height": "Wys.",
  "pufaLegs.count": "Ilość",

  // Fotel legs
  "fotelLegs.code": "Noga",
  "fotelLegs.height": "Wys.",
  "fotelLegs.count": "Ilość",

  // Pufa seat
  "pufaSeat.frontBack": "Przód/Tył",
  "pufaSeat.sides": "Boki",
  "pufaSeat.foam": "Pianka",
  "pufaSeat.box": "Skrzynka",

  // Pillow
  "pillow.code": "Kod",
  "pillow.name": "Nazwa",
  "pillow.finish": "Wyk.",
  "pillow.finishName": "Wykończenie",

  // Legs (common)
  "legs.code": "Kod",
  "legs.name": "Nazwa",
  "legs.material": "Materiał",
  "legs.color": "Kolor",
  "legs.colorName": "Kolor",
};

/** Format a field value with its short label prefix */
export function formatFieldWithLabel(fieldPath: string, value: string): string {
  const label = SHORT_FIELD_LABELS[fieldPath];
  if (!label) return value;
  return `${label}: ${value}`;
}
