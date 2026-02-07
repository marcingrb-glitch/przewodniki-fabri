import { DecodedSKU } from "@/types";
import { createDoc, addHeader, addSectionTitle, addTable } from "@/utils/pdfHelpers";
import { SEATS_PUFA } from "@/data/mappings";

export function generatePufaGuidePDF(decoded: DecodedSKU): Blob {
  const doc = createDoc("portrait", "a4");
  const seriesInfo = `${decoded.series.code} - ${decoded.series.name} [${decoded.series.collection}]`;
  const orderNumber = decoded.orderNumber || "";
  const date = decoded.orderDate || "";

  let y = addHeader(doc, orderNumber, seriesInfo, date, "PUFA");

  // SKU pufy
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`SKU: ${decoded.pufaSKU || ""}`, 15, y);
  y += 7;

  // Siedzisko pufy
  const pufaSeat = SEATS_PUFA[decoded.seat.code];
  y = addSectionTitle(doc, "SIEDZISKO", y);
  y = addTable(doc, y,
    ["Siedzisko", "Front/Tyl", "Boki", "Pianka bazowa"],
    [[
      `${decoded.seat.code} (${decoded.seat.finishName})`,
      pufaSeat?.frontBack || "-",
      pufaSeat?.sides || "-",
      pufaSeat?.foam || "-",
    ]]
  );

  // Skrzynka
  y = addSectionTitle(doc, "SKRZYNKA", y);
  y = addTable(doc, y,
    ["Skrzynka", "Wysokosc"],
    [[pufaSeat?.box || "-", pufaSeat?.box || "-"]]
  );

  // Nóżki
  if (decoded.legs) {
    y = addSectionTitle(doc, "NOZKI", y);
    y = addTable(doc, y,
      ["Nozka", "Ilosc", "Wysokosc"],
      [[`${decoded.legs.code}${decoded.legs.color || ""}`, "4 szt", "H 16cm"]]
    );
  }

  return doc.output("blob");
}
