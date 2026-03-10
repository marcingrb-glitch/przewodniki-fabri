/**
 * Shared field resolver for guide and decoding previews.
 * Maps field paths to example values from database records.
 */

export interface GuideColumn {
  header: string;
  field: string;
}

export interface GuideSection {
  id: string;
  product_type: string;
  series_id: string | null;
  section_name: string;
  sort_order: number;
  is_conditional: boolean;
  condition_field: string | null;
  columns: GuideColumn[];
  enabled: boolean;
}

export interface FieldDef {
  value: string;
  label: string;
  group: string;
}

export const FIELD_GROUPS: { key: string; label: string }[] = [
  { key: "fabric", label: "Tkanina" },
  { key: "seat_frame", label: "Siedzisko — Stolarka" },
  { key: "seat_foam", label: "Siedzisko — Pianki" },
  { key: "backrest", label: "Oparcie" },
  { key: "side", label: "Boczek" },
  { key: "chest", label: "Skrzynia" },
  { key: "automat", label: "Automat" },
  { key: "legs", label: "Nóżki" },
  { key: "pillow", label: "Poduszka" },
  { key: "jaski", label: "Jaśki" },
  { key: "walek", label: "Wałek" },
  { key: "pufa", label: "Pufa" },
  { key: "fotel", label: "Fotel" },
  { key: "extras", label: "Dodatki" },
];

export const AVAILABLE_FIELDS: FieldDef[] = [
  { value: "fabric.code", label: "Kod", group: "fabric" },
  { value: "fabric.name", label: "Nazwa", group: "fabric" },
  { value: "fabric.color", label: "Kolor", group: "fabric" },
  { value: "fabric.group", label: "Grupa cenowa", group: "fabric" },
  { value: "seat.code", label: "Kod", group: "seat_frame" },
  { value: "seat.finish_name", label: "Wykończenie", group: "seat_frame" },
  { value: "seat.code_finish", label: "Kod + wykończenie (razem)", group: "seat_frame" },
  { value: "seat.type", label: "Typ siedziska", group: "seat_frame" },
  { value: "seat.frame", label: "Stelaż", group: "seat_frame" },
  { value: "seat.frameModification", label: "Modyfikacja stelaża", group: "seat_frame" },
  { value: "seat.front", label: "Front", group: "seat_foam" },
  { value: "seat.midStrip_yn", label: "Pasek środek", group: "seat_foam" },
  { value: "seat.springType", label: "Sprężyna", group: "seat_frame" },
  { value: "seat.foams_summary", label: "Pianka", group: "seat_foam" },
  { value: "backrest.code", label: "Kod", group: "backrest" },
  { value: "backrest.finish_name", label: "Wykończenie", group: "backrest" },
  { value: "backrest.code_finish", label: "Kod + wykończenie (razem)", group: "backrest" },
  { value: "backrest.frame", label: "Stelaż", group: "backrest" },
  { value: "backrest.foams_summary", label: "Pianka", group: "backrest" },
  { value: "backrest.top", label: "Góra", group: "backrest" },
  { value: "backrest.springType", label: "Sprężyna", group: "backrest" },
  { value: "side.code", label: "Kod", group: "side" },
  { value: "side.finish_name", label: "Wykończenie", group: "side" },
  { value: "side.code_finish", label: "Kod + wykończenie (razem)", group: "side" },
  { value: "side.frame", label: "Stelaż", group: "side" },
  { value: "side.foam", label: "Pianka", group: "side" },
  { value: "chest.name", label: "Nazwa", group: "chest" },
  { value: "chest_automat.label", label: "Skrzynia + Automat", group: "chest" },
  { value: "automat.code_name", label: "Kod + nazwa", group: "automat" },
  { value: "legs.code_color", label: "Kod + kolor", group: "legs" },
  { value: "legHeights.sofa_chest_info", label: "Skrzynia info", group: "legs" },
  { value: "legHeights.sofa_seat_info", label: "Siedzisko info", group: "legs" },
  { value: "pillow.code", label: "Kod", group: "pillow" },
  { value: "pillow.name", label: "Nazwa", group: "pillow" },
  { value: "pillow.finish_info", label: "Wykończenie", group: "pillow" },
  { value: "pillow.construction_type", label: "Wygląd", group: "pillow" },
  { value: "pillow.insert_type", label: "Wkład", group: "pillow" },
  { value: "jaski.code", label: "Kod", group: "jaski" },
  { value: "jaski.name", label: "Nazwa", group: "jaski" },
  { value: "jaski.finish_info", label: "Wykończenie", group: "jaski" },
  { value: "jaski.construction_type", label: "Wygląd", group: "jaski" },
  { value: "jaski.insert_type", label: "Wkład", group: "jaski" },
  { value: "walek.code", label: "Kod", group: "walek" },
  { value: "walek.name", label: "Nazwa", group: "walek" },
  { value: "walek.finish_info", label: "Wykończenie", group: "walek" },
  { value: "walek.construction_type", label: "Wygląd", group: "walek" },
  { value: "walek.insert_type", label: "Wkład", group: "walek" },
  { value: "pufaSeat.frontBack", label: "Front/tył", group: "pufa" },
  { value: "pufaSeat.sides", label: "Boki", group: "pufa" },
  { value: "pufaSeat.foam", label: "Pianka bazowa", group: "pufa" },
  { value: "pufaSeat.box", label: "Skrzynka", group: "pufa" },
  { value: "pufaLegs.code", label: "Nóżka kod", group: "pufa" },
  { value: "pufaLegs.count_info", label: "Nóżka ilość", group: "pufa" },
  { value: "pufaLegs.height_info", label: "Nóżka wysokość", group: "pufa" },
  { value: "fotelLegs.code", label: "Nóżka kod", group: "fotel" },
  { value: "fotelLegs.count_info", label: "Nóżka ilość", group: "fotel" },
  { value: "fotelLegs.height_info", label: "Nóżka wysokość", group: "fotel" },
  { value: "extras.label", label: "Etykieta", group: "extras" },
  { value: "extras.pufa_sku", label: "Pufa SKU", group: "extras" },
  { value: "extras.fotel_sku", label: "Fotel SKU", group: "extras" },
];

