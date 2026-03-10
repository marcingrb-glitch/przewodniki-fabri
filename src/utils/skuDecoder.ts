import { ParsedSKU, DecodedSKU } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { resolveSeriesId } from "@/utils/supabaseQueries";
import {
  SERIES, FABRICS, SEAT_TYPES as STATIC_SEAT_TYPES, SEATS_SOFA_S1, BACKRESTS, SIDES,
  CHESTS, AUTOMATS, LEGS, PILLOWS, JASKI, WALKI, EXTRAS as STATIC_EXTRAS,
  FINISHES as STATIC_FINISHES, DEFAULT_FINISHES, SEATS_PUFA as STATIC_SEATS_PUFA,
} from "@/data/mappings";

/**
 * Resolve a raw seat segment against the database.
 * Tries the full rawSegment as a code first, then strips the last letter as finish.
 */
async function findSeatInDB(code: string, seriesId: string, zeroPadded?: boolean): Promise<string | null> {
  const { data: exact } = await supabase
    .from("seats_sofa")
    .select("code")
    .eq("code", code)
    .eq("series_id", seriesId)
    .maybeSingle();
  if (exact) return exact.code;

  if (zeroPadded !== false) {
    const withZero = code.replace(/^SD(\d)(.*)/, "SD0$1$2");
    if (withZero !== code) {
      const { data: padded } = await supabase
        .from("seats_sofa")
        .select("code")
        .eq("code", withZero)
        .eq("series_id", seriesId)
        .maybeSingle();
      if (padded) return padded.code;
    }
  }

  return null;
}

async function resolveSeatCode(
  rawSegment: string,
  parsedFinish: string | undefined,
  seriesId: string,
  zeroPadded?: boolean
): Promise<{ code: string; finish?: string }> {
  if (parsedFinish) {
    const found = await findSeatInDB(rawSegment, seriesId, zeroPadded);
    if (found) return { code: found, finish: parsedFinish };
  }

  const fullMatch = await findSeatInDB(rawSegment, seriesId, zeroPadded);
  if (fullMatch) return { code: fullMatch, finish: parsedFinish };

  if (!parsedFinish && rawSegment.length >= 3) {
    const possibleFinish = rawSegment.slice(-1);
    const possibleCode = rawSegment.slice(0, -1);
    if (/^[A-D]$/.test(possibleFinish)) {
      const codeMatch = await findSeatInDB(possibleCode, seriesId, zeroPadded);
      if (codeMatch) return { code: codeMatch, finish: possibleFinish };
    }
  }

  return { code: rawSegment, finish: parsedFinish };
}

