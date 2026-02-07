import { DecodedSKU } from "@/types";
import { createDoc, addHeader, addTable, toBlob } from "@/utils/pdfHelpers";

export async function generateFotelGuidePDF(decoded: DecodedSKU): Promise<Blob> {
  const doc = await createDoc("portrait", "a4");
  const seriesInfo = `${decoded.series.code} - ${decoded.series.name} [${decoded.series.collection}]`;
  const orderNumber = decoded.orderNumber || "";
  const date = decoded.orderDate || "";

  let y = addHeader(doc, orderNumber, seriesInfo, date, "FOTEL");

  doc.setFontSize(9);
  doc.setFont("Roboto", "normal");
  doc.setTextColor(0, 0, 0);
  doc.text(`SKU: ${decoded.fotelSKU || ""}`, 15, y);
  y += 7;

  // Siedzisko
  y = addTable(doc, y,
    ["Siedzisko", "Stelaż", "Pianka", "Front"],
    [[
      `${decoded.seat.code} (${decoded.seat.finishName})`,
      decoded.seat.frame,
      decoded.seat.foam,
      decoded.seat.front,
    ]]
  );

  // Boczki
  y = addTable(doc, y,
    ["Boczek", "Stelaż", "Pianka"],
    [[
      `${decoded.side.code}${decoded.side.finish} (${decoded.side.finishName})`,
      decoded.side.frame,
      "-",
    ]]
  );

  // Nóżki
  if (decoded.legs) {
    y = addTable(doc, y,
      ["Nóżka", "Ilość", "Wysokość"],
      [[`${decoded.legs.code}${decoded.legs.color || ""}`, "4 szt", "H 16cm"]]
    );
  }

  // Jaśki
  if (decoded.jaski) {
    y = addTable(doc, y,
      ["Jaśki", "Typ", "Wykończenie"],
      [[decoded.jaski.code, decoded.jaski.name, `${decoded.jaski.finish} (${decoded.jaski.finishName})`]]
    );
  }

  return toBlob(doc);
}
