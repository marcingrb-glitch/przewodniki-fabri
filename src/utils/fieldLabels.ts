/**
 * Human-readable labels for decoded SKU field paths.
 * Used in label preview (admin) and PDF generation.
 * Keys match the dot-notation paths from COMPONENT_FIELDS / resolveField.
 */
export const SHORT_FIELD_LABELS: Record<string, string> = {
  // Seat
  "seat.code": "Kod siedziska",
  "seat.type": "Typ siedziska",
  "seat.frame": "Rama siedziska",
  "seat.foamsList": "Pianki siedziska",
  "seat.front": "Front siedziska",
  "seat.finish": "Wykończenie (kod)",
  "seat.finishName": "Wykończenie (nazwa)",
  "seat.midStrip": "Środkowy pasek",
  "seat.springType": "Sprężyna siedziska",

  // Automat
  "automat.code": "Kod automatu",
  "automat.name": "Nazwa automatu",
  "automat.type": "Typ automatu",

  // Side
  "side.code": "Kod boczka",
  "side.name": "Nazwa boczka",
  "side.frame": "Rama boczka",
  "side.finish": "Wykończenie (kod)",
  "side.finishName": "Wykończenie (nazwa)",

  // Backrest
  "backrest.code": "Kod oparcia",
  "backrest.height": "Wysokość oparcia",
  "backrest.frame": "Rama oparcia",
  "backrest.foamsList": "Pianki oparcia",
  "backrest.top": "Góra oparcia",
  "backrest.finish": "Wykończenie (kod)",
  "backrest.finishName": "Wykończenie (nazwa)",
  "backrest.springType": "Sprężyna oparcia",

  // Chest
  "chest.code": "Kod skrzyni",
  "chest.name": "Nazwa skrzyni",
  "chest.legHeight": "Wys. nóżki skrzyni",
  "chest.legCount": "Ilość nóżek skrzyni",

  // Legs (sofa chest)
  "legHeights.sofa_chest.leg": "Typ nogi (skrzynia)",
  "legHeights.sofa_chest.height": "Wysokość nogi (skrzynia)",
  "legHeights.sofa_chest.count": "Ilość nóg (skrzynia)",
  "leg.code": "Kod nogi",
  "leg.height": "Wysokość nogi",
  "leg.count": "Ilość nóg",

  // Legs (sofa seat)
  "legHeights.sofa_seat.leg": "Typ nogi (siedzisko)",
  "legHeights.sofa_seat.height": "Wysokość nogi (siedzisko)",
  "legHeights.sofa_seat.count": "Ilość nóg (siedzisko)",

  // Pufa legs
  "pufaLegs.code": "Kod nogi (pufa)",
  "pufaLegs.height": "Wysokość nogi (pufa)",
  "pufaLegs.count": "Ilość nóg (pufa)",

  // Fotel legs
  "fotelLegs.code": "Kod nogi (fotel)",
  "fotelLegs.height": "Wysokość nogi (fotel)",
  "fotelLegs.count": "Ilość nóg (fotel)",

  // Pufa seat
  "pufaSeat.frontBack": "Przód/Tył pufy",
  "pufaSeat.sides": "Boki pufy",
  "pufaSeat.foam": "Pianka pufy",
  "pufaSeat.box": "Skrzynka pufy",

  // Pillow
  "pillow.code": "Kod poduszki",
  "pillow.name": "Nazwa poduszki",
  "pillow.finish": "Wykończenie poduszki (kod)",
  "pillow.finishName": "Wykończenie poduszki (nazwa)",

  // Legs (common)
  "legs.code": "Kod nogi",
  "legs.name": "Nazwa nogi",
  "legs.material": "Materiał nogi",
  "legs.color": "Kolor nogi (kod)",
  "legs.colorName": "Kolor nogi (nazwa)",
};

/** Format a field value with its label prefix */
export function formatFieldWithLabel(fieldPath: string, value: string): string {
  const label = SHORT_FIELD_LABELS[fieldPath];
  if (!label) return value;
  return `${label}: ${value}`;
}
