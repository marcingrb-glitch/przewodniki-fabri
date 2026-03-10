import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GuideSection, GuideColumn, CONDITION_LABELS, resolveExampleValue } from "./fieldResolver";

interface DecodingPreviewProps {
  sections: GuideSection[];
  exampleData: any;
  seriesId?: string | null;
}

export default function DecodingPreview({ sections, exampleData, seriesId }: DecodingPreviewProps) {
  const enabledSections = useMemo(
    () => sections.filter(s => s.enabled),
    [sections]
  );

  // Group consecutive sections with identical column headers into multi-row groups
  const groupedSections = useMemo(() => {
    const groups: { sections: GuideSection[] }[] = [];
    for (const section of enabledSections) {
      const headersKey = (section.columns as GuideColumn[]).map(c => c.header).join("|");
      const lastGroup = groups[groups.length - 1];
      if (lastGroup) {
        const lastHeaders = (lastGroup.sections[0].columns as GuideColumn[]).map(c => c.header).join("|");
        if (headersKey === lastHeaders && lastGroup.sections[0].is_conditional && section.is_conditional) {
          lastGroup.sections.push(section);
          continue;
        }
      }
      groups.push({ sections: [section] });
    }
    return groups;
  }, [enabledSections]);

  const seriesLabel = exampleData?.series
    ? `${exampleData.series.code} - ${exampleData.series.name} [${exampleData.series.collection || ""}]`
    : "S1 - Seria przykładowa [Kolekcja]";

  if (enabledSections.length === 0) {
    return (
      <Card className="mt-4">
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          Brak aktywnych sekcji do podglądu. Dodaj sekcje aby zobaczyć podgląd dekodowania.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-4">
      <CardHeader className="py-3 px-4">
        <CardTitle className="text-sm font-semibold">
          🔍 Podgląd dekodowania
          {seriesId && <Badge variant="secondary" className="ml-2 text-[10px]">Seria: {seriesLabel}</Badge>}
          {!seriesId && <Badge variant="outline" className="ml-2 text-[10px]">Globalny</Badge>}
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
                <p className="text-xs font-bold">NUMER ZAMÓWIENIA: 12345</p>
                <p className="text-[10px] text-muted-foreground">
                  Data złożenia zamówienia: {new Date().toISOString().slice(0, 10)}
                </p>
              </div>
              <p className="text-[10px] font-medium text-right">{seriesLabel}</p>
            </div>
            <p className="text-[10px] text-muted-foreground font-mono">SKU: S1-N01A-O01A-B01-SK15-AU01-N01BK</p>
          </div>

          {/* Image placeholder */}
          <div className="mx-5 mb-3 bg-muted/30 border border-border rounded flex items-center justify-center" style={{ height: 80 }}>
            <span className="text-[10px] text-muted-foreground">Zdjęcie wariantu</span>
          </div>

          {/* Dynamic sections */}
          <div className="px-5 pb-4 space-y-3">
            {groupedSections.map((group, gi) => {
              const isMultiRow = group.sections.length > 1;

              if (isMultiRow) {
                // Merged table for sections with identical columns (e.g. Poduszka/Jaśki/Wałek)
                const cols = group.sections[0].columns as GuideColumn[];
                const groupName = group.sections.map(s => s.section_name).join(" / ");
                return (
                  <div
                    key={`group-${gi}`}
                    className="rounded overflow-hidden border border-dashed border-muted-foreground/40"
                  >
                    <div className="px-2 py-1 flex items-center gap-2 bg-muted/30">
                      <span className="text-[10px] font-bold uppercase tracking-wide">
                        {groupName}
                      </span>
                      <Badge variant="outline" className="text-[8px] h-4 px-1 font-normal border-dashed">
                        warunkowe
                      </Badge>
                    </div>
                    <table className="w-full text-[9px]">
                      <thead>
                        <tr className="bg-muted/30">
                          <th className="px-2 py-1 text-left font-semibold border-r border-border truncate" style={{ width: "20%" }}>Typ</th>
                          {cols.map((col, ci) => (
                            <th key={ci} className="px-2 py-1 text-left font-semibold border-r border-border last:border-r-0 truncate">
                              {col.header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {group.sections.map((section, si) => (
                          <tr key={section.id} className="border-t border-border">
                            <td className="px-2 py-1 border-r border-border font-medium truncate">{section.section_name}</td>
                            {(section.columns as GuideColumn[]).map((col, ci) => (
                              <td key={ci} className="px-2 py-1 border-r border-border last:border-r-0 truncate text-muted-foreground">
                                {resolveExampleValue(col.field, exampleData)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              }

              // Single section rendering (unchanged logic)
              const section = group.sections[0];
              const cols = section.columns as GuideColumn[];
              if (cols.length === 0) return null;

              const isConditional = section.is_conditional;
              const condLabel = section.condition_field ? CONDITION_LABELS[section.condition_field] || section.condition_field : "";

              const MAX_COLS = 4;
              const SEAT_FOAM_FIELDS = new Set(["seat.foams_summary", "seat.front", "seat.midStrip_yn"]);

              const frameCols = cols.filter(c => c.field.startsWith("seat.") && !SEAT_FOAM_FIELDS.has(c.field));
              const foamCols = cols.filter(c => SEAT_FOAM_FIELDS.has(c.field));
              const otherCols = cols.filter(c => !c.field.startsWith("seat."));
              const hasSplit = frameCols.length > 0 && foamCols.length > 0;

              const renderChunkedTable = (columns: GuideColumn[], keyPrefix: string) => {
                const chunks: GuideColumn[][] = [];
                for (let i = 0; i < columns.length; i += MAX_COLS) {
                  chunks.push(columns.slice(i, i + MAX_COLS));
                }
                return chunks.map((chunk, chunkIdx) => (
                  <table key={`${keyPrefix}-${chunkIdx}`} className="w-full text-[9px]">
                    <thead>
                      <tr className="bg-muted/30">
                        {chunk.map((col, ci) => (
                          <th key={ci} className="px-2 py-1 text-left font-semibold border-r border-border last:border-r-0 truncate" style={{ maxWidth: `${100 / chunk.length}%` }}>
                            {col.header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-t border-border">
                        {chunk.map((col, ci) => (
                          <td key={ci} className="px-2 py-1 border-r border-border last:border-r-0 truncate text-muted-foreground" style={{ maxWidth: `${100 / chunk.length}%` }}>
                            {resolveExampleValue(col.field, exampleData)}
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                ));
              };

              return (
                <div
                  key={section.id}
                  className={`rounded overflow-hidden ${
                    isConditional
                      ? "border border-dashed border-muted-foreground/40"
                      : "border border-border"
                  }`}
                >
                  <div className={`px-2 py-1 flex items-center gap-2 ${
                    isConditional ? "bg-muted/30" : "bg-muted/60"
                  }`}>
                    <span className="text-[10px] font-bold uppercase tracking-wide">
                      {section.section_name}
                    </span>
                    {isConditional && (
                      <Badge variant="outline" className="text-[8px] h-4 px-1 font-normal border-dashed">
                        warunkowa: {condLabel}
                      </Badge>
                    )}
                  </div>

                  {hasSplit ? (
                    <>
                      <div className="text-[9px] font-semibold italic bg-muted/20 px-2 py-0.5 text-muted-foreground border-b border-border">Stolarka</div>
                      {renderChunkedTable(frameCols, "frame")}
                      <div className="text-[9px] font-semibold italic bg-muted/20 px-2 py-0.5 text-muted-foreground border-y border-border">Pianki</div>
                      {renderChunkedTable(foamCols, "foam")}
                    </>
                  ) : (
                    renderChunkedTable(
                      otherCols.length > 0
                        ? (frameCols.length > 0 || foamCols.length > 0 ? [...frameCols, ...foamCols, ...otherCols] : cols)
                        : cols,
                      "all"
                    )
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
