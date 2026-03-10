/**
 * Human-readable labels for decoded SKU field paths.
 * Used in label preview (admin) and PDF generation.
 * Keys match the dot-notation paths from COMPONENT_FIELDS / resolveField.
 */
export const SHORT_FIELD_LABELS: Record<string, string> = {
  // Seat
  "seat.code": "Siedzisko",
  "seat.type": "Typ",
  "seat.frame": "Stelaż",
  "seat.foamsList": "Pianki",
  "seat.front": "Front",
  "seat.finish": "Wykończenie (kod)",
  "seat.finishName": "Wykończenie (nazwa)",
  "seat.midStrip": "Środkowy pasek",
  "seat.springType": "Sprężyna",

  // Automat
  "automat.code": "Automat",
  "automat.name": "Automat",
  "automat.type": "Typ",

  // Side
  "side.code": "Boczek",
  "side.name": "Boczek",
  "side.frame": "Stelaż",
  "side.finish": "Wykończenie (kod)",
  "side.finishName": "Wykończenie (nazwa)",

  // Backrest
  "backrest.code": "Oparcie",
  "backrest.height": "Wysokość",
  "backrest.frame": "Stelaż",
  "backrest.foamsList": "Pianki",
  "backrest.top": "Góra",
  "backrest.finish": "Wykończenie (kod)",
  "backrest.finishName": "Wykończenie (nazwa)",
  "backrest.springType": "Sprężyna",

  // Chest
  "chest.code": "Skrzynia",
  "chest.name": "Nazwa",
  "chest.legHeight": "Wys. nóżki",
  "chest.legCount": "Ilość nóżek",

  // Legs (sofa chest)
  "legHeights.sofa_chest.leg": "Typ nogi (skrzynia)",
  "legHeights.sofa_chest.height": "Wysokość nogi (skrzynia)",
  "legHeights.sofa_chest.count": "Ilość nóg (skrzynia)",

  // Legs (sofa seat)
  "legHeights.sofa_seat.leg": "Typ nogi (siedzisko)",
  "legHeights.sofa_seat.height": "Wysokość nogi (siedzisko)",
  "legHeights.sofa_seat.count": "Ilość nóg (siedzisko)",

  // Pufa legs
  "pufaLegs.code": "Noga (pufa)",
  "pufaLegs.height": "Wysokość nogi (pufa)",
  "pufaLegs.count": "Ilość nóg (pufa)",

  // Fotel legs
  "fotelLegs.code": "Noga (fotel)",
  "fotelLegs.height": "Wysokość nogi (fotel)",
  "fotelLegs.count": "Ilość nóg (fotel)",

  // Pufa seat
  "pufaSeat.frontBack": "Przód/Tył",
  "pufaSeat.sides": "Boki",
  "pufaSeat.foam": "Pianka",
  "pufaSeat.box": "Skrzynka",

  // Pillow
  "pillow.code": "Poduszka",
  "pillow.name": "Nazwa",
  "pillow.finish": "Wykończenie (kod)",
  "pillow.finishName": "Wykończenie (nazwa)",

  // Legs (common)
  "legs.code": "Noga",
  "legs.name": "Nazwa",
  "legs.material": "Materiał",
  "legs.color": "Kolor (kod)",
  "legs.colorName": "Kolor (nazwa)",
};

/** Format a field value with its label prefix */
export function formatFieldWithLabel(fieldPath: string, value: string): string {
  const label = SHORT_FIELD_LABELS[fieldPath];
  if (!label) return value;
  return `${label}: ${value}`;
}
