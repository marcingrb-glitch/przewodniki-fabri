import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { SectionRendererProps, ProductRow, ProductSpec } from "../types";
import { NoData } from "../shared/NoData";
import { formatColors } from "../shared/helpers";
import { SkuVisualizer, EXAMPLE_SKUS } from "../shared/SkuVisualizer";

// ─── helpers (reused from WarehouseFullRenderer) ────────────────────

function foamDims(f: ProductSpec): string {
  if (f.height == null && f.width == null && f.length == null) return "—";
  return `${f.height ?? "?"}×${f.width ?? "?"}×${f.length ?? "?"}`;
}

function foamLine(f: ProductSpec): string {
  const dims = foamDims(f);
  const qty = (f.quantity ?? 1) > 1 ? `${f.quantity}× ` : "";
  const label = f.name ? `${f.name} ` : "";
  return `${label}${qty}${dims}`.trim();
}

function specsAreEqual(a: ProductSpec, b: ProductSpec): boolean {
  return a.height === b.height && a.width === b.width && a.length === b.length && a.material === b.material;
}

function foamsByRole(specs: ProductSpec[], role: string): ProductSpec[] {
  return specs
    .filter(s => s.spec_type === "foam" && (s as any).foam_role === role)
    .sort((a, b) => (a.position_number ?? 0) - (b.position_number ?? 0));
}

function naturalSort(items: ProductRow[]): ProductRow[] {
  return [...items].sort((a, b) => {
    const codeA = a.code.replace(/^[A-Z]+/, "");
    const codeB = b.code.replace(/^[A-Z]+/, "");
    return codeA.localeCompare(codeB, undefined, { numeric: true });
  });
}

function computeShowPiankiCol(
  seats: ProductRow[],
  data: SectionRendererProps["data"],
  commonBaseFoam: ProductSpec | null
): boolean {
  return seats.some(seat => {
    const props = seat.properties as any;
    const specs = data.getSpecsForProduct(seat.id);
    if (props?.foam_set === true) return true;
    const isDzielone = props?.seat_type === "Dzielone";
    let effectiveSpecs = specs;
    if (isDzielone && specs.filter(s => s.spec_type === "foam").length === 0) {
      const baseCode = seat.code.replace(/D$/, "");
      const baseSeat = data.getByCategory("seat").find(s => s.code === baseCode && s.series_id === seat.series_id);
      if (baseSeat) effectiveSpecs = data.getSpecsForProduct(baseSeat.id);
    }
    const baseFoams = foamsByRole(effectiveSpecs, "base");
    let displayBase = baseFoams;
    if (commonBaseFoam && displayBase.length > 0 && specsAreEqual(displayBase[0], commonBaseFoam)) {
      displayBase = displayBase.slice(1);
    }
    return displayBase.length > 0;
  });
}

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
  allowedFinishes: string;
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
        allowedFinishes: (b.allowed_finishes ?? []).join(", ") || "—",
      };
      processed.set(key, row);
      rows.push(row);
    }
  }
  return rows;
}

// ─── Main component ─────────────────────────────────────────────────

