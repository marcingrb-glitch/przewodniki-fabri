import { DecodedSKU } from "@/types";
import { createDoc, addLabel, toBlob } from "@/utils/pdfHelpers";
import { SEATS_PUFA } from "@/data/mappings";

function seriesLine(decoded: DecodedSKU): string {
  return `[${decoded.series.code} - ${decoded.series.name} [${decoded.series.collection}]]`;
}

export async function generateSofaLabelsPDF(decoded: DecodedSKU): Promise<Blob> {
  const doc = await createDoc("landscape", [100, 30]);
  const s = seriesLine(decoded);
  const header = `SOFA | Zam: ${decoded.orderNumber || ""}`;
  const chestLeg = decoded.legHeights.sofa_chest;
  const seatLeg = decoded.legHeights.sofa_seat;

  addLabel(doc, [s, header, `Siedzisko: ${decoded.seat.code}`, `Automat: ${decoded.automat.code}`], true);
  addLabel(doc, [s, header, `Oparcie: ${decoded.backrest.code}${decoded.backrest.finish}`], false);
  addLabel(doc, [s, header, `Boczek: ${decoded.side.code}${decoded.side.finish}`], false);
  addLabel(doc, [s, header, `Boczek: ${decoded.side.code}${decoded.side.finish}`], false);
  addLabel(doc, [s, header, `Skrzynia: ${decoded.chest.code}`, `Automat: ${decoded.automat.code}`], false);

  const chestLegStr = chestLeg ? `${chestLeg.leg} H=${chestLeg.height}cm` : "N4 H=2.5cm";
  addLabel(doc, [s, header, `Noga skrzynia: ${chestLegStr}`, `Ilość: ${chestLeg?.count || 4} szt`], false);

  if (seatLeg) {
    addLabel(doc, [s, header, `Noga siedzisko: ${seatLeg.leg} H=${seatLeg.height}cm`, `Ilość: ${seatLeg.count} szt`], false);
  }

  return toBlob(doc);
}

export async function generatePufaLabelsPDF(decoded: DecodedSKU): Promise<Blob> {
  const doc = await createDoc("landscape", [100, 30]);
  const s = seriesLine(decoded);
  const header = `PUFA | Zam: ${decoded.orderNumber || ""}`;
  const pufaSeat = SEATS_PUFA[decoded.seat.code];

  addLabel(doc, [s, header, `Siedzisko: ${decoded.seat.code}`, `Pianka: ${pufaSeat?.foam || "-"}`], true);
  addLabel(doc, [s, header, `Skrzynka: ${pufaSeat?.box || "-"}`], false);

  if (decoded.legs) {
    addLabel(doc, [s, header, `Noga: ${decoded.legs.code}${decoded.legs.color || ""} H=16cm`, `Ilość: 4 szt`], false);
  }

  return toBlob(doc);
}

export async function generateFotelLabelsPDF(decoded: DecodedSKU): Promise<Blob> {
  const doc = await createDoc("landscape", [100, 30]);
  const s = seriesLine(decoded);
  const header = `FOTEL | Zam: ${decoded.orderNumber || ""}`;

  addLabel(doc, [s, header, `Siedzisko: ${decoded.seat.code}`], true);
  addLabel(doc, [s, header, `Boczek: ${decoded.side.code}${decoded.side.finish}`], false);

  if (decoded.legs) {
    addLabel(doc, [s, header, `Noga: ${decoded.legs.code}${decoded.legs.color || ""} H=16cm`, `Ilość: 4 szt`], false);
  }

  return toBlob(doc);
}
