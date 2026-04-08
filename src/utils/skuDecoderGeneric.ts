import { ParsedSKU, DecodedSKU, ProductFoamItem } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { formatFoamsSummary } from "@/utils/foamHelpers";

// ---------------------------------------------------------------------------
// Helpers
/**
 * Normalize component codes: strip leading zeros after prefix letter.
 * P01 → P1, J01 → J1, W01 → W1. Already-normalized codes pass through.
 */
function normalizeComponentCode(code: string): string {
  return code.replace(/^([A-Z])0+(\d)/, "$1$2");
}

// ---------------------------------------------------------------------------

type ProductRow = {
  id: string;
  code: string;
  name: string;
  category: string;
  series_id: string | null;
  properties: Record<string, any>;
  colors: Record<string, string> | null;
  allowed_finishes: string[] | null;
  default_finish: string | null;
};

const PRODUCT_SELECT = "id, code, name, category, series_id, properties, colors, allowed_finishes, default_finish";


// ---------------------------------------------------------------------------
// Seat lookup (3-step: exact → zero-padded → strip finish)
// ---------------------------------------------------------------------------

async function findSeatInProducts(
  code: string,
  seriesId: string
): Promise<ProductRow | null> {
  // Step 1: exact match
  const { data: exact } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("code", code)
    .eq("category", "seat")
    .eq("series_id", seriesId)
    .maybeSingle();
  if (exact) return exact as unknown as ProductRow;

  // Step 2: zero-padded (SD1 → SD01)
  const withZero = code.replace(/^SD(\d)(.*)/, "SD0$1$2");
  if (withZero !== code) {
    const { data: padded } = await supabase
      .from("products")
      .select(PRODUCT_SELECT)
      .eq("code", withZero)
      .eq("category", "seat")
      .eq("series_id", seriesId)
      .maybeSingle();
    if (padded) return padded as unknown as ProductRow;
  }

  return null;
}

async function resolveSeatProduct(
  rawSegment: string,
  parsedFinish: string | undefined,
  seriesId: string
): Promise<{ product: ProductRow | null; finish?: string }> {
  // If finish already parsed, try rawSegment as-is
  if (parsedFinish) {
    const found = await findSeatInProducts(rawSegment, seriesId);
    if (found) return { product: found, finish: parsedFinish };
  }

  // Try full raw segment
  const fullMatch = await findSeatInProducts(rawSegment, seriesId);
  if (fullMatch) return { product: fullMatch, finish: parsedFinish };

  // Try stripping last letter as finish
  if (!parsedFinish && rawSegment.length >= 3) {
    const possibleFinish = rawSegment.slice(-1);
    const possibleCode = rawSegment.slice(0, -1);
    if (/^[A-D]$/.test(possibleFinish)) {
      const codeMatch = await findSeatInProducts(possibleCode, seriesId);
      if (codeMatch) return { product: codeMatch, finish: possibleFinish };
    }
  }

  return { product: null, finish: parsedFinish };
}

// ---------------------------------------------------------------------------
// Backrest lookup (model_name matching)
// ---------------------------------------------------------------------------

async function resolveBackrestProduct(
  code: string,
  seriesId: string,
  seatModelName: string | null
): Promise<ProductRow | null> {
  const baseSelect = PRODUCT_SELECT;

  if (seatModelName) {
    // Step 1: match by model_name
    const { data: allBr } = await supabase
      .from("products")
      .select(baseSelect)
      .eq("code", code)
      .eq("category", "backrest")
      .eq("series_id", seriesId);

    if (allBr && allBr.length > 0) {
      // Token-based bidirectional matching: split both by comma/space, check if ANY token overlaps
      const seatTokens = seatModelName.toLowerCase().split(/[\s,/]+/).filter(Boolean);
      
      const byModel = allBr.find((b: any) => {
        const mn = (b.properties as any)?.model_name;
        if (!mn || typeof mn !== "string") return false;
        const brTokens = mn.toLowerCase().split(/[\s,/]+/).filter(Boolean);
        return seatTokens.some(st => brTokens.some(bt => bt.includes(st) || st.includes(bt)));
      });
      if (byModel) return byModel as unknown as ProductRow;

      // Fallback: model_name is null
      const defaultBr = allBr.find((b: any) => !(b.properties as any)?.model_name);
      if (defaultBr) return defaultBr as unknown as ProductRow;

      // Last resort: any
      return allBr[0] as unknown as ProductRow;
    }
    return null;
  }

  // No seat model_name — get default (model_name null) or any
  const { data: allBr } = await supabase
    .from("products")
    .select(baseSelect)
    .eq("code", code)
    .eq("category", "backrest")
    .eq("series_id", seriesId);

  if (!allBr || allBr.length === 0) return null;

  const defaultBr = allBr.find((b: any) => !(b.properties as any)?.model_name);
  return (defaultBr ?? allBr[0]) as unknown as ProductRow;
}

