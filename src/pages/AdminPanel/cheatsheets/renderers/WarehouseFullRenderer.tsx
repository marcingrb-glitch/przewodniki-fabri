import type { SectionRendererProps, ProductRow, ProductSpec } from "../types";
import { NoData } from "../shared/NoData";

// ─── helpers ────────────────────────────────────────────────────────

function foamDims(f: ProductSpec): string {
  if (f.height == null && f.width == null && f.length == null) return "—";
  return `${f.height ?? "?"}×${f.width ?? "?"}×${f.length ?? "?"}`;
}

function foamLine(f: ProductSpec): string {
  const dims = foamDims(f);
  const mat = f.material ? ` ${f.material}` : "";
  const qty = (f.quantity ?? 1) > 1 ? `${f.quantity}× ` : "";
  return `${qty}${dims}${mat}`.trim();
}

function specsAreEqual(a: ProductSpec, b: ProductSpec): boolean {
  return a.height === b.height && a.width === b.width && a.length === b.length && a.material === b.material;
}

function foamsByRole(specs: ProductSpec[], role: string): ProductSpec[] {
  return specs
    .filter(s => s.spec_type === "foam" && (s as any).foam_role === role)
    .sort((a, b) => (a.position_number ?? 0) - (b.position_number ?? 0));
}

/** Natural sort by code number */
function naturalSort(items: ProductRow[]): ProductRow[] {
  return [...items].sort((a, b) => {
    const codeA = a.code.replace(/^[A-Z]+/, "");
    const codeB = b.code.replace(/^[A-Z]+/, "");
    return codeA.localeCompare(codeB, undefined, { numeric: true });
  });
}

/** Check if Pianki column has any non-empty data */
function computeShowPiankiCol(
  seats: ProductRow[],
  data: SectionRendererProps["data"],
  commonBaseFoam: ProductSpec | null
): boolean {
  return seats.some(seat => {
    const props = seat.properties as any;
    const specs = data.getSpecsForProduct(seat.id);
    const isSet = props?.foam_set === true;
    if (isSet) return true;

    const isDzielone = props?.seat_type === "Dzielone";
    let effectiveSpecs = specs;
    if (isDzielone && specs.filter(s => s.spec_type === "foam").length === 0) {
      const baseCode = seat.code.replace(/D$/, "");
      const baseSeat = data.getByCategory("seat").find(
        s => s.code === baseCode && s.series_id === seat.series_id
      );
      if (baseSeat) effectiveSpecs = data.getSpecsForProduct(baseSeat.id);
    }

    const baseFoams = foamsByRole(effectiveSpecs, "base");
    let displayBase = baseFoams;
    if (commonBaseFoam && displayBase.length > 0 && specsAreEqual(displayBase[0], commonBaseFoam)) {
      displayBase = displayBase.slice(1);
    }
    return displayBase.length > 0 || isDzielone;
  });
}

// ─── main component ────────────────────────────────────────────────

