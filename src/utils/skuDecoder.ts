import { ParsedSKU, DecodedSKU } from "@/types";
import {
  SERIES, FABRICS, SEAT_TYPES, SEATS_SOFA_S1, BACKRESTS, SIDES,
  CHESTS, AUTOMATS, LEGS, PILLOWS, JASKI, WALKI, EXTRAS,
  FINISHES, DEFAULT_FINISHES,
} from "@/data/mappings";

export function validateFinish(
  componentType: string,
  componentCode: string,
  finish: string,
  allowedFinishes?: string[]
): void {
  if (!allowedFinishes || allowedFinishes.length === 0) return;
  if (!allowedFinishes.includes(finish)) {
    console.warn(
      `⚠️ Wykończenie ${finish} nie jest dozwolone dla ${componentType} ${componentCode}. Dozwolone: ${allowedFinishes.join(', ')}`
    );
  }
}

export function decodeSKU(parsed: ParsedSKU): DecodedSKU {
  // Series
  const seriesData = SERIES[parsed.series] || { name: "Nieznana", collection: "?" };

  // Fabric
  const fabricData = FABRICS[parsed.fabric.code] || { name: "Nieznana", group: 0, colors: {} };
  const colorName = fabricData.colors[parsed.fabric.color] || parsed.fabric.color;

  // Seat
  const seatKey = `${parsed.seat.base}${parsed.seat.type}`;
  const seatSofa = SEATS_SOFA_S1[seatKey] || { frame: "?", foam: "?", front: "?", midStrip: false };
  const seatFinish = parsed.seat.finish || DEFAULT_FINISHES[seatKey] || "A";
  const seatFinishName = FINISHES[seatFinish] || seatFinish;

  // Side
  const sideData = SIDES[parsed.side.code] || { frame: "?", name: "Nieznany" };

  // Backrest
  const backrestData = BACKRESTS[parsed.backrest.code] || { frame: "?", foam: "?", top: "?", height: "?" };

  // Chest
  const chestData = CHESTS[parsed.chest] || { name: "?", legHeight: 0, legCount: 0 };

  // Automat
  const automatData = AUTOMATS[parsed.automat] || { name: "?", type: "?", seatLegs: false, seatLegHeight: 0, seatLegCount: 0 };

  // Legs
  let legsDecoded: DecodedSKU["legs"] = undefined;
  if (parsed.legs) {
    const legData = LEGS[parsed.legs.code] || { name: "?", material: "?", colors: {} };
    legsDecoded = {
      code: parsed.legs.code,
      name: legData.name,
      material: legData.material,
      color: parsed.legs.color,
      colorName: parsed.legs.color ? legData.colors[parsed.legs.color] || parsed.legs.color : undefined,
    };
  }

  // Leg heights for sofa
  const isSK23 = parsed.chest === "SK23";
  const sofaChestLeg = isSK23
    ? { leg: "N4", height: 2.5, count: 4 }
    : legsDecoded
      ? { leg: `${legsDecoded.code}${legsDecoded.color || ""}`, height: chestData.legHeight, count: chestData.legCount }
      : null;

  const sofaSeatLeg = automatData.seatLegs && legsDecoded
    ? { leg: `${legsDecoded.code}${legsDecoded.color || ""}`, height: automatData.seatLegHeight, count: automatData.seatLegCount }
    : null;

  // Pillow (inherits seat finish)
  let pillowDecoded: DecodedSKU["pillow"] = undefined;
  if (parsed.pillow) {
    const pData = PILLOWS[parsed.pillow] || { name: "?" };
    pillowDecoded = { code: parsed.pillow, name: pData.name, finish: seatFinish, finishName: seatFinishName };
  }

  // Jaski (inherits from pillow → seat)
  let jaskiDecoded: DecodedSKU["jaski"] = undefined;
  if (parsed.jaski) {
    const jData = JASKI[parsed.jaski] || { name: "?" };
    jaskiDecoded = { code: parsed.jaski, name: jData.name, finish: seatFinish, finishName: seatFinishName };
  }

  // Walek (inherits from pillow → seat)
  let walekDecoded: DecodedSKU["walek"] = undefined;
  if (parsed.walek) {
    const wData = WALKI[parsed.walek] || { name: "?" };
    walekDecoded = { code: parsed.walek, name: wData.name, finish: seatFinish, finishName: seatFinishName };
  }

  // Extras
  const extrasDecoded = parsed.extras.map((e) => {
    const eData = EXTRAS[e] || { name: "?", type: "?" };
    return { code: e, name: eData.name, type: eData.type };
  });

  // Generate pufa SKU
  let pufaSKU: string | undefined;
  const hasPufa = parsed.extras.some(e => e === "PF" || e === "PFO");
  if (hasPufa && parsed.legs) {
    const pufaType = parsed.extras.find(e => e === "PF" || e === "PFO")!;
    pufaSKU = `${pufaType}-${parsed.series}-${parsed.fabric.code}${parsed.fabric.color}-${seatKey}-${parsed.legs.code}${parsed.legs.color || ""}`;
  }

  // Generate fotel SKU
  let fotelSKU: string | undefined;
  const hasFotel = parsed.extras.includes("FT");
  if (hasFotel && parsed.legs) {
    const jaskiPart = parsed.jaski ? `-${parsed.jaski}` : "";
    fotelSKU = `FT-${parsed.series}-${parsed.fabric.code}${parsed.fabric.color}-${seatKey}-${parsed.side.code}${parsed.side.finish}${jaskiPart}-${parsed.legs.code}${parsed.legs.color || ""}`;
  }

  return {
    series: { code: parsed.series, name: seriesData.name, collection: seriesData.collection },
    fabric: { code: parsed.fabric.code, name: fabricData.name, color: parsed.fabric.color, colorName, group: fabricData.group },
    seat: {
      code: seatKey,
      type: parsed.seat.type,
      typeName: SEAT_TYPES[parsed.seat.type] || parsed.seat.type,
      finish: seatFinish,
      finishName: seatFinishName,
      frame: seatSofa.frame,
      foam: seatSofa.foam,
      front: seatSofa.front,
      midStrip: seatSofa.midStrip,
    },
    side: { code: parsed.side.code, name: sideData.name, frame: sideData.frame, finish: parsed.side.finish, finishName: FINISHES[parsed.side.finish] || parsed.side.finish },
    backrest: { code: parsed.backrest.code, height: backrestData.height, frame: backrestData.frame, foam: backrestData.foam, top: backrestData.top, finish: parsed.backrest.finish, finishName: FINISHES[parsed.backrest.finish] || parsed.backrest.finish },
    chest: { code: parsed.chest, name: chestData.name, legHeight: chestData.legHeight, legCount: chestData.legCount },
    automat: { code: parsed.automat, name: automatData.name, type: automatData.type, seatLegs: automatData.seatLegs, seatLegHeight: automatData.seatLegHeight, seatLegCount: automatData.seatLegCount },
    legs: legsDecoded,
    pillow: pillowDecoded,
    jaski: jaskiDecoded,
    walek: walekDecoded,
    extras: extrasDecoded,
    legHeights: { sofa_chest: sofaChestLeg, sofa_seat: sofaSeatLeg },
    pufaSKU,
    fotelSKU,
  };
}
