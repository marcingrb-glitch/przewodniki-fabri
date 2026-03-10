import { DecodedSKU } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface DecodingPreviewProps {
  decoded: DecodedSKU;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border border-border rounded overflow-hidden">
      <div className="px-2 py-1 bg-muted/60">
        <span className="text-[10px] font-bold uppercase tracking-wide">{title}</span>
      </div>
      {children}
    </div>
  );
}

function MiniTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <table className="w-full text-[9px]">
      <thead>
        <tr className="bg-muted/30">
          {headers.map((h, i) => (
            <th key={i} className="px-2 py-1 text-left font-semibold border-r border-border last:border-r-0 truncate">
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, ri) => (
          <tr key={ri} className="border-t border-border">
            {row.map((cell, ci) => (
              <td key={ci} className="px-2 py-1 border-r border-border last:border-r-0 truncate text-muted-foreground">
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function DecodingPreview({ decoded }: DecodingPreviewProps) {
  const seriesLabel = `${decoded.series.code} - ${decoded.series.name} [${decoded.series.collection}]`;

  return (
    <Card className="mt-4">
      <CardHeader className="py-3 px-4">
        <CardTitle className="text-sm font-semibold">
          🔍 Podgląd dekodowania
          <Badge variant="secondary" className="ml-2 text-[10px]">Seria: {seriesLabel}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <div
          className="border rounded-md bg-background mx-auto overflow-hidden shadow-sm"
          style={{ width: 500, minHeight: 300, maxHeight: 900 }}
        >
          {/* Header */}
          <div className="px-5 pt-4 pb-2 space-y-0.5">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold">NUMER ZAMÓWIENIA: {decoded.orderNumber || "12345"}</p>
                <p className="text-[10px] text-muted-foreground">
                  Data złożenia zamówienia: {decoded.orderDate || new Date().toISOString().slice(0, 10)}
                </p>
              </div>
              <p className="text-[10px] font-medium text-right">{seriesLabel}</p>
            </div>
            <p className="text-[10px] text-muted-foreground font-mono">SKU: {decoded.rawSKU || "—"}</p>
          </div>

          {/* Image placeholder */}
          <div className="mx-5 mb-3 bg-muted/30 border border-border rounded flex items-center justify-center" style={{ height: 80 }}>
            <span className="text-[10px] text-muted-foreground">Zdjęcie wariantu</span>
          </div>

          {/* Sections */}
          <div className="px-5 pb-4 space-y-3">
            {/* TKANINA */}
            <Section title="Tkanina">
              <MiniTable
                headers={["Kod", "Nazwa", "Kolor", "Grupa"]}
                rows={[[
                  `${decoded.fabric.code}${decoded.fabric.color}`,
                  decoded.fabric.name,
                  `${decoded.fabric.color} - ${decoded.fabric.colorName}`,
                  `${decoded.fabric.group}`,
                ]]}
              />
            </Section>

            {/* SIEDZISKO — STOLARKA */}
            <Section title="Siedzisko — Stolarka">
              <MiniTable
                headers={["Kod", "Typ", "Stelaż", "Modyfikacja", "Sprężyna", "Wykończenie"]}
                rows={[[
                  decoded.seat.code,
                  decoded.seat.type || "—",
                  decoded.seat.frame || "—",
                  decoded.seat.frameModification || "—",
                  decoded.seat.springType || "—",
                  `${decoded.seat.finish} (${decoded.seat.finishName})`,
                ]]}
              />
            </Section>

            {/* SIEDZISKO — PIANKI */}
            <Section title="Siedzisko — Pianki">
              <MiniTable
                headers={["Pianki", "Front", "Pasek środkowy"]}
                rows={[[
                  decoded.seat.foam || "—",
                  decoded.seat.front || "—",
                  decoded.seat.midStrip ? "TAK" : "NIE",
                ]]}
              />
            </Section>

            {/* OPARCIE */}
            <Section title="Oparcie">
              <MiniTable
                headers={["Kod", "Wys.", "Stelaż", "Góra", "Sprężyna", "Wykończenie"]}
                rows={[[
                  decoded.backrest.code,
                  `${decoded.backrest.height}cm`,
                  decoded.backrest.frame || "—",
                  decoded.backrest.top || "—",
                  decoded.backrest.springType || "—",
                  `${decoded.backrest.finish} (${decoded.backrest.finishName})`,
                ]]}
              />
            </Section>

            {/* BOCZEK */}
            <Section title="Boczek">
              <MiniTable
                headers={["Kod", "Nazwa", "Stelaż", "Wykończenie"]}
                rows={[[
                  decoded.side.code,
                  decoded.side.name,
                  decoded.side.frame || "—",
                  `${decoded.side.finish} (${decoded.side.finishName})`,
                ]]}
              />
            </Section>

            {/* SKRZYNIA + AUTOMAT */}
            <Section title="Skrzynia + Automat">
              <MiniTable
                headers={["Skrzynia", "Nazwa", "Automat", "Nazwa", "Typ"]}
                rows={[[
                  decoded.chest.code,
                  decoded.chest.name || "—",
                  decoded.automat.code,
                  decoded.automat.name,
                  decoded.automat.type || "—",
                ]]}
              />
            </Section>

            {/* NÓŻKI */}
            <Section title="Nóżki">
              <MiniTable
                headers={["", "Wartość", "Ilość/Materiał", "Kolor"]}
                rows={[
                  ...(decoded.legs ? [[
                    "Typ nóżki",
                    `${decoded.legs.code}${decoded.legs.color || ""} - ${decoded.legs.name}`,
                    decoded.legs.material || "—",
                    decoded.legs.colorName || "—",
                  ]] : []),
                  [
                    "Pod skrzynią",
                    decoded.legHeights.sofa_chest ? `${decoded.legHeights.sofa_chest.leg} H ${decoded.legHeights.sofa_chest.height}cm` : "—",
                    decoded.legHeights.sofa_chest ? `${decoded.legHeights.sofa_chest.count} szt` : "—",
                    "",
                  ],
                  [
                    "Pod siedziskiem",
                    decoded.legHeights.sofa_seat ? `${decoded.legHeights.sofa_seat.leg} H ${decoded.legHeights.sofa_seat.height}cm` : "BRAK",
                    decoded.legHeights.sofa_seat ? `${decoded.legHeights.sofa_seat.count} szt` : "—",
                    "",
                  ],
                ]}
              />
            </Section>

            {/* DODATKI */}
            {(decoded.pillow || decoded.jaski || decoded.walek || decoded.extras.length > 0) && (
              <Section title="Dodatki">
                <MiniTable
                  headers={["Typ", "Kod / Nazwa", "Wykończenie"]}
                  rows={[
                    ...(decoded.pillow ? [["Poduszka", `${decoded.pillow.code} - ${decoded.pillow.name}`, `${decoded.pillow.finish} (${decoded.pillow.finishName})`]] : []),
                    ...(decoded.jaski ? [["Jaśki", `${decoded.jaski.code} - ${decoded.jaski.name}`, `${decoded.jaski.finish} (${decoded.jaski.finishName})`]] : []),
                    ...(decoded.walek ? [["Wałek", decoded.walek.code, `${decoded.walek.finish} (${decoded.walek.finishName})`]] : []),
                    ...decoded.extras.map(e => [e.name, e.code, e.type || "—"]),
                  ]}
                />
              </Section>
            )}

            {/* PUFA */}
            {decoded.pufaSKU && (
              <Section title="Pufa">
                <MiniTable
                  headers={["", "Wartość"]}
                  rows={[
                    ["SKU pufy", decoded.pufaSKU],
                    ...(decoded.pufaSeat ? [
                      ["Przód/Tył", decoded.pufaSeat.frontBack || "—"],
                      ["Boki", decoded.pufaSeat.sides || "—"],
                      ["Pianka", decoded.pufaSeat.foam || "—"],
                      ["Skrzynka", decoded.pufaSeat.box || "—"],
                    ] : []),
                    ...(decoded.pufaLegs ? [[
                      "Nóżki pufy",
                      `${decoded.pufaLegs.code} H ${decoded.pufaLegs.height}cm (${decoded.pufaLegs.count} szt)`,
                    ]] : []),
                  ]}
                />
              </Section>
            )}

            {/* FOTEL */}
            {decoded.fotelSKU && (
              <Section title="Fotel">
                <MiniTable
                  headers={["", "Wartość"]}
                  rows={[
                    ["SKU fotela", decoded.fotelSKU],
                    ...(decoded.fotelLegs ? [[
                      "Nóżki fotela",
                      `${decoded.fotelLegs.code} H ${decoded.fotelLegs.height}cm (${decoded.fotelLegs.count} szt)`,
                    ]] : []),
                  ]}
                />
              </Section>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
