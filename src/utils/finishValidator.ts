import { supabase } from "@/integrations/supabase/client";
import { ParsedSKU } from "@/types";

interface FinishWarning {
  component: string;
  code: string;
  finish: string;
  allowed: string[];
}

export async function validateFinishesFromDB(parsed: ParsedSKU): Promise<FinishWarning[]> {
  const warnings: FinishWarning[] = [];

  // Fetch all relevant data in parallel
  const [seatsRes, sidesRes, backrestsRes, pillowsRes] = await Promise.all([
    parsed.seat.base
      ? supabase.from("seats_sofa").select("code, allowed_finishes").eq("code", `${parsed.seat.base}${parsed.seat.type}`).maybeSingle()
      : null,
    parsed.side.code
      ? supabase.from("sides").select("code, allowed_finishes").eq("code", parsed.side.code).maybeSingle()
      : null,
    parsed.backrest.code
      ? supabase.from("backrests").select("code, allowed_finishes").eq("code", parsed.backrest.code).maybeSingle()
      : null,
    parsed.pillow
      ? supabase.from("pillows").select("code, allowed_finishes").eq("code", parsed.pillow).maybeSingle()
      : null,
  ]);

  // Validate seat finish
  const seatFinish = parsed.seat.finish;
  if (seatFinish && seatsRes?.data?.allowed_finishes) {
    const allowed = seatsRes.data.allowed_finishes as string[];
    if (allowed.length > 0 && !allowed.includes(seatFinish)) {
      warnings.push({ component: "Siedzisko", code: `${parsed.seat.base}${parsed.seat.type}`, finish: seatFinish, allowed });
    }
  }

  // Validate side finish
  if (parsed.side.finish && sidesRes?.data?.allowed_finishes) {
    const allowed = sidesRes.data.allowed_finishes as string[];
    if (allowed.length > 0 && !allowed.includes(parsed.side.finish)) {
      warnings.push({ component: "Boczek", code: parsed.side.code, finish: parsed.side.finish, allowed });
    }
  }

  // Validate backrest finish
  if (parsed.backrest.finish && backrestsRes?.data?.allowed_finishes) {
    const allowed = backrestsRes.data.allowed_finishes as string[];
    if (allowed.length > 0 && !allowed.includes(parsed.backrest.finish)) {
      warnings.push({ component: "Oparcie", code: parsed.backrest.code, finish: parsed.backrest.finish, allowed });
    }
  }

  // Validate pillow finish (inherits seat finish)
  if (parsed.pillow && seatFinish && pillowsRes?.data?.allowed_finishes) {
    const allowed = pillowsRes.data.allowed_finishes as string[];
    if (allowed.length > 0 && !allowed.includes(seatFinish)) {
      warnings.push({ component: "Poduszka", code: parsed.pillow, finish: seatFinish, allowed });
    }
  }

  return warnings;
}
