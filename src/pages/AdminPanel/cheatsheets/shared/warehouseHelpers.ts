import type { CheatsheetData, ProductRow, ProductSpec } from "../types";
import type {
  CheatsheetPdfData,
  CheatsheetSeatRow,
  CheatsheetBackrestRow,
  CheatsheetSideRow,
} from "@/utils/pdfGenerators/cheatsheetPdf";

// ─── Foam helpers (shared with WarehouseFullRenderer) ───────────────

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

// ─── Build PDF data ─────────────────────────────────────────────────

export function buildCheatsheetPdfData(data: CheatsheetData): CheatsheetPdfData | null {
  if (!data.seriesProduct) return null;

  const seriesProps = (data.seriesProduct.properties ?? {}) as Record<string, any>;
  const seats = data.getByCategory("seat");
  const backrests = data.getByCategory("backrest");
  const sides = data.getByCategory("side");

  // ── Frame / Spring logic ──
  const allFrames = [...new Set(seats.map(s => (s.properties as any)?.frame).filter(Boolean))];
  const singleFrame = allFrames.length === 1 ? allFrames[0] : null;

  const allSprings = seats.map(s => data.getSpringForSeat(s));
  const uniqueSprings = [...new Set(allSprings)];
  const singleSpring = uniqueSprings.length === 1 ? uniqueSprings[0] : null;

  // ── Common base foam ──
  const nonSetSeats = seats.filter(s => {
    const p = s.properties as any;
    return p?.foam_set !== true && p?.seat_type !== "Dzielone";
  });
  let commonBaseFoamSpec: ProductSpec | null = null;
  if (nonSetSeats.length > 0) {
    const firstBaseAll = nonSetSeats.map(s => foamsByRole(data.getSpecsForProduct(s.id), "base")[0]).filter(Boolean);
    if (firstBaseAll.length === nonSetSeats.length && firstBaseAll.every(f => specsAreEqual(f, firstBaseAll[0]))) {
      commonBaseFoamSpec = firstBaseAll[0];
    }
  }

  // ── Columns visibility ──
  const allModels = seats.map(s => (s.properties as any)?.model_name).filter(Boolean);
  const showModelCol = [...new Set(allModels)].length > 1;
  const showSpringCol = uniqueSprings.length > 1;

  // ── showPiankiCol ──
  const showPiankiCol = seats.some(seat => {
    const props = seat.properties as any;
    if (props?.foam_set === true) return true;
    const isDzielone = props?.seat_type === "Dzielone";
    let effectiveSpecs = data.getSpecsForProduct(seat.id);
    if (isDzielone && effectiveSpecs.filter(s => s.spec_type === "foam").length === 0) {
      const baseCode = seat.code.replace(/D$/, "");
      const baseSeat = data.getByCategory("seat").find(s => s.code === baseCode && s.series_id === seat.series_id);
      if (baseSeat) effectiveSpecs = data.getSpecsForProduct(baseSeat.id);
    }
    const baseFoams = foamsByRole(effectiveSpecs, "base");
    let displayBase = baseFoams;
    if (commonBaseFoamSpec && displayBase.length > 0 && specsAreEqual(displayBase[0], commonBaseFoamSpec)) {
      displayBase = displayBase.slice(1);
    }
    return displayBase.length > 0 || isDzielone;
  });

  // ── Build seat rows ──
  const defaultSpring = seriesProps.default_spring ?? "";
  const seatRows: CheatsheetSeatRow[] = seats.map(seat => {
    const props = seat.properties as any;
    const specs = data.getSpecsForProduct(seat.id);
    const spring = data.getSpringForSeat(seat);
    const isSet = props?.foam_set === true;
    const isDzielone = props?.seat_type === "Dzielone";

    let effectiveSpecs = specs;
    let isRef = false;
    let refCode: string | null = null;
    if (isDzielone && specs.filter(s => s.spec_type === "foam").length === 0) {
      const baseCode = seat.code.replace(/D$/, "");
      const baseSeat = data.getByCategory("seat").find(s => s.code === baseCode && s.series_id === seat.series_id);
      if (baseSeat) { effectiveSpecs = data.getSpecsForProduct(baseSeat.id); isRef = true; refCode = baseCode; }
    }

    const baseFoams = foamsByRole(effectiveSpecs, "base");
    const frontFoams = foamsByRole(effectiveSpecs, "front");
    const frontText = frontFoams.length > 0 ? frontFoams.map(f => foamLine(f)).join("\n") : "—";

    let piankiText: string;
    if (isSet) {
      const capCount = baseFoams.filter(s => (s.name ?? "").toLowerCase().includes("czapa")).reduce((sum, s) => sum + (s.quantity ?? 1), 0);
      piankiText = capCount > 0 ? `Set pianek ${seat.code} (${capCount === 1 ? "1 czapa" : capCount + " czapy"})` : `Set pianek ${seat.code}`;
    } else {
      let displayBase = baseFoams;
      if (commonBaseFoamSpec && displayBase.length > 0 && specsAreEqual(displayBase[0], commonBaseFoamSpec)) {
        displayBase = displayBase.slice(1);
      }
      piankiText = displayBase.length > 0 ? displayBase.map(f => foamLine(f)).join("\n") : "—";
      if (isRef) piankiText = piankiText !== "—" ? `${piankiText}\n(jak ${refCode} + pasek)` : `(jak ${refCode} + pasek)`;
    }

    return {
      code: seat.code,
      model: props?.model_name ?? undefined,
      type: props?.seat_type ?? "—",
      spring,
      isSpringException: spring !== defaultSpring,
      frontFoams: frontText,
      pianki: piankiText,
      centerStrip: !!props?.center_strip,
    };
  });

  // ── Frame groups (S2-style) ──
  const frameGroupsMap = new Map<string, number[]>();
  seats.forEach((s, i) => {
    const frame = (s.properties as any)?.frame ?? "Brak";
    const list = frameGroupsMap.get(frame) ?? [];
    list.push(i);
    frameGroupsMap.set(frame, list);
  });
  const seatGroups = frameGroupsMap.size > 1
    ? Array.from(frameGroupsMap.entries()).map(([frame, indices]) => ({ frame, seatIndices: indices }))
    : null;

  // ── Backrest rows ──
  const processed = new Map<string, CheatsheetBackrestRow & { _models: string[] }>();
  const backrestRows: CheatsheetBackrestRow[] = [];
  for (const b of backrests) {
    const props = b.properties as any;
    const specs = data.getSpecsForProduct(b.id).filter(s => s.spec_type === "foam");
    const foamsStr = specs.sort((a, c) => (a.position_number ?? 0) - (c.position_number ?? 0)).map(f => foamLine(f)).join("\n") || "—";
    const springType = props?.spring_type ?? "";
    const key = `${b.code}|${foamsStr}|${springType}`;
    const existing = processed.get(key);
    if (existing) {
      const model = props?.model_name ?? "";
      if (model && !existing._models.includes(model)) {
        existing._models.push(model);
        existing.models = existing._models.join(" / ");
      }
    } else {
      const row = {
        code: b.code,
        models: props?.model_name ?? "—",
        _models: [props?.model_name ?? ""],
        frame: props?.frame ?? "—",
        height: props?.height_cm != null ? `${props.height_cm} cm` : "—",
        springType,
        isSpringException: !!springType && springType !== defaultSpring,
        foams: foamsStr,
      };
      processed.set(key, row);
      backrestRows.push(row);
    }
  }

  // ── Sides ──
  const sideRows: CheatsheetSideRow[] = sides.map(s => ({
    code: s.code,
    name: s.name,
    frame: (s.properties as any)?.frame ?? "—",
  }));

  return {
    seriesCode: data.seriesProduct.code,
    seriesName: data.seriesProduct.name,
    collection: seriesProps.collection ?? "—",
    seatFrame: singleFrame,
    seatSpring: singleSpring ? `${singleSpring} (wszystkie modele)` : null,
    commonBaseFoam: commonBaseFoamSpec ? foamLine(commonBaseFoamSpec) : null,
    fixedBackrest: seriesProps.fixed_backrest ?? null,
    fixedChest: seriesProps.fixed_chest ?? null,
    fixedAutomat: seriesProps.fixed_automat ?? null,
    seats: seatRows,
    seatGroups,
    showModelCol,
    showSpringCol,
    showPiankiCol,
    backrests: backrestRows,
    sides: sideRows,
  };
}