// ---------------------------------------------------------------------------
// Foams from product_specs
// ---------------------------------------------------------------------------

function mapFoam(f: any): ProductFoamItem {
  return {
    position: f.position_number ?? 0,
    name: f.name ?? "",
    height: f.height,
    width: f.width,
    length: f.length,
    material: f.material ?? "",
    quantity: f.quantity ?? 1,
    notes: f.notes,
  };
}

// ---------------------------------------------------------------------------
// Properties helper
// ---------------------------------------------------------------------------

function prop(product: ProductRow | null, key: string, fallback: any = ""): any {
  if (!product) return fallback;
  const props = product.properties;
  if (!props || typeof props !== "object") return fallback;
  return (props as any)[key] ?? fallback;
}

function productColors(product: ProductRow | null): Record<string, string> {
  if (!product?.colors || typeof product.colors !== "object") return {};
  
  // Handle array format: [{code: "A", name: "Sand"}, ...]
  if (Array.isArray(product.colors)) {
    const map: Record<string, string> = {};
    for (const item of product.colors) {
      if (item && typeof item === "object" && "code" in item && "name" in item) {
        map[String(item.code)] = String(item.name);
      }
    }
    return map;
  }
  
  // Handle plain object format: {"A": "Sand", ...}
  return product.colors as Record<string, string>;
}

// ---------------------------------------------------------------------------
// Main decoder
// ---------------------------------------------------------------------------

