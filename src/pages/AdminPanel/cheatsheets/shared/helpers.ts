import type { ProductRow, ProductSpec, SeriesConfig } from "../types";

export function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((o, k) => o?.[k], obj);
}

export function getSpringForSeat(seat: ProductRow, config: SeriesConfig | null): string {
  const exceptions = (config?.spring_exceptions as Array<{ model: string; spring: string }>) ?? [];
  const exc = exceptions.find(e => e.model === seat.code);
  if (exc) return exc.spring;
  return (seat.properties as any)?.spring_type ?? config?.default_spring ?? "B";
}

export function isSpringException(seat: ProductRow, config: SeriesConfig | null): boolean {
  const exceptions = (config?.spring_exceptions as Array<{ model: string; spring: string }>) ?? [];
  return !!exceptions.find(e => e.model === seat.code);
}

export function formatFoamsInline(specs: ProductSpec[]): string {
  if (!specs.length) return "—";
  return specs
    .sort((a, b) => (a.position_number ?? 0) - (b.position_number ?? 0))
    .map(f => {
      const qty = f.quantity && f.quantity > 1 ? `${f.quantity} × ` : "";
      return `${qty}${f.height ?? "?"} × ${f.width ?? "?"} × ${f.length ?? "?"} ${f.material ?? ""}`.trim();
    })
    .join(" + ");
}

export function formatColors(colors: any): string {
  if (!colors) return "—";
  if (Array.isArray(colors)) {
    if (colors.length === 0) return "—";
    if (typeof colors[0] === "object") return colors.map((c: any) => `${c.code}=${c.name}`).join(", ");
    return colors.join(", ");
  }
  if (typeof colors === "object") {
    return Object.entries(colors).map(([k, v]) => `${k}=${v}`).join(", ");
  }
  return String(colors);
}

export function formatLegType(type: string | null, height: number | null): string {
  if (!type) return "—";
  switch (type) {
    case "plastic_2_5": return `N4 plastikowe, H${height}cm`;
    case "from_sku": return `Z segmentu N (z SKU), H${height}cm`;
    default: return `${type}, H${height}cm`;
  }
}

/**
 * For Dzielone seats without own foams, find the Gładkie equivalent's foams.
 * seat_type values: 'Gładkie' | 'Wciąg' | 'Dzielone'
 */
export function getFoamsWithFallback(
  seat: ProductRow,
  allSpecs: ProductSpec[],
  allSeats: ProductRow[]
): { specs: ProductSpec[]; isReference: boolean; referenceCode: string | null } {
  const directSpecs = allSpecs
    .filter(s => s.product_id === seat.id && s.spec_type === 'foam')
    .filter(s => s.height != null || s.width != null || s.length != null);

  if (directSpecs.length > 0) {
    return { specs: directSpecs, isReference: false, referenceCode: null };
  }

  const seatType = (seat.properties as any)?.seat_type;
  const isDzielone = seatType === 'Dzielone' || seatType === 'dzielone';

  if (!isDzielone) {
    return { specs: [], isReference: false, referenceCode: null };
  }

  const baseCode = seat.code.replace(/D$/, '');

  const gladkie = allSeats.find(s =>
    s.code === baseCode &&
    s.series_id === seat.series_id &&
    s.category === seat.category
  );

  if (!gladkie) {
    return { specs: [], isReference: false, referenceCode: null };
  }

  const refSpecs = allSpecs
    .filter(s => s.product_id === gladkie.id && s.spec_type === 'foam')
    .filter(s => s.height != null || s.width != null || s.length != null);

  return { specs: refSpecs, isReference: true, referenceCode: baseCode };
}

export function formatFoamsInlineWithFallback(
  seat: ProductRow,
  allSpecs: ProductSpec[],
  allSeats: ProductRow[]
): string {
  const { specs, isReference, referenceCode } = getFoamsWithFallback(seat, allSpecs, allSeats);
  if (specs.length === 0) return "—";
  const foamStr = formatFoamsInline(specs);
  if (isReference) {
    return `${foamStr} (jak ${referenceCode} + pasek)`;
  }
  return foamStr;
}
