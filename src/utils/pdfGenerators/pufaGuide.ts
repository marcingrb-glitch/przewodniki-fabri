import { DecodedSKU } from "@/types";
import { createDoc, addHeader, addTable, toBlob } from "@/utils/pdfHelpers";
import { SEATS_PUFA } from "@/data/mappings";

export async function generatePufaGuidePDF(decoded: DecodedSKU): Promise<Blob> {
  const doc = await createDoc("portrait", "a4");
  const seriesInfo = `${decoded.series.code} - ${decoded.series.name} [${decoded.series.collection}]`;
  const orderNumber = decoded.orderNumber || "";
  const date = decoded.orderDate || "";

  let y = addHeader(doc, orderNumber, seriesInfo, date, "PUFA");

  // SKU pufy
  doc.setFontSize(9);
  doc.setFont("Roboto", "normal");
  doc.setTextColor(0, 0, 0);
  doc.text(`SKU: ${decoded.pufaSKU || ""}`, 15, y);
  y += 7;

  // Siedzisko pufy
  const pufaSeat = SEATS_PUFA[decoded.seat.code];
  y = addTable(doc, y,
    ["Siedzisko", "Front/Tył", "Boki", "Pianka bazowa"],
    [[
      `${decoded.seat.code} (${decoded.seat.finishName})`,
      pufaSeat?.frontBack || "-",
      pufaSeat?.sides || "-",
      pufaSeat?.foam || "-",
    ]]
  );

  // Skrzynka
  y = addTable(doc, y,
    ["Skrzynka", "Wysokość"],
    [[pufaSeat?.box || "-", pufaSeat?.box || "-"]]
  );

  // Nóżki
  if (decoded.legs) {
    y = addTable(doc, y,
      ["Nóżka", "Ilość", "Wysokość"],
      [[`${decoded.legs.code}${decoded.legs.color || ""}`, "4 szt", "H 16cm"]]
    );
  }

  return toBlob(doc);
}
