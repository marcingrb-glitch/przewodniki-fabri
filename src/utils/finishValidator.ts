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

export async function validateFinishesFromDB(parsed: ParsedSKU): Promise<FinishValidationOutput> {
  const errors: FinishValidationResult[] = [];
  const warnings: FinishValidationResult[] = [];
  const defaults: FinishValidationOutput["defaults"] = {};

  const seatCode = `${parsed.seat.base}${parsed.seat.type}`;

  // Fetch all relevant data in parallel
  const [seatsRes, sidesRes, backrestsRes, pillowsRes] = await Promise.all([
    parsed.seat.base
      ? supabase.from("seats_sofa").select("code, allowed_finishes, default_finish").eq("code", seatCode).maybeSingle()
      : null,
    parsed.side.code
      ? supabase.from("sides").select("code, allowed_finishes, default_finish").eq("code", parsed.side.code).maybeSingle()
      : null,
    parsed.backrest.code
      ? supabase.from("backrests").select("code, allowed_finishes, default_finish").eq("code", parsed.backrest.code).maybeSingle()
      : null,
    parsed.pillow
      ? supabase.from("pillows").select("code, allowed_finishes, default_finish").eq("code", parsed.pillow).maybeSingle()
      : null,
  ]);

  // --- SEAT ---
  if (seatsRes?.data) {
    const allowed = (seatsRes.data.allowed_finishes as string[]) || [];
    const defaultFinish = seatsRes.data.default_finish as string | null;
    if (!parsed.seat.finish) {
      if (!defaultFinish && allowed.length > 1) {
        errors.push({ component: "Siedzisko", code: seatCode, allowed });
      } else if (defaultFinish) {
        defaults.seat = defaultFinish;
      }
    } else if (allowed.length > 0 && !allowed.includes(parsed.seat.finish)) {
      errors.push({ component: "Siedzisko", code: seatCode, finish: parsed.seat.finish, allowed });
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

  // --- PILLOW (inherits seat finish) ---
  const effectiveSeatFinish = parsed.seat.finish || defaults.seat;
  if (parsed.pillow && effectiveSeatFinish && pillowsRes?.data) {
    const allowed = (pillowsRes.data.allowed_finishes as string[]) || [];
    if (allowed.length > 0 && !allowed.includes(effectiveSeatFinish)) {
      warnings.push({ component: "Poduszka", code: parsed.pillow, finish: effectiveSeatFinish, allowed });
    }
  }

  return { errors, warnings, defaults };
}