export async function decodeSKU(parsed: ParsedSKU): Promise<DecodedSKU> {
  const seriesId = await resolveSeriesId(parsed.series);

  // Fetch SKU config from DB in parallel
  const [sideExceptionsRes, parseRulesRes, extrasDbRes, finishesDbRes] = await Promise.all([
    seriesId
      ? supabase.from("side_exceptions" as any).select("original_code, mapped_code").eq("series_id", seriesId).eq("active", true)
      : Promise.resolve({ data: null }),
    seriesId
      ? supabase.from("sku_parse_rules" as any).select("component_type, zero_padded").eq("series_id", seriesId)
      : Promise.resolve({ data: null }),
    seriesId
      ? supabase.from("extras").select("code, name, type").eq("series_id", seriesId)
      : Promise.resolve({ data: null }),
    supabase.from("finishes").select("code, name"),
  ]);

  // Build side exceptions map from DB
  const sideExceptions: Record<string, string> = {};
  if (sideExceptionsRes.data) {
    for (const e of sideExceptionsRes.data as any[]) {
      sideExceptions[e.original_code] = e.mapped_code;
    }
  }

  // Get zero_padded rule for seats
  const seatZeroPadded = (parseRulesRes.data as any[])?.find(
    (r: any) => r.component_type === 'seat'
  )?.zero_padded ?? true;

  const SEAT_TYPES: Record<string, string> = { ...STATIC_SEAT_TYPES };

  // Build extras map from DB (fallback to static)
  const EXTRAS: Record<string, { name: string; type: string }> = { ...STATIC_EXTRAS };
  if (extrasDbRes.data) {
    for (const ex of extrasDbRes.data as any[]) {
      EXTRAS[ex.code] = { name: ex.name, type: ex.type || "" };
    }
  }

  // Build finishes map from DB (fallback to static)
  const FINISHES: Record<string, string> = { ...STATIC_FINISHES };
  if (finishesDbRes.data) {
    for (const f of finishesDbRes.data) {
      FINISHES[f.code] = f.name;
    }
  }

  // Resolve seat code against database with zeroPadded rule
  const seatResolved = seriesId
    ? await resolveSeatCode(parsed.seat.rawSegment, parsed.seat.finish, seriesId, seatZeroPadded)
    : { code: parsed.seat.rawSegment, finish: parsed.seat.finish };

  const seatCode = seatResolved.code;
  const seatFinishFromSKU = seatResolved.finish;

  // Fetch all relevant data from Supabase in parallel
  const [
    seriesRes, fabricsRes, seatSofaRes, sidesRes, backrestsRes,
    chestsRes, automatsRes, seriesAutomatsRes, legsRes, pillowsRes, jaskisRes, waleksRes,
    seatPufaRes, seriesConfigRes,
  ] = await Promise.all([
    supabase.from("series").select("code, name, collection").eq("code", parsed.series).maybeSingle(),
    supabase.from("fabrics").select("code, name, price_group, colors").eq("code", parsed.fabric.code).maybeSingle(),
    seriesId
      ? supabase.from("seats_sofa").select("code, frame, foam, front, center_strip, default_finish, allowed_finishes, type, spring_type").eq("code", seatCode).eq("series_id", seriesId).maybeSingle()
      : Promise.resolve({ data: null }),
    seriesId && parsed.side.code
      ? supabase.from("sides").select("code, name, frame, allowed_finishes, default_finish").eq("code", parsed.side.code).eq("series_id", seriesId).maybeSingle()
      : Promise.resolve({ data: null }),
    seriesId && parsed.backrest.code
      ? supabase.from("backrests").select("code, frame, foam, top, height_cm, allowed_finishes, default_finish").eq("code", parsed.backrest.code).eq("series_id", seriesId).maybeSingle()
      : Promise.resolve({ data: null }),
    parsed.chest
      ? supabase.from("chests").select("code, name, leg_height_cm, leg_count").eq("code", parsed.chest).maybeSingle()
      : Promise.resolve({ data: null }),
    parsed.automat
      ? supabase.from("automats").select("code, name, type").eq("code", parsed.automat).maybeSingle()
      : Promise.resolve({ data: null }),
    seriesId && parsed.automat
      ? supabase.from("series_automats" as any).select("has_seat_legs, seat_leg_height_cm, seat_leg_count").eq("automat_code", parsed.automat).eq("series_id", seriesId).maybeSingle()
      : Promise.resolve({ data: null }),
    parsed.legs
      ? supabase.from("legs").select("code, name, material, colors").eq("code", parsed.legs.code).maybeSingle()
      : Promise.resolve({ data: null }),
    parsed.pillow
      ? supabase.from("pillows").select("code, name, default_finish, allowed_finishes").eq("code", parsed.pillow.code).maybeSingle()
      : Promise.resolve({ data: null }),
    parsed.jaski
      ? supabase.from("jaskis").select("code, name").eq("code", parsed.jaski.code).maybeSingle()
      : Promise.resolve({ data: null }),
    parsed.walek
      ? supabase.from("waleks").select("code, name").eq("code", parsed.walek.code).maybeSingle()
      : Promise.resolve({ data: null }),
    // seats_pufa (for pufa decoding)
    seriesId
      ? supabase.from("seats_pufa").select("code, front_back, sides, base_foam, box_height").eq("code", seatCode).eq("series_id", seriesId).maybeSingle()
      : Promise.resolve({ data: null }),
    // series_config (for pufa/fotel leg specs)
    seriesId
      ? supabase.from("series_config").select("pufa_leg_height_cm, pufa_leg_count, pufa_leg_type").eq("series_id", seriesId).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  // ---- SERIES (fallback to static) ----
  const seriesData = seriesRes.data
    ? { name: seriesRes.data.name, collection: seriesRes.data.collection || "?" }
    : (SERIES[parsed.series] || { name: "Nieznana", collection: "?" });

  // ---- FABRIC (fallback to static) ----
  const staticFabric = FABRICS[parsed.fabric.code] || { name: "Nieznana", group: 0, colors: {} };
  let fabricName = staticFabric.name;
  let fabricGroup = staticFabric.group;
  let fabricColors: Record<string, string> = staticFabric.colors;

  if (fabricsRes.data) {
    fabricName = fabricsRes.data.name;
    fabricGroup = fabricsRes.data.price_group;
    const dbColors = fabricsRes.data.colors;
    if (dbColors && typeof dbColors === "object" && !Array.isArray(dbColors)) {
      fabricColors = dbColors as Record<string, string>;
    }
  }
  const colorName = fabricColors[parsed.fabric.color] || parsed.fabric.color;

  // ---- SEAT (fallback to static) ----
  const staticSeat = SEATS_SOFA_S1[seatCode] || { frame: "?", foam: "?", front: "?", midStrip: false };
  let seatFrame = staticSeat.frame;
  let seatFoam = staticSeat.foam;
  let seatFront = staticSeat.front;
  let seatMidStrip = staticSeat.midStrip;
  let seatDefaultFinish = DEFAULT_FINISHES[seatCode] || "A";
  let seatType = "";
  let seatTypeName = "";

  if (seatSofaRes.data) {
    seatFrame = seatSofaRes.data.frame ?? "";
    seatFoam = seatSofaRes.data.foam ?? "";
    seatFront = seatSofaRes.data.front ?? "";
    seatMidStrip = seatSofaRes.data.center_strip ?? false;
    seatDefaultFinish = seatSofaRes.data.default_finish ?? "A";
    seatType = seatSofaRes.data.type ?? "";
    seatTypeName = SEAT_TYPES[seatType] || seatType;
  } else {
    const typeMatch = seatCode.match(/^SD\d{2}(N[DB]?|W)?$/);
    if (typeMatch) {
      seatType = typeMatch[1] || "";
      seatTypeName = SEAT_TYPES[seatType] || seatType;
    }
  }

  const seatFinish = seatFinishFromSKU || seatDefaultFinish;
  const seatFinishName = FINISHES[seatFinish] || seatFinish;

  // ---- SIDE (fallback to static) ----
  const staticSide = SIDES[parsed.side.code] || { frame: "?", name: "Nieznany" };
  let sideName = staticSide.name;
  let sideFrame = staticSide.frame;

  if (sidesRes.data) {
    sideName = sidesRes.data.name ?? "";
    sideFrame = sidesRes.data.frame ?? "";
  }

  // ---- BACKREST (fallback to static) ----
  const staticBackrest = BACKRESTS[parsed.backrest.code] || { frame: "?", foam: "?", top: "?", height: "?" };
  let backrestFrame = staticBackrest.frame;
  let backrestFoam = staticBackrest.foam;
  let backrestTop = staticBackrest.top;
  let backrestHeight = staticBackrest.height;

  if (backrestsRes.data) {
    backrestFrame = backrestsRes.data.frame ?? "";
    backrestFoam = backrestsRes.data.foam ?? "";
    backrestTop = backrestsRes.data.top ?? "";
    backrestHeight = backrestsRes.data.height_cm ?? "";
  }

  // ---- CHEST (fallback to static) ----
  const staticChest = CHESTS[parsed.chest] || { name: "?", legHeight: 0, legCount: 0 };
  let chestName = staticChest.name;
  let chestLegHeight = staticChest.legHeight;
  const chestLegCount = chestsRes.data?.leg_count || staticChest.legCount || 4;

  if (chestsRes.data) {
    chestName = chestsRes.data.name ?? "";
    chestLegHeight = chestsRes.data.leg_height_cm ?? 0;
  }

  // ---- AUTOMAT (fallback to static) ----
  const staticAutomat = AUTOMATS[parsed.automat] || { name: "?", type: "?", seatLegs: false, seatLegHeight: 0, seatLegCount: 0 };
  let automatName = staticAutomat.name;
  let automatType = staticAutomat.type;
  let automatSeatLegs = staticAutomat.seatLegs;
  let automatSeatLegHeight = staticAutomat.seatLegHeight;
  let automatSeatLegCount = staticAutomat.seatLegCount;

  if (automatsRes.data) {
    automatName = automatsRes.data.name ?? "";
    automatType = automatsRes.data.type ?? "";
  }
  const saData = seriesAutomatsRes.data as any;
  if (saData) {
    automatSeatLegs = saData.has_seat_legs ?? automatSeatLegs;
    automatSeatLegHeight = saData.seat_leg_height_cm ?? automatSeatLegHeight;
    automatSeatLegCount = saData.seat_leg_count ?? automatSeatLegCount;
  }

  // ---- LEGS (fallback to static) ----
  let legsDecoded: DecodedSKU["legs"] = undefined;
  if (parsed.legs) {
    const staticLeg = LEGS[parsed.legs.code] || { name: "?", material: "?", colors: {} };
    let legName = staticLeg.name;
    let legMaterial = staticLeg.material;
    let legColors: Record<string, string> = staticLeg.colors;

    if (legsRes.data) {
      legName = legsRes.data.name ?? "";
      legMaterial = legsRes.data.material ?? "";
      const dbLegColors = legsRes.data.colors;
      if (dbLegColors && typeof dbLegColors === "object" && !Array.isArray(dbLegColors)) {
        legColors = dbLegColors as Record<string, string>;
      }
    }

    legsDecoded = {
      code: parsed.legs.code,
      name: legName,
      material: legMaterial,
      color: parsed.legs.color,
      colorName: parsed.legs.color ? (legColors[parsed.legs.color] || parsed.legs.color) : undefined,
    };
  }

  // ---- Leg heights for sofa ----
  const isSK23 = parsed.chest === "SK23";
  const sofaChestLeg = isSK23
    ? { leg: "N4", height: 2.5, count: 4 }
    : legsDecoded
      ? { leg: `${legsDecoded.code}${legsDecoded.color || ""}`, height: chestLegHeight, count: chestLegCount }
      : null;

  let sofaSeatLeg: { leg: string; height: number; count: number } | null = null;

  if (automatSeatLegs && automatSeatLegHeight > 0) {
    if (legsDecoded) {
      sofaSeatLeg = {
        leg: `${legsDecoded.code}${legsDecoded.color || ""}`,
        height: automatSeatLegHeight,
        count: automatSeatLegCount,
      };
    } else {
      sofaSeatLeg = {
        leg: "N4",
        height: automatSeatLegHeight,
        count: automatSeatLegCount,
      };
    }
  }

  // ---- PILLOW (fallback to static) ----
  let pillowDecoded: DecodedSKU["pillow"] = undefined;
  if (parsed.pillow) {
    const pillowCode = parsed.pillow.code;
    const staticPillow = PILLOWS[pillowCode] || { name: "?" };
    const pillowName = pillowsRes.data?.name || staticPillow.name;
    const pillowFinish = parsed.pillow.finish || pillowsRes.data?.default_finish || seatFinish;
    const pillowFinishName = FINISHES[pillowFinish] || pillowFinish;
    pillowDecoded = { code: pillowCode, name: pillowName, finish: pillowFinish, finishName: pillowFinishName };
  }

  // ---- JASKI (fallback to static) ----
  let jaskiDecoded: DecodedSKU["jaski"] = undefined;
  if (parsed.jaski) {
    const jaskiCode = parsed.jaski.code;
    const staticJaski = JASKI[jaskiCode] || { name: "?" };
    const jaskiName = jaskisRes.data?.name || staticJaski.name;
    const jaskiFinish = parsed.jaski.finish || seatFinish;
    const jaskiFinishName = FINISHES[jaskiFinish] || jaskiFinish;
    jaskiDecoded = { code: jaskiCode, name: jaskiName, finish: jaskiFinish, finishName: jaskiFinishName };
  }

  // ---- WALEK (fallback to static) ----
  let walekDecoded: DecodedSKU["walek"] = undefined;
  if (parsed.walek) {
    const walekCode = parsed.walek.code;
    const staticWalek = WALKI[walekCode] || { name: "?" };
    const walekName = waleksRes.data?.name || staticWalek.name;
    const walekFinish = parsed.walek.finish || seatFinish;
    const walekFinishName = FINISHES[walekFinish] || walekFinish;
    walekDecoded = { code: walekCode, name: walekName, finish: walekFinish, finishName: walekFinishName };
  }

  // ---- EXTRAS (static only — no series_id needed) ----
  const extrasDecoded = parsed.extras.map((e) => {
    const eData = EXTRAS[e] || { name: "?", type: "?" };
    return { code: e, name: eData.name, type: eData.type };
  });

  // ---- PUFA SEAT (from DB, fallback to static) ----
  let pufaSeatDecoded: DecodedSKU["pufaSeat"] = undefined;
  const hasPufa = parsed.extras.some(e => e === "PF" || e === "PFO");
  if (hasPufa) {
    if (seatPufaRes.data) {
      pufaSeatDecoded = {
        frontBack: seatPufaRes.data.front_back ?? "-",
        sides: seatPufaRes.data.sides ?? "-",
        foam: seatPufaRes.data.base_foam ?? "-",
        box: seatPufaRes.data.box_height ?? "-",
      };
    } else {
      const staticPufa = STATIC_SEATS_PUFA[seatCode];
      if (staticPufa) {
        pufaSeatDecoded = {
          frontBack: staticPufa.frontBack,
          sides: staticPufa.sides,
          foam: staticPufa.foam,
          box: staticPufa.box,
        };
      }
    }
  }

  // ---- PUFA/FOTEL LEGS (from series_config, fallback to hardcoded) ----
  const scData = seriesConfigRes.data as any;
  const pufaLegHeight = scData?.pufa_leg_height_cm ?? 16;
  const pufaLegCount = scData?.pufa_leg_count ?? 4;

  let pufaLegsDecoded: DecodedSKU["pufaLegs"] = undefined;
  let fotelLegsDecoded: DecodedSKU["fotelLegs"] = undefined;

  if (hasPufa && legsDecoded) {
    pufaLegsDecoded = {
      code: `${legsDecoded.code}${legsDecoded.color || ""}`,
      height: pufaLegHeight,
      count: pufaLegCount,
    };
  }

  const hasFotel = parsed.extras.includes("FT");
  if (hasFotel && legsDecoded) {
    fotelLegsDecoded = {
      code: `${legsDecoded.code}${legsDecoded.color || ""}`,
      height: pufaLegHeight,
      count: pufaLegCount,
    };
  }

  // ---- Generate pufa SKU ----
  let pufaSKU: string | undefined;
  if (hasPufa && parsed.legs) {
    const pufaType = parsed.extras.find(e => e === "PF" || e === "PFO")!;
    pufaSKU = `${pufaType}-${parsed.series}-${parsed.fabric.code}${parsed.fabric.color}-${seatCode}-${parsed.legs.code}${parsed.legs.color || ""}`;
  }

  // ---- Generate fotel SKU ----
  let fotelSKU: string | undefined;
  if (hasFotel && parsed.legs) {
    const jaskiPart = parsed.jaski ? `-${parsed.jaski.code}${parsed.jaski.finish || ""}` : "";
    fotelSKU = `FT-${parsed.series}-${parsed.fabric.code}${parsed.fabric.color}-${seatCode}-${parsed.side.code}${parsed.side.finish}${jaskiPart}-${parsed.legs.code}${parsed.legs.color || ""}`;
  }

  return {
    series: { code: parsed.series, name: seriesData.name, collection: seriesData.collection },
    fabric: { code: parsed.fabric.code, name: fabricName, color: parsed.fabric.color, colorName, group: fabricGroup },
    seat: {
      code: seatCode,
      type: seatType,
      typeName: seatTypeName,
      finish: seatFinish,
      finishName: seatFinishName,
      frame: seatFrame,
      foam: seatFoam,
      front: seatFront,
      midStrip: seatMidStrip,
    },
    side: { code: parsed.side.code, name: sideName, frame: sideFrame, finish: parsed.side.finish || (sidesRes.data?.default_finish ?? ""), finishName: FINISHES[parsed.side.finish || (sidesRes.data?.default_finish ?? "")] || parsed.side.finish },
    backrest: { code: parsed.backrest.code, height: backrestHeight, frame: backrestFrame, foam: backrestFoam, top: backrestTop, finish: parsed.backrest.finish, finishName: FINISHES[parsed.backrest.finish] || parsed.backrest.finish },
    chest: { code: parsed.chest, name: chestName, legHeight: chestLegHeight, legCount: chestLegCount },
    automat: { code: parsed.automat, name: automatName, type: automatType, seatLegs: automatSeatLegs, seatLegHeight: automatSeatLegHeight, seatLegCount: automatSeatLegCount },
    legs: legsDecoded,
    pillow: pillowDecoded,
    jaski: jaskiDecoded,
    walek: walekDecoded,
    extras: extrasDecoded,
    legHeights: { sofa_chest: sofaChestLeg, sofa_seat: sofaSeatLeg },
    pufaSeat: pufaSeatDecoded,
    pufaLegs: pufaLegsDecoded,
    fotelLegs: fotelLegsDecoded,
    pufaSKU,
    fotelSKU,
  };
}

/**
 * Fetch side exceptions from DB for a given series code.
 */
export async function fetchSideExceptions(seriesCode: string): Promise<Record<string, string>> {
  const seriesId = await resolveSeriesId(seriesCode);
  if (!seriesId) return {};
  
  const { data } = await supabase
    .from("side_exceptions" as any)
    .select("original_code, mapped_code")
    .eq("series_id", seriesId)
    .eq("active", true);
  
  if (!data) return {};
  return Object.fromEntries((data as any[]).map(e => [e.original_code, e.mapped_code]));
}