export function WarehouseFullRenderer({ data }: SectionRendererProps) {
  const seats = naturalSort(data.getByCategory("seat"));
  const backrests = naturalSort(data.getByCategory("backrest"));
  const sides = naturalSort(data.getByCategory("side"));
  const seriesProps = (data.seriesProduct?.properties ?? {}) as Record<string, any>;

  if (seats.length === 0 && backrests.length === 0) return <NoData label="stolarka i pianki" />;

  // ── Info-box logic ──
  const allFrames = [...new Set(seats.map(s => (s.properties as any)?.frame).filter(Boolean))];
  const singleFrame = allFrames.length === 1 ? allFrames[0] : null;

  const allSprings = seats.map(s => data.getSpringForSeat(s));
  const uniqueSprings = [...new Set(allSprings)];
  const singleSpring = uniqueSprings.length === 1 ? uniqueSprings[0] : null;

  // Common base foam: first base foam identical across all non-set, non-Dzielone seats
  const nonSetSeats = seats.filter(s => {
    const p = s.properties as any;
    return p?.foam_set !== true && p?.seat_type !== "Dzielone";
  });
  let commonBaseFoam: ProductSpec | null = null;
  if (nonSetSeats.length > 0) {
    const firstBaseAll = nonSetSeats.map(s => foamsByRole(data.getSpecsForProduct(s.id), "base")[0]).filter(Boolean);
    if (firstBaseAll.length === nonSetSeats.length && firstBaseAll.every(f => specsAreEqual(f, firstBaseAll[0]))) {
      commonBaseFoam = firstBaseAll[0];
    }
  }

  // Has models column?
  const allModels = seats.map(s => (s.properties as any)?.model_name).filter(Boolean);
  const uniqueModels = [...new Set(allModels)];
  const showModelCol = uniqueModels.length > 1;

  // Has spring column?
  const showSpringCol = uniqueSprings.length > 1;

  // Show Pianki column?
  const showPiankiCol = computeShowPiankiCol(seats, data, commonBaseFoam);

  // Group by frame for S2-style
  const frameGroups = groupByFrame(seats);
  const multipleFrameGroups = frameGroups.length > 1;

  // ── Backrests grouping (merge rows with identical foams) ──
  const backrestRows = buildBackrestRows(backrests, data, seriesProps.default_spring);

  return (
    <div className="space-y-6">
      {/* 1. Info box */}
      <InfoBox
        seriesProps={seriesProps}
        singleFrame={singleFrame}
        singleSpring={singleSpring}
        commonBaseFoam={commonBaseFoam}
      />

      {/* 2. Seats table */}
      {seats.length > 0 && (
        <section>
          <h3 className="text-base font-semibold mb-1">Siedziska</h3>
          {!showPiankiCol && (
            <p className="text-sm text-muted-foreground mb-2">
              Pianka bazowa identyczna — różni się tylko front.
            </p>
          )}
          {multipleFrameGroups ? (
            <div className="space-y-4">
              {frameGroups.map(group => {
                const hasException = group.seats.some(s => data.getSpringForSeat(s) !== seriesProps.default_spring);
                return (
                  <div key={group.frame}>
                    <p className={`text-sm font-medium mb-1 ${hasException ? "font-bold underline" : ""}`}>
                      Stelaż: {group.frame}
                    </p>
                    <SeatsTable
                      seats={group.seats}
                      data={data}
                      showModel={showModelCol}
                      showSpring={showSpringCol}
                      showPianki={showPiankiCol}
                      commonBaseFoam={commonBaseFoam}
                    />
                  </div>
                );
              })}
            </div>
          ) : (
            <SeatsTable
              seats={seats}
              data={data}
              showModel={showModelCol}
              showSpring={showSpringCol}
              showPianki={showPiankiCol}
              commonBaseFoam={commonBaseFoam}
            />
          )}
        </section>
      )}

      {/* 3. Backrests table */}
      {backrests.length > 0 && (
        <section>
          <h3 className="text-base font-semibold mb-2">Oparcia</h3>
          <div className="rounded-md border border-border overflow-hidden">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-muted">
                  <th className="border border-border px-2 py-1 text-left">Kod</th>
                  {showModelCol && <th className="border border-border px-2 py-1 text-left">Modele</th>}
                  <th className="border border-border px-2 py-1 text-left">Stelaż</th>
                  <th className="border border-border px-2 py-1 text-left">Wysokość</th>
                  <th className="border border-border px-2 py-1 text-left">Sprężyna</th>
                  <th className="border border-border px-2 py-1 text-left">Pianki</th>
                </tr>
              </thead>
              <tbody>
                {backrestRows.map((row, i) => {
                  const isException = row.springType && row.springType !== seriesProps.default_spring;
                  return (
                    <tr key={i}>
                      <td className="border border-border px-2 py-1 font-mono font-bold">{row.code}</td>
                      {showModelCol && <td className="border border-border px-2 py-1">{row.models}</td>}
                      <td className="border border-border px-2 py-1">{row.frame}</td>
                      <td className="border border-border px-2 py-1">{row.height != null ? `${row.height} cm` : "—"}</td>
                      <td className={`border border-border px-2 py-1 ${isException ? "font-bold underline" : ""}`}>
                        {row.springType ?? "—"}
                      </td>
                      <td className="border border-border px-2 py-1 whitespace-pre-line">{row.foams}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* 4. Sides table */}
      {sides.length > 0 && (
        <section>
          <h3 className="text-base font-semibold mb-2">Boczki</h3>
          <div className="rounded-md border border-border overflow-hidden">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-muted">
                  <th className="border border-border px-2 py-1 text-left">Kod</th>
                  <th className="border border-border px-2 py-1 text-left">Nazwa (prod.)</th>
                  <th className="border border-border px-2 py-1 text-left">Stelaż</th>
                </tr>
              </thead>
              <tbody>
                {sides.map(s => (
                  <tr key={s.id}>
                    <td className="border border-border px-2 py-1 font-mono font-bold">{s.code}</td>
                    <td className="border border-border px-2 py-1">{s.name}</td>
                    <td className="border border-border px-2 py-1">{(s.properties as any)?.frame ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}

// ─── Sub-components ─────────────────────────────────────────────────

function InfoBox({
  seriesProps,
  singleFrame,
  singleSpring,
  commonBaseFoam,
}: {
  seriesProps: Record<string, any>;
  singleFrame: string | null;
  singleSpring: string | null;
  commonBaseFoam: ProductSpec | null;
}) {
  return (
    <div className="bg-muted rounded-lg p-6 grid grid-cols-2 gap-x-6 gap-y-2 text-base">
      <div><span className="text-muted-foreground">Kolekcja:</span> <strong>{seriesProps.collection ?? "—"}</strong></div>
      {singleFrame && (
        <div><span className="text-muted-foreground">Stelaż siedziska:</span> <strong>{singleFrame}</strong></div>
      )}
      {singleSpring && (
        <div><span className="text-muted-foreground">Sprężyna siedziska:</span> <strong>{singleSpring} (wszystkie modele)</strong></div>
      )}
      {commonBaseFoam && (
        <div><span className="text-muted-foreground">Pianka bazowa:</span> <strong>{foamLine(commonBaseFoam)}</strong></div>
      )}
      {seriesProps.fixed_backrest && (
        <div><span className="text-muted-foreground">Oparcie:</span> <strong>{seriesProps.fixed_backrest}</strong></div>
      )}
      {seriesProps.fixed_chest && (
        <div><span className="text-muted-foreground">Skrzynia:</span> <strong>{seriesProps.fixed_chest}</strong></div>
      )}
      {seriesProps.fixed_automat && (
        <div><span className="text-muted-foreground">Automat:</span> <strong>{seriesProps.fixed_automat}</strong></div>
      )}
    </div>
  );
}

function SeatsTable({
  seats,
  data,
  showModel,
  showSpring,
  showPianki,
  commonBaseFoam,
}: {
  seats: ProductRow[];
  data: SectionRendererProps["data"];
  showModel: boolean;
  showSpring: boolean;
  showPianki: boolean;
  commonBaseFoam: ProductSpec | null;
}) {
  const defaultSpring = ((data.seriesConfig as any)?.default_spring ?? "") as string;

  return (
    <div className="rounded-md border border-border overflow-hidden">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-muted">
            <th className="border border-border px-2 py-1 text-left">Kod</th>
            {showModel && <th className="border border-border px-2 py-1 text-left">Model</th>}
            <th className="border border-border px-2 py-1 text-left">Typ</th>
            {showSpring && <th className="border border-border px-2 py-1 text-left">Sprężyna</th>}
            <th className="border border-border px-2 py-1 text-left">Pianka frontu</th>
            {showPianki && <th className="border border-border px-2 py-1 text-left">Pianki</th>}
            <th className="border border-border px-2 py-1 text-left">
              <div>Pasek śr. dokleić</div>
              <div className="text-xs font-normal text-muted-foreground">1.5 × 19 × 50 T-21-25</div>
            </th>
          </tr>
        </thead>
        <tbody>
          {seats.map(seat => {
            const props = seat.properties as any;
            const specs = data.getSpecsForProduct(seat.id);
            const spring = data.getSpringForSeat(seat);
            const isSpringException = showSpring && spring !== defaultSpring;
            const isSet = props?.foam_set === true;

            // Get foams for this seat (with Dzielone fallback)
            const isDzielone = props?.seat_type === "Dzielone";
            let effectiveSpecs = specs;
            let isRef = false;
            let refCode: string | null = null;

            if (isDzielone && specs.filter(s => s.spec_type === "foam").length === 0) {
              const baseCode = seat.code.replace(/D$/, "");
              const baseSeat = data.getByCategory("seat").find(
                s => s.code === baseCode && s.series_id === seat.series_id
              );
              if (baseSeat) {
                effectiveSpecs = data.getSpecsForProduct(baseSeat.id);
                isRef = true;
                refCode = baseCode;
              }
            }

            const baseFoams = foamsByRole(effectiveSpecs, "base");
            const frontFoams = foamsByRole(effectiveSpecs, "front");

            // Front column
            const frontText = frontFoams.length > 0
              ? frontFoams.map(f => foamLine(f)).join("\n")
              : "—";

            // Pianki column
            let piankiText: string;
            if (isSet) {
              const capCount = baseFoams
                .filter(s => (s.name ?? "").toLowerCase().includes("czapa"))
                .reduce((sum, s) => sum + (s.quantity ?? 1), 0);
              piankiText = capCount > 0
                ? `Set pianek ${seat.code} (${capCount === 1 ? "1 czapa" : capCount + " czapy"})`
                : `Set pianek ${seat.code}`;
            } else {
              // Remove common base foam if extracted to info-box
              let displayBase = baseFoams;
              if (commonBaseFoam && displayBase.length > 0 && specsAreEqual(displayBase[0], commonBaseFoam)) {
                displayBase = displayBase.slice(1);
              }
              if (displayBase.length > 0) {
                piankiText = displayBase.map(f => foamLine(f)).join("\n");
              } else {
                piankiText = "—";
              }
              if (isRef) {
                piankiText = piankiText !== "—" ? `${piankiText}\n(jak ${refCode} + pasek)` : `(jak ${refCode} + pasek)`;
              }
            }

            return (
              <tr key={seat.id}>
                <td className="border border-border px-2 py-1 font-mono font-bold">{seat.code}</td>
                {showModel && <td className="border border-border px-2 py-1">{props?.model_name ?? "—"}</td>}
                <td className="border border-border px-2 py-1">{props?.seat_type ?? "—"}</td>
                {showSpring && (
                  <td className={`border border-border px-2 py-1 ${isSpringException ? "font-bold underline" : ""}`}>
                    {spring}
                  </td>
                )}
                <td className="border border-border px-2 py-1 whitespace-pre-line">{frontText}</td>
                {showPianki && <td className="border border-border px-2 py-1 whitespace-pre-line">{piankiText}</td>}
                <td className="border border-border px-2 py-1 text-center">
                  {props?.center_strip ? <strong>TAK</strong> : "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── Grouping helpers ───────────────────────────────────────────────

function groupByFrame(seats: ProductRow[]): { frame: string; seats: ProductRow[] }[] {
  const groups: Map<string, ProductRow[]> = new Map();
  for (const s of seats) {
    const frame = (s.properties as any)?.frame ?? "Brak";
    const list = groups.get(frame) ?? [];
    list.push(s);
    groups.set(frame, list);
  }
  return Array.from(groups.entries()).map(([frame, seatList]) => ({ frame, seats: seatList }));
}

interface BackrestRow {
  code: string;
  models: string;
  frame: string;
  height: number | null;
  springType: string | null;
  foams: string;
}

function buildBackrestRows(
  backrests: ProductRow[],
  data: SectionRendererProps["data"],
  defaultSpring: string | undefined
): BackrestRow[] {
  const rows: BackrestRow[] = [];
  const processed: Map<string, BackrestRow> = new Map();

  for (const b of backrests) {
    const props = b.properties as any;
    const specs = data.getSpecsForProduct(b.id).filter(s => s.spec_type === "foam");
    const foamsStr = specs
      .sort((a, c) => (a.position_number ?? 0) - (c.position_number ?? 0))
      .map(f => foamLine(f))
      .join("\n") || "—";

    const springType = props?.spring_type ?? null;
    const key = `${b.code}|${foamsStr}|${springType}`;

    const existing = processed.get(key);
    if (existing) {
      const model = props?.model_name ?? "";
      if (model && !existing.models.includes(model)) {
        existing.models += ` / ${model}`;
      }
    } else {
      const row: BackrestRow = {
        code: b.code,
        models: props?.model_name ?? "—",
        frame: props?.frame ?? "—",
        height: props?.height_cm != null ? Number(props.height_cm) : null,
        springType,
        foams: foamsStr,
      };
      processed.set(key, row);
      rows.push(row);
    }
  }

  return rows;
}