export const CONDITION_FIELDS = [
  { value: "pillow", label: "Poduszka istnieje" },
  { value: "jaski", label: "Jaśki istnieją" },
  { value: "walek", label: "Wałek istnieje" },
  { value: "pufaLegs", label: "Nóżki pufy istnieją" },
  { value: "fotelLegs", label: "Nóżki fotela istnieją" },
  { value: "extras_pufa_fotel", label: "Pufa lub fotel w dodatkach" },
];

export const CONDITION_LABELS: Record<string, string> = {
  pillow: "poduszka",
  jaski: "jaśki",
  walek: "wałek",
  pufaLegs: "nóżki pufy",
  fotelLegs: "nóżki fotela",
  extras_pufa_fotel: "pufa/fotel w dodatkach",
};

export function resolveExampleValue(field: string, data: any): string {
  if (!data) return "—";
  const v = (val: unknown) => (val != null && val !== "" ? String(val) : "—");
  const finishCode = v(data.finish?.code);
  const finishName = v(data.finish?.name);

  let legColor = "—";
  if (data.leg?.colors && Array.isArray(data.leg.colors) && (data.leg.colors as any[]).length > 0) {
    legColor = (data.leg.colors as any[])[0]?.code || "—";
  }

  const fabricColors = data.fabric?.colors;
  let fabricColorName = "—";
  if (Array.isArray(fabricColors) && fabricColors.length > 0) {
    fabricColorName = fabricColors[0]?.name || fabricColors[0]?.code || "—";
  }

  const map: Record<string, string> = {
    "fabric.code": v(data.fabric?.code),
    "fabric.name": v(data.fabric?.name),
    "fabric.color": fabricColorName,
    "fabric.group": data.fabric?.price_group != null ? `Grupa ${data.fabric.price_group}` : "—",
    "seat.code": v(data.seat?.code),
    "seat.finish_name": finishName,
    "seat.code_finish": `${v(data.seat?.code)} (${finishName})`,
    "seat.type": "Wciąg",
    "seat.frame": v(data.seat?.frame),
    "seat.foams_summary": "T25 40×50×10 (1 szt)",
    "seat.front": v(data.seat?.front),
    "seat.springType": v(data.seat?.spring_type),
    "seat.frameModification": v(data.seat?.frame_modification),
    "seat.midStrip_yn": data.seat?.center_strip ? "TAK" : "NIE",
    "backrest.code": v(data.backrest?.code),
    "backrest.finish_name": finishName,
    "backrest.code_finish": `${v(data.backrest?.code)}${finishCode} (${finishName})`,
    "backrest.frame": v(data.backrest?.frame),
    "backrest.foams_summary": "HR35 30×40×8 (1 szt)",
    "backrest.top": v(data.backrest?.top),
    "backrest.springType": v(data.backrest?.spring_type),
    "side.code": v(data.side?.code),
    "side.finish_name": finishName,
    "side.code_finish": `${v(data.side?.code)}${finishCode} (${finishName})`,
    "side.frame": v(data.side?.frame),
    "side.foam": "—",
    "chest.name": v(data.chest?.name),
    "chest_automat.label": `${v(data.chest?.code)} + ${v(data.automat?.code)}`,
    "automat.code_name": `${v(data.automat?.code)} - ${v(data.automat?.name)}`,
    "legs.code_color": `${v(data.leg?.code)}${legColor !== "—" ? legColor : ""}`,
    "legHeights.sofa_chest_info": data.chest ? `${v(data.leg?.name)} H ${v(data.chest?.leg_height_cm)}cm (${v(data.chest?.leg_count)} szt)` : "—",
    "legHeights.sofa_seat_info": "BRAK",
    "pillow.code": v(data.pillow?.code),
    "pillow.name": v(data.pillow?.name),
    "pillow.finish_info": `${finishCode} (${finishName})`,
    "pillow.construction_type": v(data.pillow?.construction_type),
    "pillow.insert_type": v(data.pillow?.insert_type),
    "jaski.code": v(data.jaski?.code),
    "jaski.name": v(data.jaski?.name),
    "jaski.finish_info": `${finishCode} (${finishName})`,
    "jaski.construction_type": v(data.jaski?.construction_type),
    "jaski.insert_type": v(data.jaski?.insert_type),
    "walek.code": v(data.walek?.code),
    "walek.name": v(data.walek?.name),
    "walek.finish_info": `${finishCode} (${finishName})`,
    "walek.construction_type": v(data.walek?.construction_type),
    "walek.insert_type": v(data.walek?.insert_type),
    "pufaSeat.frontBack": v(data.pufaSeat?.front_back),
    "pufaSeat.sides": v(data.pufaSeat?.sides),
    "pufaSeat.foam": v(data.pufaSeat?.base_foam),
    "pufaSeat.box": v(data.pufaSeat?.box_height),
    "pufaLegs.code": v(data.leg?.code),
    "pufaLegs.count_info": "4 szt",
    "pufaLegs.height_info": "H 15cm",
    "fotelLegs.code": v(data.leg?.code),
    "fotelLegs.count_info": "4 szt",
    "fotelLegs.height_info": "H 15cm",
    "extras.label": "Dodatki",
    "extras.pufa_sku": "PUFA-SKU-001",
    "extras.fotel_sku": "FOTEL-SKU-001",
  };

  return map[field] || field;
}
