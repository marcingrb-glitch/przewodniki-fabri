import { supabase } from "@/integrations/supabase/client";
import { ParsedSKU } from "@/types";

interface FinishValidationResult {
  component: string;
  code: string;
  finish?: string;
  allowed: string[];
}

interface FinishValidationOutput {
  errors: FinishValidationResult[];
  warnings: FinishValidationResult[];
  defaults: { seat?: string; side?: string; backrest?: string };
}

/**
 * Resolve series ID and parent series ID from series code.
 */
async function resolveSeriesWithParent(seriesCode: string): Promise<{ seriesId: string | null; parentSeriesId: string | null }> {
  const { data } = await supabase
    .from("products")
    .select("id, properties")
    .eq("category", "series")
    .eq("code", seriesCode)
    .maybeSingle();
  if (!data) return { seriesId: null, parentSeriesId: null };
  const parentSeriesId = (data.properties as Record<string, unknown>)?.parent_series_id as string | null ?? null;
  return { seriesId: data.id, parentSeriesId };
}

/**
 * Resolve seat code from rawSegment against database, with parent series fallback.
 */
async function findSeatInDB(code: string, seriesIds: string[]): Promise<string | null> {
  for (const sid of seriesIds) {
    const { data: exact } = await supabase
      .from("products").select("code")
      .eq("category", "seat").eq("code", code).eq("series_id", sid).maybeSingle();
    if (exact) return exact.code;

    const withZero = code.replace(/^SD(\d)(.*)/, "SD0$1$2");
    if (withZero !== code) {
      const { data: padded } = await supabase
        .from("products").select("code")
        .eq("category", "seat").eq("code", withZero).eq("series_id", sid).maybeSingle();
      if (padded) return padded.code;
    }
  }
  return null;
}

async function resolveSeatCodeForValidation(
  rawSegment: string,
  parsedFinish: string | undefined,
  seriesIds: string[]
): Promise<{ code: string; finish?: string }> {
  if (parsedFinish) {
    const found = await findSeatInDB(rawSegment, seriesIds);
    if (found) return { code: found, finish: parsedFinish };
  }

  const fullMatch = await findSeatInDB(rawSegment, seriesIds);
  if (fullMatch) return { code: fullMatch, finish: parsedFinish };

  if (!parsedFinish && rawSegment.length >= 3) {
    const possibleFinish = rawSegment.slice(-1);
    const possibleCode = rawSegment.slice(0, -1);
    if (/^[A-D]$/.test(possibleFinish)) {
      const codeMatch = await findSeatInDB(possibleCode, seriesIds);
      if (codeMatch) return { code: codeMatch, finish: possibleFinish };
    }
  }

  return { code: rawSegment, finish: parsedFinish };
}

/**
 * Find product with fallback to parent series.
 */
async function findProductInSeries(
  category: string, code: string, seriesIds: string[]
): Promise<{ code: string; allowed_finishes: string[]; default_finish: string | null } | null> {
  for (const sid of seriesIds) {
    const { data } = await supabase
      .from("products").select("code, allowed_finishes, default_finish")
      .eq("category", category).eq("code", code).eq("series_id", sid).maybeSingle();
    if (data) return data as { code: string; allowed_finishes: string[]; default_finish: string | null };
  }
  return null;
}

export async function validateFinishesFromDB(parsed: ParsedSKU): Promise<FinishValidationOutput> {
  const errors: FinishValidationResult[] = [];
  const warnings: FinishValidationResult[] = [];
  const defaults: FinishValidationOutput["defaults"] = {};

  const { seriesId, parentSeriesId } = await resolveSeriesWithParent(parsed.series);
  const seriesIds = [seriesId, parentSeriesId].filter(Boolean) as string[];

  // Resolve seat code (with parent fallback)
  const seatResolved = seriesIds.length > 0
    ? await resolveSeatCodeForValidation(parsed.seat.rawSegment, parsed.seat.finish, seriesIds)
    : { code: parsed.seat.rawSegment, finish: parsed.seat.finish };
  const seatCode = seatResolved.code;
  const seatFinish = seatResolved.finish;

  // Fetch all relevant data with parent series fallback
  const [seatProduct, sideProduct, backrestProduct, pillowProduct] = await Promise.all([
    parsed.seat.rawSegment && seriesIds.length > 0
      ? findProductInSeries("seat", seatCode, seriesIds)
      : null,
    parsed.side.code && seriesIds.length > 0
      ? findProductInSeries("side", parsed.side.code, seriesIds)
      : null,
    parsed.backrest.code && seriesIds.length > 0
      ? findProductInSeries("backrest", parsed.backrest.code, seriesIds)
      : null,
    parsed.pillow
      ? supabase.from("products").select("code, allowed_finishes, default_finish").eq("category", "pillow").eq("code", parsed.pillow.code).eq("is_global", true).maybeSingle().then(r => r.data as { code: string; allowed_finishes: string[]; default_finish: string | null } | null)
      : null,
  ]);

  // --- SEAT ---
  if (seatProduct) {
    const allowed = seatProduct.allowed_finishes || [];
    const defaultFinish = seatProduct.default_finish;
    if (!seatFinish) {
      if (!defaultFinish && allowed.length > 1) {
        errors.push({ component: "Siedzisko", code: seatCode, allowed });
      } else if (defaultFinish) {
        defaults.seat = defaultFinish;
      }
    } else if (allowed.length > 0 && !allowed.includes(seatFinish)) {
      errors.push({ component: "Siedzisko", code: seatCode, finish: seatFinish, allowed });
    }
  }

  // --- SIDE ---
  if (sideProduct) {
    const allowed = sideProduct.allowed_finishes || [];
    const defaultFinish = sideProduct.default_finish;
    if (!parsed.side.finish) {
      if (!defaultFinish && allowed.length > 1) {
        errors.push({ component: "Boczek", code: parsed.side.code, allowed });
      } else if (defaultFinish) {
        defaults.side = defaultFinish;
      }
    } else if (allowed.length > 0 && !allowed.includes(parsed.side.finish)) {
      errors.push({ component: "Boczek", code: parsed.side.code, finish: parsed.side.finish, allowed });
    }
  }

  // --- BACKREST ---
  if (backrestProduct) {
    const allowed = backrestProduct.allowed_finishes || [];
    const defaultFinish = backrestProduct.default_finish;
    if (!parsed.backrest.finish) {
      if (!defaultFinish && allowed.length > 1) {
        errors.push({ component: "Oparcie", code: parsed.backrest.code, allowed });
      } else if (defaultFinish) {
        defaults.backrest = defaultFinish;
      }
    } else if (allowed.length > 0 && !allowed.includes(parsed.backrest.finish)) {
      errors.push({ component: "Oparcie", code: parsed.backrest.code, finish: parsed.backrest.finish, allowed });
    }
  }

  // --- PILLOW (uses own finish if specified, otherwise inherits seat finish) ---
  const effectiveSeatFinish = seatFinish || defaults.seat;
  const pillowFinish = parsed.pillow?.finish || effectiveSeatFinish;
  if (parsed.pillow && pillowFinish && pillowProduct) {
    const allowed = pillowProduct.allowed_finishes || [];
    if (allowed.length > 0 && !allowed.includes(pillowFinish)) {
      warnings.push({ component: "Poduszka", code: parsed.pillow.code, finish: pillowFinish, allowed });
    }
  }

  return { errors, warnings, defaults };
}
