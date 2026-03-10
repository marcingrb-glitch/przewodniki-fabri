import { DecodedSKU } from "@/types";

export function buildExampleDecoded(data: any): DecodedSKU {
  const finish = data.finish || { code: "A", name: "Zwykłe" };
  const seat = data.seat || {};
  const side = data.side || {};
  const backrest = data.backrest || {};
  const chest = data.chest || {};
  const automat = data.automat || {};
  const series = data.series || { code: "S1", name: "Seria", collection: "Kolekcja" };
  const leg = data.leg || {};
  const pillow = data.pillow || null;
  const jaski = data.jaski || null;
  const walek = data.walek || null;
  const pufaSeat = data.pufaSeat || null;

  let legColor = "";
  let legColorName = "";
  if (leg?.colors && Array.isArray(leg.colors) && leg.colors.length > 0) {
    legColor = leg.colors[0]?.code || "";
    legColorName = leg.colors[0]?.name || "";
  }

  const decoded: DecodedSKU = {
    series: { code: series.code, name: series.name, collection: series.collection || "" },
    fabric: { code: "N01", name: "Novell", color: "12", colorName: "Szary", group: 3 },
    seat: {
      code: seat.code || "N01",
      type: seat.type || "N",
      finish: finish.code,
      finishName: finish.name,
      frame: seat.frame || "-",
      foam: "T25",
      front: seat.front || "-",
      midStrip: seat.center_strip || false,
      springType: seat.spring_type || "B",
      frameModification: seat.frame_modification || "",
    },
    side: {
      code: side.code || "B01",
      name: side.name || "Boczek standardowy",
      frame: side.frame || "-",
      finish: finish.code,
      finishName: finish.name,
    },
    backrest: {
      code: backrest.code || "O01",
      height: backrest.height_cm || "90",
      frame: backrest.frame || "-",
      foam: "HR35",
      top: backrest.top || "-",
      finish: finish.code,
      finishName: finish.name,
      springType: backrest.spring_type || "B",
    },
    chest: {
      code: chest.code || "SK15",
      name: chest.name || "Skrzynia 15",
      legHeight: chest.leg_height_cm || 5,
      legCount: chest.leg_count || 4,
    },
    automat: {
      code: automat.code || "AU01",
      name: automat.name || "Automat standardowy",
      type: automat.type || "DL",
      seatLegs: false,
      seatLegHeight: 0,
      seatLegCount: 0,
    },
    legs: leg?.code ? {
      code: leg.code,
      name: leg.name || "",
      material: leg.material || "",
      color: legColor,
      colorName: legColorName,
    } : undefined,
    pillow: pillow ? {
      code: pillow.code,
      name: pillow.name,
      finish: finish.code,
      finishName: finish.name,
    } : undefined,
    jaski: jaski ? {
      code: jaski.code,
      name: jaski.name,
      finish: finish.code,
      finishName: finish.name,
    } : undefined,
    walek: walek ? {
      code: walek.code,
      name: walek.name || "",
      finish: finish.code,
      finishName: finish.name,
    } : undefined,
    extras: [],
    legHeights: {
      sofa_chest: leg?.code ? { leg: leg.code, height: chest.leg_height_cm || 5, count: chest.leg_count || 4 } : null,
      sofa_seat: null,
    },
    pufaSeat: pufaSeat ? {
      frontBack: pufaSeat.front_back || "-",
      sides: pufaSeat.sides || "-",
      foam: pufaSeat.base_foam || "-",
      box: pufaSeat.box_height || "-",
    } : undefined,
    pufaSKU: pufaSeat ? `${series.code}-PUFA-EXAMPLE` : undefined,
    orderNumber: "12345",
    orderDate: new Date().toISOString().slice(0, 10),
    rawSKU: `${series.code}-N0112-${seat.code || "N01"}${finish.code}-${side.code || "B01"}${finish.code}-${backrest.code || "O01"}${finish.code}-${chest.code || "SK15"}-${automat.code || "AU01"}-${leg?.code || "N01"}BK`,
  };

  return decoded;
}
