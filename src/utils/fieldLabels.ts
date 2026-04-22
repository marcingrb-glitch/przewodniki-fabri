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
  "seat.midStrip_yn": "Środkowy pasek",
  "seat.springType": "Sprężyna",
  "seat.frameModification": "Modyfikacja stelaża",

  // Automat
  "automat.code": "Automat",
  "automat.name": "Automat",
  "automat.type": "Typ",

  // Side
  "side.code": "Kod boczka",
  "side.name": "Model",
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
  "chest.name": "Skrzynia",
  "chest.legHeight": "Wys. nóżki",
  "chest.legCount": "Ilość nóżek",

  // Legs (sofa chest)
  "legHeights.sofa_chest.leg": "Noga",
  "legHeights.sofa_chest.height": "H",
  "legHeights.sofa_chest.count": "Ilość",

  // Legs (sofa seat)
  "legHeights.sofa_seat.leg": "Noga",
  "legHeights.sofa_seat.height": "H",
  "legHeights.sofa_seat.count": "Ilość",

  // Pufa legs
  "pufaLegs.code": "Noga",
  "pufaLegs.height": "H",
  "pufaLegs.count": "Ilość",

  // Fotel legs
  "fotelLegs.code": "Noga",
  "fotelLegs.height": "H",
  "fotelLegs.count": "Ilość",

  // Pufa seat
  "pufaSeat.frontBack": "Przód/Tył",
  "pufaSeat.sides": "Boki",
  "pufaSeat.foam": "Pianka",
  "pufaSeat.box": "Skrzynka",

  // Pillow
  "pillow.code": "Poduszka",
  "pillow.name": "Poduszka",
  "pillow.finish": "Wykończenie (kod)",
  "pillow.finishName": "Wykończenie (nazwa)",

  // Chaise
  "chaise.code": "Kod szezlonga",
  "chaise.name": "Nazwa",
  "chaise.modelName": "Model",
  "chaise.frame": "Stelaż siedziska",
  "chaise.frameModification": "Modyfikacja stelaża",
  "chaise.backrestFrame": "Stelaż oparcia",
  "chaise.springType": "Sprężyna",
  "chaise.backrestHasSprings": "Sprężyna oparcia",
  "chaise.seatFoams_summary": "Pianki siedziskowe",
  "chaise.backrestFoams_summary": "Pianki oparcia",

  // Chaise legs
  "legHeights.chaise_info": "Nóżki szezlonga",

  // Width / orientation
  "width": "Szerokość",
  "orientation": "Strona",

  // Legs (common)
  "legs.code": "Noga",
  "legs.name": "Noga",
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
