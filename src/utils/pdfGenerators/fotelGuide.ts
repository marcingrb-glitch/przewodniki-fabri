import { DecodedSKU } from "@/types";
import { createDoc, addHeader, addSectionTitle, addTable } from "@/utils/pdfHelpers";

export function generateFotelGuidePDF(decoded: DecodedSKU): Blob {
  const doc = createDoc("portrait", "a4");
  const seriesInfo = `${decoded.series.code} - ${decoded.series.name} [${decoded.series.collection}]`;
  const orderNumber = decoded.orderNumber || "";
  const date = decoded.orderDate || "";

  let y = addHeader(doc, orderNumber, seriesInfo, date, "FOTEL");

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`SKU: ${decoded.fotelSKU || ""}`, 15, y);
  y += 7;

  // Siedzisko (same as sofa)
  y = addSectionTitle(doc, "SIEDZISKO", y);
  y = addTable(doc, y,
    ["Siedzisko", "Stelaz", "Pianka", "Front"],
    [[
      `${decoded.seat.code} (${decoded.seat.finishName})`,
      decoded.seat.frame,
      decoded.seat.foam,
      decoded.seat.front,
    ]]
  );

  // Boczki
  y = addSectionTitle(doc, "BOCZKI", y);
  y = addTable(doc, y,
    ["Boczek", "Stelaz", "Pianka"],
    [[
      `${decoded.side.code}${decoded.side.finish} (${decoded.side.finishName})`,
      decoded.side.frame,
      "-",
    ]]
  );

  // Nóżki
  if (decoded.legs) {
    y = addSectionTitle(doc, "NOZKI", y);
    y = addTable(doc, y,
      ["Nozka", "Ilosc", "Wysokosc"],
      [[`${decoded.legs.code}${decoded.legs.color || ""}`, "4 szt", "H 16cm"]]
    );
  }

  // Jaśki
  if (decoded.jaski) {
    y = addSectionTitle(doc, "JASKI", y);
    y = addTable(doc, y,
      ["Jaski", "Typ", "Wykonczenie"],
      [[decoded.jaski.code, decoded.jaski.name, `${decoded.jaski.finish} (${decoded.jaski.finishName})`]]
    );
  }

  return doc.output("blob");
}
