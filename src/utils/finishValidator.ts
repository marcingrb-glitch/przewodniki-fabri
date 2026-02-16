import { supabase } from "@/integrations/supabase/client";
import { ParsedSKU } from "@/types";
import { resolveSeriesId } from "@/utils/supabaseQueries";

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
 * Resolve seat code from rawSegment against database, same logic as decoder.
 */
async function resolveSeatCodeForValidation(
  rawSegment: string,
  parsedFinish: string | undefined,
  seriesId: string
): Promise<{ code: string; finish?: string }> {
  if (parsedFinish) {
    const { data } = await supabase
      .from("seats_sofa")
      .select("code")
      .eq("code", rawSegment)
      .eq("series_id", seriesId)
      .maybeSingle();
    if (data) return { code: rawSegment, finish: parsedFinish };
  }

  const { data: fullMatch } = await supabase
    .from("seats_sofa")
    .select("code")
    .eq("code", rawSegment)
    .eq("series_id", seriesId)
    .maybeSingle();
  if (fullMatch) return { code: rawSegment, finish: parsedFinish };

  if (!parsedFinish && rawSegment.length >= 3) {
    const possibleFinish = rawSegment.slice(-1);
    const possibleCode = rawSegment.slice(0, -1);
    if (/^[A-D]$/.test(possibleFinish)) {
      const { data: codeMatch } = await supabase
        .from("seats_sofa")
        .select("code")
        .eq("code", possibleCode)
        .eq("series_id", seriesId)
        .maybeSingle();
      if (codeMatch) return { code: possibleCode, finish: possibleFinish };
    }
  }

  return { code: rawSegment, finish: parsedFinish };
}

export async function validateFinishesFromDB(parsed: ParsedSKU): Promise<FinishValidationOutput> {
  const errors: FinishValidationResult[] = [];
  const warnings: FinishValidationResult[] = [];
  const defaults: FinishValidationOutput["defaults"] = {};

  const seriesId = await resolveSeriesId(parsed.series);

  // Resolve seat code
  const seatResolved = seriesId
    ? await resolveSeatCodeForValidation(parsed.seat.rawSegment, parsed.seat.finish, seriesId)
    : { code: parsed.seat.rawSegment, finish: parsed.seat.finish };
  const seatCode = seatResolved.code;
  const seatFinish = seatResolved.finish;

  // Fetch all relevant data in parallel, filtering by series_id where applicable
  const [seatsRes, sidesRes, backrestsRes, pillowsRes] = await Promise.all([
    parsed.seat.rawSegment && seriesId
      ? supabase.from("seats_sofa").select("code, allowed_finishes, default_finish").eq("code", seatCode).eq("series_id", seriesId).maybeSingle()
      : null,
    parsed.side.code && seriesId
      ? supabase.from("sides").select("code, allowed_finishes, default_finish").eq("code", parsed.side.code).eq("series_id", seriesId).maybeSingle()
      : null,
    parsed.backrest.code && seriesId
      ? supabase.from("backrests").select("code, allowed_finishes, default_finish").eq("code", parsed.backrest.code).eq("series_id", seriesId).maybeSingle()
      : null,
    parsed.pillow
      ? supabase.from("pillows").select("code, allowed_finishes, default_finish").eq("code", parsed.pillow).maybeSingle()
      : null,
  ]);

  // --- SEAT ---
  if (seatsRes?.data) {
    const allowed = (seatsRes.data.allowed_finishes as string[]) || [];
    const defaultFinish = seatsRes.data.default_finish as string | null;
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
  if (sidesRes?.data) {
    const allowed = (sidesRes.data.allowed_finishes as string[]) || [];
    const defaultFinish = sidesRes.data.default_finish as string | null;
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
  if (backrestsRes?.data) {
    const allowed = (backrestsRes.data.allowed_finishes as string[]) || [];
    const defaultFinish = backrestsRes.data.default_finish as string | null;
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

  // --- PILLOW (inherits seat finish, no series_id) ---
  const effectiveSeatFinish = seatFinish || defaults.seat;
  if (parsed.pillow && effectiveSeatFinish && pillowsRes?.data) {
    const allowed = (pillowsRes.data.allowed_finishes as string[]) || [];
    if (allowed.length > 0 && !allowed.includes(effectiveSeatFinish)) {
      warnings.push({ component: "Poduszka", code: parsed.pillow, finish: effectiveSeatFinish, allowed });
    }
  }

  return { errors, warnings, defaults };
}