export function KierownikFullRenderer({ data }: SectionRendererProps) {
  const seats = naturalSort(data.getByCategory("seat"));
  const backrests = naturalSort(data.getByCategory("backrest"));
  const sides = naturalSort(data.getByCategory("side"));
  const seriesProps = (data.seriesProduct?.properties ?? {}) as Record<string, any>;

  if (!data.seriesProduct) return <NoData label="dane serii" />;

  // Column visibility flags
  const allFrames = [...new Set(seats.map(s => (s.properties as any)?.frame).filter(Boolean))];
  const singleFrame = allFrames.length === 1 ? allFrames[0] : null;
  const allSprings = seats.map(s => data.getSpringForSeat(s));
  const uniqueSprings = [...new Set(allSprings)];
  const singleSpring = uniqueSprings.length === 1 ? uniqueSprings[0] : null;

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

  const allModels = seats.map(s => (s.properties as any)?.model_name).filter(Boolean);
  const uniqueModels = [...new Set(allModels)];
  const showModelCol = uniqueModels.length > 1;
  const showSpringCol = uniqueSprings.length > 1;
  const showPiankiCol = computeShowPiankiCol(seats, data, commonBaseFoam);
  const frameGroups = groupByFrame(seats);
  const multipleFrameGroups = frameGroups.length > 1;
  const defaultSpring = seriesProps.default_spring ?? "";
  const backrestRows = buildBackrestRows(backrests, data, defaultSpring);

  // Seats with >1 finish (for warnings)
  const seatsWithMultipleFinishes = seats.filter(s => (s.allowed_finishes ?? []).length > 1);

  // Chests
  const allowedChestCodes = data.getAllowedChestCodes();
  const chests = data.getByCategory("chest").filter(c => allowedChestCodes.includes(c.code));

  // Automats
  const automatConfigs = data.getRelationsByType("automat_config");
  const allProducts = [...data.seriesComponents, ...data.globalProducts];

  // Legs
  const config = data.seriesConfig;
  const seatLegType = config?.seat_leg_type ?? "from_sku";
  const pufaLegType = config?.pufa_leg_type ?? "from_sku";
  const seatLegH = config?.seat_leg_height_cm;
  const pufaLegH = config?.pufa_leg_height_cm;

  // Pillows
  const pillowMaps = data.getRelationsByType("seat_pillow_map");
  const jasieki = naturalSort(data.getByCategory("jasiek"));
  const walki = naturalSort(data.getByCategory("walek"));

  return (
    <div className="space-y-8">
      {/* 1. Legends */}
      <LegendsSection data={data} />

      {/* 2. Fabrics */}
      <FabricsSection data={data} />

      {/* 3. Seats */}
      {seats.length > 0 && (
        <section>
          <h3 className="text-base font-bold mb-2">Siedziska</h3>
          <div className="bg-muted rounded-lg p-4 grid grid-cols-2 gap-x-6 gap-y-1 text-sm mb-3">
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
          </div>
          {!showPiankiCol && (
            <p className="text-sm text-muted-foreground mb-2">
              Pianka bazowa identyczna — różni się tylko front.
            </p>
          )}
          {multipleFrameGroups ? (
            <div className="space-y-4">
              {frameGroups.map(group => {
                const hasException = group.seats.some(s => data.getSpringForSeat(s) !== defaultSpring);
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
                      defaultSpring={defaultSpring}
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
              defaultSpring={defaultSpring}
            />
          )}

          {/* Finish warnings under seats */}
          {seatsWithMultipleFinishes.length > 0 && (
            <div className="mt-2 space-y-1">
              <p className="font-bold underline">
                Wykończenie poduszek / jaśków / wałków = DZIEDZICZONE od siedziska!
              </p>
              {seatsWithMultipleFinishes.map(s => (
                <p key={s.id} className="font-bold underline">
                  ⚠️ {s.code} ({(s.properties as any)?.model_name ?? "—"}) — dozwolone: {(s.allowed_finishes ?? []).join(", ")} — uwaga na różne rysunki!
                </p>
              ))}
            </div>
          )}
        </section>
      )}

      {/* 4. Sides */}
      {sides.length > 0 && (
        <section>
          <h3 className="text-base font-bold mb-2">Boczki</h3>
          <div className="rounded-md border border-border overflow-hidden">
            <table className="w-full text-sm border-collapse table-fixed">
              <thead>
                <tr className="bg-muted">
                  <th className="border border-border px-2 py-1 text-left">Kod</th>
                  <th className="border border-border px-2 py-1 text-left">Nazwa (prod.)</th>
                  <th className="border border-border px-2 py-1 text-left">Stelaż</th>
                  <th className="border border-border px-2 py-1 text-left">Dozwolone szwy</th>
                  <th className="border border-border px-2 py-1 text-left">Uwagi</th>
                </tr>
              </thead>
              <tbody>
                {sides.map(s => (
                  <tr key={s.id}>
                    <td className="border border-border px-2 py-1 font-mono font-bold">{s.code}</td>
                    <td className="border border-border px-2 py-1">{s.name}</td>
                    <td className="border border-border px-2 py-1">{(s.properties as any)?.frame ?? "—"}</td>
                    <td className="border border-border px-2 py-1">{(s.allowed_finishes ?? []).join(", ") || "—"}</td>
                    <td className="border border-border px-2 py-1">{(s.properties as any)?.production_notes ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* 5. Backrests */}
      {backrests.length > 0 && (
        <section>
          <h3 className="text-base font-bold mb-2">Oparcia</h3>
          <div className="rounded-md border border-border overflow-hidden">
            <table className="w-full text-sm border-collapse table-fixed">
              <thead>
                <tr className="bg-muted">
                  <th className="border border-border px-2 py-1 text-left">Kod</th>
                  {showModelCol && <th className="border border-border px-2 py-1 text-left">Modele</th>}
                  <th className="border border-border px-2 py-1 text-left">Stelaż</th>
                  <th className="border border-border px-2 py-1 text-left">Wysokość</th>
                  <th className="border border-border px-2 py-1 text-left">Sprężyna</th>
                  <th className="border border-border px-2 py-1 text-left">Pianki</th>
                  <th className="border border-border px-2 py-1 text-left">Dozwolone szwy</th>
                </tr>
              </thead>
              <tbody>
                {backrestRows.map((row, i) => {
                  const isException = row.springType && row.springType !== defaultSpring;
                  return (
                    <tr key={i}>
                      <td className="border border-border px-2 py-1 font-mono font-bold">{row.code}</td>
                      {showModelCol && <td className="border border-border px-2 py-1">{row.models}</td>}
                      <td className="border border-border px-2 py-1">{row.frame}</td>
                      <td className="border border-border px-2 py-1">{row.height != null ? `${row.height} cm` : "—"}</td>
                      <td className={`border border-border px-2 py-1 ${isException ? "font-bold underline" : ""}`}>
                        {row.springType ?? "—"}
                      </td>
                      <td className="border border-border px-2 py-1 whitespace-pre-line break-words">{row.foams}</td>
                      <td className="border border-border px-2 py-1 break-words">{row.allowedFinishes}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* 6. Chests */}
      {chests.length > 0 && (
        <section>
          <h3 className="text-base font-bold mb-2">Skrzynie</h3>
          <div className="rounded-md border border-border overflow-hidden">
            <table className="w-full text-sm border-collapse table-fixed">
              <thead>
                <tr className="bg-muted">
                  <th className="border border-border px-2 py-1 text-left">Kod</th>
                  <th className="border border-border px-2 py-1 text-left">Nazwa</th>
                  <th className="border border-border px-2 py-1 text-left">Wys. nóżek</th>
                </tr>
              </thead>
              <tbody>
                {chests.map(c => (
                  <tr key={c.id}>
                    <td className="border border-border px-2 py-1 font-mono font-bold">{c.code}</td>
                    <td className="border border-border px-2 py-1">{c.name}</td>
                    <td className="border border-border px-2 py-1">
                      {(c.properties as any)?.leg_height_cm != null ? `${(c.properties as any).leg_height_cm}cm` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* 7. Automats */}
      {automatConfigs.length > 0 && (
        <section>
          <h3 className="text-base font-bold mb-2">Automaty</h3>
          <div className="rounded-md border border-border overflow-hidden">
            <table className="w-full text-sm border-collapse table-fixed">
              <thead>
                <tr className="bg-muted">
                  <th className="border border-border px-2 py-1 text-left">Kod</th>
                  <th className="border border-border px-2 py-1 text-left">Nazwa</th>
                  <th className="border border-border px-2 py-1 text-left">Nóżki siedziska</th>
                  <th className="border border-border px-2 py-1 text-left">Śruby zamkowe</th>
                </tr>
              </thead>
              <tbody>
                {automatConfigs.map((rel: any) => {
                  const props = rel.properties as any;
                  const automat = data.globalProducts.find(p => p.id === rel.source_product_id);
                  const code = automat?.code ?? "?";
                  const name = automat?.name ?? "?";
                  const seriesCode = data.seriesProduct?.code ?? "";
                  const sruby = code === "AT1" ? "Poz. 1 i 2"
                    : code === "AT2" && seriesCode === "S1" ? "Poz. 1 i 3"
                    : code === "AT2" ? "Poz. 1 i 2" : "—";
                  return (
                    <tr key={rel.id}>
                      <td className="border border-border px-2 py-1 font-mono font-bold">{code}</td>
                      <td className="border border-border px-2 py-1">{name}</td>
                      <td className="border border-border px-2 py-1">
                        {props?.has_seat_legs ? `Tak, ${props?.seat_leg_count ?? "?"}szt, H = ${props?.seat_leg_height_cm ?? "?"}cm` : "Nie"}
                      </td>
                      <td className="border border-border px-2 py-1">{sruby}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* 8. Legs */}
      <LegsSection data={data} config={config} />

      {/* 9. Pillows, Jaśki, Wałki */}
      <PillowsSection
        data={data}
        pillowMaps={pillowMaps}
        jasieki={jasieki}
        walki={walki}
      />
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────

function LegendsSection({ data }: { data: SectionRendererProps["data"] }) {
  const finishes = data.getByCategory("finish");

  // Load SKU segments for sofa
  const { data: productTypes = [] } = useQuery({
    queryKey: ["kierownik-product-types"],
    queryFn: async () => {
      const { data } = await supabase
        .from("product_types")
        .select("id, code")
        .eq("code", "sofa")
        .limit(1);
      return data ?? [];
    },
  });

  const sofaTypeId = productTypes.find(pt => pt.code === "sofa")?.id;

  const { data: skuSegments = [] } = useQuery({
    queryKey: ["kierownik-sku-segments", sofaTypeId],
    queryFn: async () => {
      if (!sofaTypeId) return [];
      const { data } = await supabase
        .from("sku_segments")
        .select("*")
        .eq("product_type_id", sofaTypeId)
        .order("position");
      return data ?? [];
    },
    enabled: !!sofaTypeId,
  });

  const exampleSku = EXAMPLE_SKUS.sofa;

  return (
    <div className="space-y-4">
      <div className="border-2 border-border rounded p-3">
        <p className="text-sm font-semibold mb-2">LEGENDA SKU</p>
        {skuSegments.length > 0 ? (
          <SkuVisualizer sku={exampleSku} segments={skuSegments} />
        ) : (
          <p className="text-xs text-muted-foreground">Ładowanie...</p>
        )}
      </div>
      <div className="border-2 border-border rounded p-3 flex items-center">
        {finishes.length > 0 ? (
          <p className="text-sm font-bold">
            LEGENDA WYKOŃCZEŃ: {finishes.map(f => `${f.code} = ${f.name}`).join(" | ")}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">Brak wykończeń</p>
        )}
      </div>
    </div>
  );
}

function FabricsSection({ data }: { data: SectionRendererProps["data"] }) {
  const fabrics = data.getByCategory("fabric");
  if (fabrics.length === 0) return null;

  return (
    <section>
      <h3 className="text-base font-bold mb-2">Tkaniny</h3>
      <div className="rounded-md border border-border overflow-hidden">
        <table className="w-full text-sm border-collapse table-fixed">
          <thead>
            <tr className="bg-muted">
              <th className="border border-border px-2 py-1 text-left">Kod</th>
              <th className="border border-border px-2 py-1 text-left">Nazwa</th>
              <th className="border border-border px-2 py-1 text-left">Grupa</th>
              <th className="border border-border px-2 py-1 text-left">Kolory</th>
            </tr>
          </thead>
          <tbody>
            {fabrics.map(f => (
              <tr key={f.id}>
                <td className="border border-border px-2 py-1 font-mono font-bold">{f.code}</td>
                <td className="border border-border px-2 py-1">{f.name}</td>
                <td className="border border-border px-2 py-1">{(f.properties as any)?.price_group ?? "—"}</td>
                <td className="border border-border px-2 py-1 text-xs break-words">{formatColors(f.colors)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function SeatsTable({
  seats,
  data,
  showModel,
  showSpring,
  showPianki,
  commonBaseFoam,
  defaultSpring,
}: {
  seats: ProductRow[];
  data: SectionRendererProps["data"];
  showModel: boolean;
  showSpring: boolean;
  showPianki: boolean;
  commonBaseFoam: ProductSpec | null;
  defaultSpring: string;
}) {
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
            <th className="border border-border px-2 py-1 text-left">Dozwolone szwy</th>
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
            const frontText = frontFoams.length > 0
              ? frontFoams.map(f => foamLine(f)).join("\n")
              : "—";

            let piankiText: string;
            if (isSet) {
              const capCount = baseFoams
                .filter(s => (s.name ?? "").toLowerCase().includes("czapa"))
                .reduce((sum, s) => sum + (s.quantity ?? 1), 0);
              piankiText = capCount > 0
                ? `Set pianek ${seat.code} (${capCount === 1 ? "1 czapa" : capCount + " czapy"})`
                : `Set pianek ${seat.code}`;
            } else {
              let displayBase = baseFoams;
              if (commonBaseFoam && displayBase.length > 0 && specsAreEqual(displayBase[0], commonBaseFoam)) {
                displayBase = displayBase.slice(1);
              }
              piankiText = displayBase.length > 0 ? displayBase.map(f => foamLine(f)).join("\n") : "—";
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
                <td className="border border-border px-2 py-1">
                  {(seat.allowed_finishes ?? []).join(", ") || "—"}
                </td>
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

function LegsSection({ data, config }: { data: SectionRendererProps["data"]; config: any }) {
  if (!config) return null;

  const seatLegType = config.seat_leg_type ?? "from_sku";
  const pufaLegType = config.pufa_leg_type ?? "from_sku";
  const seatLegH = config.seat_leg_height_cm;
  const pufaLegH = config.pufa_leg_height_cm;
  const allowedChestCodes = data.getAllowedChestCodes();
  const chests = data.getByCategory("chest").filter(c => allowedChestCodes.includes(c.code));
  const automatConfigs = data.getRelationsByType("automat_config");
  const extras = data.getByCategory("extra");
  const hasPufa = extras.some(e => e.code === "PF" || e.code === "PFO");
  const hasFotel = extras.some(e => e.code === "FT");

  interface CheatRow {
    element: string;
    detail: string;
    type: string;
    height: string;
    count: string;
    reason?: string;
  }

  const doRows: CheatRow[] = [];
  const dontRows: CheatRow[] = [];

  for (const c of chests) {
    const legH = Number((c.properties as any)?.leg_height_cm ?? 0);
    const legCount = Number((c.properties as any)?.leg_count ?? 4);
    if (legH > 2.5) {
      doRows.push({ element: "Pod skrzynią", detail: `${c.code} (${c.name})`, type: "N z SKU", height: `H${legH}cm`, count: `${legCount}szt` });
    } else if (legH > 0) {
      dontRows.push({ element: "Pod skrzynią", detail: `${c.code} (${c.name})`, type: "N4 plastikowe", height: `${legH}cm`, count: `${legCount}szt`, reason: "tapicer ma na stanowisku" });
    } else {
      dontRows.push({ element: "Pod skrzynią", detail: `${c.code} (${c.name})`, type: "BRAK", height: "—", count: "—", reason: "brak nóżek" });
    }
  }

  const allProducts = [...data.seriesComponents, ...data.globalProducts];
  for (const rel of automatConfigs) {
    const props = rel.properties as any;
    const automatProduct = allProducts.find(p => p.id === rel.source_product_id);
    const aCode = automatProduct?.code ?? props?.automat_code ?? "?";
    const aName = automatProduct?.name ?? "";
    const suffix = aName ? `${aCode} (${aName})` : aCode;
    if (!props?.has_seat_legs) {
      dontRows.push({ element: "Pod siedziskiem", detail: "", type: "BRAK", height: "—", count: "—", reason: `gdy automat ${suffix}` });
    } else if (seatLegType === "from_sku") {
      doRows.push({ element: "Pod siedziskiem", detail: "", type: "N z SKU", height: `H${props?.seat_leg_height_cm ?? seatLegH ?? "?"}cm`, count: `${props?.seat_leg_count ?? 2}szt`, reason: `tylko gdy automat ${aCode}` });
    } else {
      dontRows.push({ element: "Pod siedziskiem", detail: "", type: "N4 plastikowe", height: "2.5cm", count: `${props?.seat_leg_count ?? 2}szt`, reason: "tapicer ma na stanowisku" });
    }
  }

  if (hasPufa) {
    const pufaLegCount = config.pufa_leg_count ?? 4;
    if (pufaLegType === "from_sku") {
      doRows.push({ element: "Pufa", detail: "", type: "N z SKU", height: `H${pufaLegH ?? "?"}cm`, count: `${pufaLegCount}szt` });
    } else {
      dontRows.push({ element: "Pufa", detail: "", type: "N4 plastikowe", height: "2.5cm", count: `${pufaLegCount}szt`, reason: "tapicer ma na stanowisku" });
    }
  }

  if (hasFotel) {
    const fotelLegH = config.fotel_leg_height_cm ?? 15;
    const fotelLegCount = config.fotel_leg_count ?? 4;
    doRows.push({ element: "Fotel", detail: "", type: "N z SKU", height: `H${fotelLegH}cm`, count: `${fotelLegCount}szt` });
  }

  const allPlastic = doRows.length === 0 && dontRows.length > 0 && dontRows.every(r => r.type.includes("plastikowe") || r.type === "BRAK");
  const legs = data.getByCategory("leg").filter(p => p.is_global);

  return (
    <section>
      <h3 className="text-base font-bold mb-2">Nóżki</h3>
      {allPlastic ? (
        <div className="border-2 border-foreground rounded-lg p-6">
          <p className="text-lg font-bold mb-2">NÓŻKI — NIE KOMPLETOWAĆ</p>
          <p>
            Wszystkie nóżki w tej serii to <strong>{dontRows.find(r => r.type.includes("plastikowe"))?.type ?? "N4 plastikowe"} {dontRows.find(r => r.type.includes("plastikowe"))?.height ?? "2.5cm"}</strong>.
          </p>
          <p className="mt-2">
            Tapicer montuje na stanowisku. <strong>Nie kompletować.</strong>
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {doRows.length > 0 && (
            <div>
              <p className="font-bold mb-2">🟢 CO KOMPLETOWAĆ</p>
              <div className="space-y-1 text-sm">
                {doRows.map((r, i) => (
                  <div key={i} className="border border-border p-2 rounded">
                    <strong>{r.element}{r.detail ? ` ${r.detail}` : ""}:</strong> {r.type}, {r.height}, {r.count}{r.reason ? ` — ${r.reason}` : ""}
                  </div>
                ))}
              </div>
            </div>
          )}
          {dontRows.length > 0 && (
            <div className="border-4 border-foreground rounded-lg p-4">
              <p className="text-lg font-black mb-2">🔴 CZEGO NIE KOMPLETOWAĆ!</p>
              <div className="space-y-1 text-base font-bold">
                {dontRows.map((r, i) => (
                  <p key={i}>
                    ❌ {r.element}{r.detail ? ` ${r.detail}` : ""}: {r.type}{r.height !== "—" ? `, ${r.height}` : ""}{r.count !== "—" ? `, ${r.count}` : ""} — {r.reason}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {!allPlastic && legs.length > 0 && (
        <div className="mt-4">
          <p className="text-sm font-semibold mb-2">📋 Typy nóżek</p>
          <div className="rounded-md border border-border overflow-hidden">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-muted">
                  <th className="border border-border px-2 py-1 text-left">Kod</th>
                  <th className="border border-border px-2 py-1 text-left">Nazwa</th>
                  <th className="border border-border px-2 py-1 text-left">Materiał</th>
                  <th className="border border-border px-2 py-1 text-left">Kolory</th>
                </tr>
              </thead>
              <tbody>
                {legs.map(leg => (
                  <tr key={leg.id}>
                    <td className="border border-border px-2 py-1 font-mono font-bold">{leg.code}</td>
                    <td className="border border-border px-2 py-1">{leg.name}</td>
                    <td className="border border-border px-2 py-1">{(leg.properties as any)?.material ?? "—"}</td>
                    <td className="border border-border px-2 py-1 text-xs">{formatColors(leg.colors)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}

function PillowsSection({
  data,
  pillowMaps,
  jasieki,
  walki,
}: {
  data: SectionRendererProps["data"];
  pillowMaps: any[];
  jasieki: ProductRow[];
  walki: ProductRow[];
}) {
  const allProducts = [...data.seriesComponents, ...data.globalProducts];
  const findProduct = (id: string | null) => allProducts.find(p => p.id === id);
  const findCode = (id: string | null) => findProduct(id)?.code ?? "?";

  const hasPillows = pillowMaps.length > 0;
  const hasJasieki = jasieki.length > 0;
  const hasWalki = walki.length > 0;

  if (!hasPillows && !hasJasieki && !hasWalki) return null;

  const resolved = pillowMaps.map((rel: any) => {
    const pillowProduct = findProduct(rel.target_product_id);
    const pillowProps = (pillowProduct?.properties ?? {}) as Record<string, any>;
    const shortName = (pillowProduct?.name ?? "—").replace(/^Poduszka\s*/i, "");
    return {
      id: rel.id,
      seatCode: findCode(rel.source_product_id),
      pillowCode: findCode(rel.target_product_id),
      pillowName: shortName || "—",
      sewingTechnique: pillowProps.sewing_technique ?? "—",
    };
  });

  return (
    <section>
      <h3 className="text-base font-bold mb-2">Poduszki, jaśki, wałki</h3>

      {hasPillows && (
        <div className="mb-4">
          <p className="text-sm font-semibold mb-1">Mapowanie poduszek per siedzisko</p>
          <div className="rounded-md border border-border overflow-hidden">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-muted">
                  <th className="border border-border px-2 py-1 text-left">Siedzisko</th>
                  <th className="border border-border px-2 py-1 text-left">Poduszka</th>
                  <th className="border border-border px-2 py-1 text-left">Typ</th>
                  <th className="border border-border px-2 py-1 text-left">Szycie</th>
                </tr>
              </thead>
              <tbody>
                {resolved.map(m => (
                  <tr key={m.id}>
                    <td className="border border-border px-2 py-1 font-mono">{m.seatCode}</td>
                    <td className="border border-border px-2 py-1">{m.pillowCode}</td>
                    <td className="border border-border px-2 py-1">{m.pillowName}</td>
                    <td className="border border-border px-2 py-1">{m.sewingTechnique}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {(hasJasieki || hasWalki) && (
        <div className="mb-2">
          <p className="text-sm font-semibold mb-1">Jaśki i wałki</p>
          <div className="rounded-md border border-border overflow-hidden">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-muted">
                  <th className="border border-border px-2 py-1 text-left">Kod</th>
                  <th className="border border-border px-2 py-1 text-left">Nazwa</th>
                  <th className="border border-border px-2 py-1 text-left">Dostępność</th>
                </tr>
              </thead>
              <tbody>
                {[...jasieki, ...walki].map(item => (
                  <tr key={item.id}>
                    <td className="border border-border px-2 py-1 font-mono font-bold">{item.code}</td>
                    <td className="border border-border px-2 py-1">{item.name}</td>
                    <td className="border border-border px-2 py-1">{item.active ? "Aktywny" : "Nieaktywny"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Wykończenie jaśków i wałków = takie samo jak poduszka oparciowa.
          </p>
        </div>
      )}
    </section>
  );
}
