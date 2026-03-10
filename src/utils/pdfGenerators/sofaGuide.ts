import { DecodedSKU } from "@/types";
import { createDoc, addHeader, addTable, addInfoBox, toBlob } from "@/utils/pdfHelpers";
import { formatFoamsSummary } from "@/utils/foamHelpers";

export async function generateSofaGuidePDF(decoded: DecodedSKU): Promise<Blob> {
  const doc = await createDoc("portrait", "a4");
  const seriesInfo = `${decoded.series.code} - ${decoded.series.name} [${decoded.series.collection}]`;
  const orderNumber = decoded.orderNumber || "";
  const date = decoded.orderDate || "";

  let y = addHeader(doc, orderNumber, seriesInfo, date);

  // SKU zamówienia
  doc.setFontSize(9);
  doc.setFont("Roboto", "normal");
  doc.setTextColor(0, 0, 0);
  doc.text(`SKU: ${decoded.rawSKU || ""}`, 15, y);
  y += 7;

  // Siedzisko
  y = addTable(doc, y,
    ["Siedzisko", "Stelaż", "Pianka", "Front", "Pasek środek"],
    [[
      `${decoded.seat.code} (${decoded.seat.finishName})`,
      decoded.seat.frame,
      formatFoamsSummary(decoded.seat.foams, decoded.seat.foam),
      decoded.seat.front,
      decoded.seat.midStrip ? "TAK" : "NIE",
    ]]
  );

  // Oparcie
  y = addTable(doc, y,
    ["Oparcie", "Stelaż", "Pianka", "Góra"],
    [[
      `${decoded.backrest.code}${decoded.backrest.finish} (${decoded.backrest.finishName})`,
      decoded.backrest.frame,
      decoded.backrest.foam,
      decoded.backrest.top,
    ]]
  );

  // Boczek
  y = addTable(doc, y,
    ["Boczek", "Stelaż", "Pianka"],
    [[
      `${decoded.side.code}${decoded.side.finish} (${decoded.side.finishName})`,
      decoded.side.frame,
      "-",
    ]]
  );

  // Skrzynia + Automat
  y = addTable(doc, y,
    ["Skrzynia + Automat", "Skrzynia", "Automat"],
    [[
      `${decoded.chest.code} + ${decoded.automat.code}`,
      decoded.chest.name,
      `${decoded.automat.code} - ${decoded.automat.name}`,
    ]]
  );

  // Nóżka
  const chestLeg = decoded.legHeights.sofa_chest;
  const seatLeg = decoded.legHeights.sofa_seat;
  y = addTable(doc, y,
    ["Nóżka", "Skrzynia", "Siedzisko"],
    [[
      decoded.legs ? `${decoded.legs.code}${decoded.legs.color || ""}` : "-",
      chestLeg ? `${chestLeg.leg} H ${chestLeg.height}cm (${chestLeg.count} szt)` : "-",
      seatLeg ? `${seatLeg.leg} H ${seatLeg.height}cm (${seatLeg.count} szt)` : "BRAK",
    ]]
  );

  // Optional: Poduszki
  if (decoded.pillow) {
    y = addTable(doc, y,
      ["Poduszka", "Typ", "Wykończenie"],
      [[decoded.pillow.code, decoded.pillow.name, `${decoded.pillow.finish} (${decoded.pillow.finishName})`]]
    );
  }

  // Optional: Jaśki
  if (decoded.jaski) {
    y = addTable(doc, y,
      ["Jaśki", "Typ", "Wykończenie"],
      [[decoded.jaski.code, decoded.jaski.name, `${decoded.jaski.finish} (${decoded.jaski.finishName})`]]
    );
  }

  // Optional: Wałek
  if (decoded.walek) {
    y = addTable(doc, y,
      ["Wałek", "Typ", "Wykończenie"],
      [[decoded.walek.code, decoded.walek.name, `${decoded.walek.finish} (${decoded.walek.finishName})`]]
    );
  }

  // Extras table: "Do zamówienia jest" | PUFA | FOTEL
  const hasPufa = decoded.extras.some(e => e.type === "pufa");
  const hasFotel = decoded.extras.some(e => e.type === "fotel");
  if (hasPufa || hasFotel) {
    const extrasHeaders = ["Do zamówienia jest"];
    const extrasRow: string[] = [""];
    if (hasPufa) {
      extrasHeaders.push("PUFA");
      extrasRow.push(decoded.pufaSKU || "-");
    }
    if (hasFotel) {
      extrasHeaders.push("FOTEL");
      extrasRow.push(decoded.fotelSKU || "-");
    }
    y = addTable(doc, y, extrasHeaders, [extrasRow]);
  }

  return toBlob(doc);
}