export async function decodeSKU(parsed: ParsedSKU): Promise<DecodedSKU> {
  // ---- 1. Resolve series from products ----
  const { data: seriesProduct } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("code", parsed.series)
    .eq("category", "series")
    .maybeSingle();

  const seriesP = seriesProduct as unknown as ProductRow | null;
  const seriesId = seriesP?.id ?? null;
  const seriesData = {
    code: parsed.series,
    name: seriesP?.name ?? "Nieznana",
    collection: prop(seriesP, "collection", "?"),
  };

  // ---- 2. Resolve seat ----
  const seatResolved = seriesId
    ? await resolveSeatProduct(parsed.seat.rawSegment, parsed.seat.finish, seriesId)
    : { product: null, finish: parsed.seat.finish };

  const seatProduct = seatResolved.product;
  const seatCode = seatProduct?.code ?? parsed.seat.rawSegment;
  const seatDefaultFinish = seatProduct?.default_finish ?? "A";
  // Enforce allowed_finishes — if parsed finish is invalid, use default
  const seatAllowedFinishes = seatProduct?.allowed_finishes;
  const seatFinish = (seatAllowedFinishes && seatResolved.finish && !seatAllowedFinishes.includes(seatResolved.finish))
    ? seatDefaultFinish
    : (seatResolved.finish || seatDefaultFinish);
  const seatModelName = prop(seatProduct, "model_name", null) as string | null;

  // ---- 3. Resolve backrest ----
  const backrestProduct = seriesId && parsed.backrest.code
    ? await resolveBackrestProduct(parsed.backrest.code, seriesId, seatModelName)
    : null;

  // ---- 4. Parallel fetch: fabric, side, chest, automat, leg, pillow, jasiek, walek, finishes, extras, pufaSeat, sewingVariants ----
  const [
    fabricRes, sideRes, chestRes, automatRes, legRes,
    pillowRes, jaskiRes, walekRes, finishesRes,
    extrasRes, pufaSeatRes, automatConfigRes,
    sewingVariantsRes,
  ] = await Promise.all([
    // fabric (global)
    supabase.from("products").select(PRODUCT_SELECT)
      .eq("code", parsed.fabric.code).eq("category", "fabric").maybeSingle(),
    // side (series-scoped)
    seriesId && parsed.side.code
      ? supabase.from("products").select(PRODUCT_SELECT)
          .eq("code", parsed.side.code).eq("category", "side").eq("series_id", seriesId).maybeSingle()
      : Promise.resolve({ data: null }),
    // chest (global)
    parsed.chest
      ? supabase.from("products").select(PRODUCT_SELECT)
          .eq("code", parsed.chest).eq("category", "chest").maybeSingle()
      : Promise.resolve({ data: null }),
    // automat (global)
    parsed.automat
      ? supabase.from("products").select(PRODUCT_SELECT)
          .eq("code", parsed.automat).eq("category", "automat").maybeSingle()
      : Promise.resolve({ data: null }),
    // leg (global)
    parsed.legs
      ? supabase.from("products").select(PRODUCT_SELECT)
          .eq("code", parsed.legs.code).eq("category", "leg").maybeSingle()
      : Promise.resolve({ data: null }),
    // pillow (global, normalize P01→P1)
    parsed.pillow
      ? supabase.from("products").select(PRODUCT_SELECT)
          .eq("code", normalizeComponentCode(parsed.pillow.code)).eq("category", "pillow").maybeSingle()
      : Promise.resolve({ data: null }),
    // jasiek (global first, then series-scoped)
    parsed.jaski
      ? (async () => {
          const code = normalizeComponentCode(parsed.jaski!.code);
          // Try global first
          const { data: global } = await supabase.from("products").select(PRODUCT_SELECT)
            .eq("code", code).eq("category", "jasiek").eq("is_global", true).maybeSingle();
          if (global) return { data: global };
          // Fallback: series-scoped (e.g. J3 in S2)
          if (seriesId) {
            const { data: scoped } = await supabase.from("products").select(PRODUCT_SELECT)
              .eq("code", code).eq("category", "jasiek").eq("series_id", seriesId).maybeSingle();
            return { data: scoped };
          }
          return { data: null };
        })()
      : Promise.resolve({ data: null }),
    // walek (global, normalize W01→W1)
    parsed.walek
      ? supabase.from("products").select(PRODUCT_SELECT)
          .eq("code", normalizeComponentCode(parsed.walek.code)).eq("category", "walek").maybeSingle()
      : Promise.resolve({ data: null }),
    // finishes (all)
    supabase.from("products").select("code, name").eq("category", "finish"),
    // extras (series-scoped)
    seriesId && parsed.extras.length > 0
      ? supabase.from("products").select(PRODUCT_SELECT)
          .eq("category", "extra").eq("series_id", seriesId).in("code", parsed.extras)
      : Promise.resolve({ data: null }),
    // pufa seat
    seriesId
      ? supabase.from("products").select(PRODUCT_SELECT)
          .eq("code", seatCode).eq("category", "seat_pufa").eq("series_id", seriesId).maybeSingle()
      : Promise.resolve({ data: null }),
    // automat config from product_relations
    seriesId && parsed.automat
      ? (async () => {
          return { data: null };
        })()
      : Promise.resolve({ data: null }),
    // sewing variants for backrest
    seriesId && backrestProduct?.id
      ? supabase.from("product_relations")
          .select("properties")
          .eq("relation_type", "sewing_variant")
          .eq("target_product_id", backrestProduct.id)
          .eq("series_id", seriesId)
          .eq("active", true)
      : Promise.resolve({ data: null }),
  ]);

  const fabricProduct = fabricRes.data as unknown as ProductRow | null;
  const sideProduct = sideRes.data as unknown as ProductRow | null;
  const chestProduct = chestRes.data as unknown as ProductRow | null;
  const automatProduct = automatRes.data as unknown as ProductRow | null;
  const legProduct = legRes.data as unknown as ProductRow | null;
  const pillowProduct = pillowRes.data as unknown as ProductRow | null;
  const jaskiProduct = jaskiRes.data as unknown as ProductRow | null;
  const walekProduct = walekRes.data as unknown as ProductRow | null;
  const pufaSeatProduct = pufaSeatRes.data as unknown as ProductRow | null;

  // ---- Automat config (needs automatProduct.id) ----
  let automatSeatLegs = false;
  let automatSeatLegHeight = 0;
  let automatSeatLegCount = 0;

  if (seriesId && automatProduct?.id) {
    const { data: acData } = await supabase
      .from("product_relations")
      .select("properties")
      .eq("series_id", seriesId)
      .eq("relation_type", "automat_config")
      .eq("source_product_id", automatProduct.id)
      .maybeSingle();

    if (acData) {
      const acProps = acData.properties as any;
      automatSeatLegs = acProps?.has_seat_legs ?? false;
      automatSeatLegHeight = acProps?.seat_leg_height_cm ?? 0;
      automatSeatLegCount = acProps?.seat_leg_count ?? 0;
    }
  }

  // ---- Series config (from products.properties on series) ----
  const seriesProps = (seriesP?.properties ?? {}) as Record<string, any>;

  // ---- Build finishes map ----
  const FINISHES: Record<string, string> = {};
  if (finishesRes.data) {
    for (const f of finishesRes.data) {
      FINISHES[f.code] = f.name;
    }
  }

  // ---- Foams: seat + backrest (parallel) ----
  const [seatFoamsRes, backrestFoamsRes] = await Promise.all([
    seatProduct?.id
      ? supabase.from("product_specs")
          .select("position_number, name, material, height, width, length, quantity, notes")
          .eq("product_id", seatProduct.id)
          .eq("spec_type", "foam")
          .order("position_number")
      : Promise.resolve({ data: null }),
    backrestProduct?.id
      ? supabase.from("product_specs")
          .select("position_number, name, material, height, width, length, quantity, notes")
          .eq("product_id", backrestProduct.id)
          .eq("spec_type", "foam")
          .order("position_number")
      : Promise.resolve({ data: null }),
  ]);

  // Split seat foams: pufa foams (name contains "pufa") vs regular seat foams
  const allSeatFoams = (seatFoamsRes.data ?? []) as any[];
  const seatFoams: ProductFoamItem[] = [];
  const pufaFoams: ProductFoamItem[] = [];
  for (const f of allSeatFoams) {
    const name = (f.name ?? "").toLowerCase();
    if (name.includes("pufa")) {
      pufaFoams.push(mapFoam(f));
    } else {
      seatFoams.push(mapFoam(f));
    }
  }

  const backrestFoams: ProductFoamItem[] = (backrestFoamsRes.data ?? []).map(mapFoam);

  // ---- FABRIC ----
  const fabricColors = productColors(fabricProduct);
  const colorName = fabricColors[parsed.fabric.color] || parsed.fabric.color;

  // ---- SEAT ----
  const seatFinishName = FINISHES[seatFinish] || seatFinish;
  const seatType = prop(seatProduct, "seat_type", "");
  const seatSpringType = prop(seatProduct, "spring_type", "");
  const seatFrameModification = prop(seatProduct, "frame_modification", "");

  // ---- SIDE ----
  const sideName = sideProduct?.name ?? "Nieznany";
  const sideFrame = prop(sideProduct, "frame", "?");
  const sideDefaultFinish = sideProduct?.default_finish ?? "";
  const sideFinish = parsed.side.finish || sideDefaultFinish;

  // ---- BACKREST ----
  const backrestFrame = prop(backrestProduct, "frame", "?");
  const backrestTop = prop(backrestProduct, "top", "?");
  const backrestHeight = prop(backrestProduct, "height_cm", "?");
  const backrestSpringType = prop(backrestProduct, "spring_type", undefined);

  // ---- SEWING VARIANT ----
  let sewingVariantDescription = backrestTop; // fallback

  if (sewingVariantsRes.data && (sewingVariantsRes.data as any[]).length > 0) {
    const backrestFinish = parsed.backrest.finish;
    const seatModelTokens = seatModelName
      ? seatModelName.toLowerCase().split(/[\s,\/]+/).filter(Boolean)
      : [];

    const matchingVariant = (sewingVariantsRes.data as any[]).find(r => {
      const props = r.properties || {};
      if (props.finish && props.finish !== backrestFinish) return false;
      if (props.models && Array.isArray(props.models) && props.models.length > 0) {
        const variantModelTokens = props.models
          .flatMap((m: string) => m.toLowerCase().split(/[\s,\/]+/))
          .filter(Boolean);
        const hasModelMatch = seatModelTokens.some((t: string) => variantModelTokens.includes(t));
        if (!hasModelMatch) return false;
      }
      return true;
    });

    if (matchingVariant?.properties?.description) {
      sewingVariantDescription = matchingVariant.properties.description;
    }
  }

  // ---- CHEST ----
  const chestName = chestProduct?.name ?? "?";
  const chestLegHeight = prop(chestProduct, "leg_height_cm", 0) as number;
  const chestLegCount = (prop(chestProduct, "leg_count", 4) as number) || 4;

  // ---- AUTOMAT ----
  const automatName = automatProduct?.name ?? "?";
  const automatType = prop(automatProduct, "type", "?") as string;

  // ---- LEGS ----
  let legsDecoded: DecodedSKU["legs"] = undefined;
  if (parsed.legs) {
    const legColors = productColors(legProduct);
    legsDecoded = {
      code: parsed.legs.code,
      name: legProduct?.name ?? "?",
      material: prop(legProduct, "material", "?") as string,
      color: parsed.legs.color,
      colorName: parsed.legs.color ? (legColors[parsed.legs.color] || parsed.legs.color) : undefined,
    };
  }

  // ---- Leg heights for sofa ----
  const chestOverrideLeg = prop(chestProduct, "override_leg", null) as string | null;
  const sofaChestLeg = chestOverrideLeg
    ? { leg: chestOverrideLeg, height: chestLegHeight, count: chestLegCount }
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
      sofaSeatLeg = { leg: "N4", height: automatSeatLegHeight, count: automatSeatLegCount };
    }
  }

  // ---- PILLOW ----
  let pillowDecoded: DecodedSKU["pillow"] = undefined;
  if (parsed.pillow) {
    const pillowFinish = parsed.pillow.finish || pillowProduct?.default_finish || seatFinish;
    pillowDecoded = {
      code: parsed.pillow.code,
      name: pillowProduct?.name ?? "?",
      finish: pillowFinish,
      finishName: FINISHES[pillowFinish] || pillowFinish,
      constructionType: prop(pillowProduct, "construction_type", undefined),
      insertType: prop(pillowProduct, "insert_type", undefined),
    };
  }

  // ---- JASKI ----
  let jaskiDecoded: DecodedSKU["jaski"] = undefined;
  if (parsed.jaski) {
    const jaskiFinish = parsed.jaski.finish || seatFinish;
    jaskiDecoded = {
      code: parsed.jaski.code,
      name: jaskiProduct?.name ?? "?",
      finish: jaskiFinish,
      finishName: FINISHES[jaskiFinish] || jaskiFinish,
      constructionType: prop(jaskiProduct, "construction_type", undefined),
      insertType: prop(jaskiProduct, "insert_type", undefined),
    };
  }

  // ---- WALEK ----
  let walekDecoded: DecodedSKU["walek"] = undefined;
  if (parsed.walek) {
    const walekFinish = parsed.walek.finish || seatFinish;
    walekDecoded = {
      code: parsed.walek.code,
      name: walekProduct?.name ?? "?",
      finish: walekFinish,
      finishName: FINISHES[walekFinish] || walekFinish,
      constructionType: prop(walekProduct, "construction_type", undefined),
      insertType: prop(walekProduct, "insert_type", undefined),
    };
  }

  // ---- EXTRAS ----
  const extrasMap = new Map<string, { name: string; type: string }>();
  if (extrasRes.data) {
    for (const ex of extrasRes.data as any[]) {
      extrasMap.set(ex.code, { name: ex.name, type: prop(ex as any, "type", "") });
    }
  }
  const extrasDecoded = parsed.extras.map((e) => {
    const eData = extrasMap.get(e) || { name: "?", type: "?" };
    return { code: e, name: eData.name, type: eData.type };
  });

  // ---- PUFA SEAT ----
  let pufaSeatDecoded: DecodedSKU["pufaSeat"] = undefined;
  const hasPufa = parsed.extras.some((e) => e === "PF" || e === "PFO");
  if (hasPufa && pufaSeatProduct) {
    pufaSeatDecoded = {
      frontBack: prop(pufaSeatProduct, "front_back", "-"),
      sides: prop(pufaSeatProduct, "sides", "-"),
      foam: prop(pufaSeatProduct, "base_foam", "-"),
      box: prop(pufaSeatProduct, "box_height", "-"),
      foams: pufaFoams.length > 0 ? pufaFoams : undefined,
    };
  }

  // ---- PUFA / FOTEL LEGS (same as sofa seat legs from automat_config) ----
  let pufaLegsDecoded: DecodedSKU["pufaLegs"] = undefined;
  let fotelLegsDecoded: DecodedSKU["fotelLegs"] = undefined;

  if (hasPufa && legsDecoded) {
    pufaLegsDecoded = {
      code: `${legsDecoded.code}${legsDecoded.color || ""}`,
      height: seriesProps.pufa_leg_height_cm ?? 0,
      count: seriesProps.pufa_leg_count ?? 4,
    };
  }

  const hasFotel = parsed.extras.includes("FT");
  if (hasFotel && legsDecoded) {
    fotelLegsDecoded = {
      code: `${legsDecoded.code}${legsDecoded.color || ""}`,
      height: seriesProps.fotel_leg_height_cm ?? 15,
      count: seriesProps.fotel_leg_count ?? 4,
    };
  }

  // ---- Pufa / Fotel SKU generation ----
  let pufaSKU: string | undefined;
  if (hasPufa && parsed.legs) {
    const pufaType = parsed.extras.find((e) => e === "PF" || e === "PFO")!;
    pufaSKU = `${pufaType}-${parsed.series}-${parsed.fabric.code}${parsed.fabric.color}-${seatCode}-${parsed.legs.code}${parsed.legs.color || ""}`;
  }

  let fotelSKU: string | undefined;
  if (hasFotel && parsed.legs) {
    const jaskiPart = parsed.jaski ? `-${parsed.jaski.code}${parsed.jaski.finish || ""}` : "";
    fotelSKU = `FT-${parsed.series}-${parsed.fabric.code}${parsed.fabric.color}-${seatCode}-${parsed.side.code}${parsed.side.finish}${jaskiPart}-${parsed.legs.code}${parsed.legs.color || ""}`;
  }

  // ---- SPECIAL NOTES (conditional business rules) ----
  const specialNotes: string[] = [];
  if (seatCode === "SD01N" && parsed.side.code === "B9" && sideFinish === "B") {
    specialNotes.push("UWAGA: SD01N + B9B — przygotować listwę z płyty do opiankowania");
  }

  // ---- Build result ----
  return {
    series: seriesData,
    fabric: {
      code: parsed.fabric.code,
      name: fabricProduct?.name ?? "Nieznana",
      color: parsed.fabric.color,
      colorName,
      group: prop(fabricProduct, "price_group", 0) as number,
    },
    seat: {
      code: seatCode,
      type: seatType,
      modelName: seatModelName || undefined,
      finish: seatFinish,
      finishName: seatFinishName,
      frame: prop(seatProduct, "frame", "?"),
      foam: formatFoamsSummary(seatFoams),
      front: prop(seatProduct, "front", "?"),
      midStrip: prop(seatProduct, "center_strip", false) as boolean,
      springType: seatSpringType || undefined,
      frameModification: seatFrameModification || undefined,
      foams: seatFoams.length > 0 ? seatFoams : undefined,
    },
    side: {
      code: parsed.side.code,
      name: sideName,
      modelName: (prop(sideProduct, "model_name", null) as string | undefined) || undefined,
      frame: sideFrame,
      finish: sideFinish,
      finishName: FINISHES[sideFinish] || sideFinish,
    },
    backrest: {
      code: parsed.backrest.code,
      height: backrestHeight,
      frame: backrestFrame,
      foam: formatFoamsSummary(backrestFoams),
      top: sewingVariantDescription || backrestTop,
      finish: parsed.backrest.finish,
      finishName: FINISHES[parsed.backrest.finish] || parsed.backrest.finish,
      springType: backrestSpringType || undefined,
      foams: backrestFoams.length > 0 ? backrestFoams : undefined,
    },
    chest: { code: parsed.chest, name: chestName, legHeight: chestLegHeight, legCount: chestLegCount },
    automat: {
      code: parsed.automat,
      name: automatName,
      type: automatType,
      seatLegs: automatSeatLegs,
      seatLegHeight: automatSeatLegHeight,
      seatLegCount: automatSeatLegCount,
    },
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
    specialNotes: specialNotes.length > 0 ? specialNotes : undefined,
  };
}
