import { DecodedSKU } from "@/types";
import { createDoc, addHeader, addSectionTitle, addTable, addInfoBox, toBlob } from "@/utils/pdfHelpers";

export async function generateSofaGuidePDF(decoded: DecodedSKU): Promise<Blob> {
  const doc = await createDoc("portrait", "a4");
  const seriesInfo = `${decoded.series.code} - ${decoded.series.name} [${decoded.series.collection}]`;
  const orderNumber = decoded.orderNumber || "";
  const date = decoded.orderDate || "";

  let y = addHeader(doc, orderNumber, seriesInfo, date);

  // Siedzisko
  y = addSectionTitle(doc, "SIEDZISKO", y);
  y = addTable(doc, y,
    ["Siedzisko", "Stelaż", "Pianka", "Front", "Pasek środek"],
    [[
      `${decoded.seat.code} (${decoded.seat.finishName})`,
      decoded.seat.frame,
      decoded.seat.foam,
      decoded.seat.front,
      decoded.seat.midStrip ? "TAK" : "NIE",
    ]]
  );

  // Oparcie
  y = addSectionTitle(doc, "OPARCIE", y);
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
  y = addSectionTitle(doc, "BOCZEK", y);
  y = addTable(doc, y,
    ["Boczek", "Stelaż", "Pianka"],
    [[
      `${decoded.side.code}${decoded.side.finish} (${decoded.side.finishName})`,
      decoded.side.frame,
      "-",
    ]]
  );

  // Skrzynia + Automat
  y = addSectionTitle(doc, "SKRZYNIA + AUTOMAT", y);
  y = addTable(doc, y,
    ["Skrzynia + Automat", "Skrzynia", "Automat"],
    [[
      `${decoded.chest.code} + ${decoded.automat.code}`,
      decoded.chest.name,
      `${decoded.automat.code} - ${decoded.automat.name}`,
    ]]
  );

  // Nóżka
  y = addSectionTitle(doc, "NÓŻKA", y);
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
    y = addSectionTitle(doc, "PODUSZKI OPARCIOWE", y);
    y = addTable(doc, y,
      ["Poduszka", "Typ", "Wykończenie"],
      [[decoded.pillow.code, decoded.pillow.name, `${decoded.pillow.finish} (${decoded.pillow.finishName})`]]
    );
  }

  // Optional: Jaśki
  if (decoded.jaski) {
    y = addSectionTitle(doc, "JAŚKI", y);
    y = addTable(doc, y,
      ["Jaśki", "Typ", "Wykończenie"],
      [[decoded.jaski.code, decoded.jaski.name, `${decoded.jaski.finish} (${decoded.jaski.finishName})`]]
    );
  }

  // Optional: Wałek
  if (decoded.walek) {
    y = addSectionTitle(doc, "WAŁKI", y);
    y = addTable(doc, y,
      ["Wałek", "Typ", "Wykończenie"],
      [[decoded.walek.code, decoded.walek.name, `${decoded.walek.finish} (${decoded.walek.finishName})`]]
    );
  }

  // Extras info
  const hasPufa = decoded.extras.some(e => e.type === "pufa");
  const hasFotel = decoded.extras.some(e => e.type === "fotel");
  if (hasPufa || hasFotel) {
    if (hasPufa) {
      y = addInfoBox(doc, y, "Do zamówienia jest PUFA");
    }
    if (hasFotel) {
      y = addInfoBox(doc, y, "Do zamówienia jest FOTEL");
    }
  }

  return toBlob(doc);
}
