import { ParsedSKU } from "@/types";
import { supabase } from "@/integrations/supabase/client";

// ======================================================
// SKU Segment Rules — cached per product type
// ======================================================

interface SegmentRule {
  segment_name: string;
  position: number;
  prefix: string | null;
  regex_pattern: string;
  capture_groups: Record<string, any>;
  is_optional: boolean;
  category: string;
  has_finish_suffix: boolean;
  zero_padded: boolean;
}

interface ProductTypeInfo {
  id: string;
  code: string;
  sku_prefix: string | null;
}

// In-memory cache (cleared on page reload)
let segmentRulesCache: Record<string, SegmentRule[]> = {};
let productTypesCache: ProductTypeInfo[] | null = null;

export function clearParserCache() {
  segmentRulesCache = {};
  productTypesCache = null;
}

async function loadProductTypes(): Promise<ProductTypeInfo[]> {
  if (productTypesCache) return productTypesCache;

  const { data, error } = await supabase
    .from("product_types")
    .select("id, code, sku_prefix")
    .eq("is_standalone", true);

  if (error) throw new Error(`Failed to load product_types: ${error.message}`);
  productTypesCache = (data ?? []) as ProductTypeInfo[];
  return productTypesCache;
}

async function loadSegmentRules(productTypeId: string): Promise<SegmentRule[]> {
  if (segmentRulesCache[productTypeId]) return segmentRulesCache[productTypeId];

  const { data, error } = await supabase
    .from("sku_segments")
    .select("segment_name, position, prefix, regex_pattern, capture_groups, is_optional, category, has_finish_suffix, zero_padded")
    .eq("product_type_id", productTypeId)
    .order("position");

  if (error) throw new Error(`Failed to load sku_segments: ${error.message}`);

  const rules = (data ?? []).map((r) => ({
    ...r,
    capture_groups: (typeof r.capture_groups === "string"
      ? JSON.parse(r.capture_groups)
      : r.capture_groups) as Record<string, any>,
  }));

  segmentRulesCache[productTypeId] = rules;
  return rules;
}

// ======================================================
// SKU Aliases — from product_relations (relation_type='sku_alias')
// Covers: side exceptions, chest aliases, etc.
// ======================================================

export async function fetchSkuAliases(
  seriesCode: string
): Promise<Record<string, string>> {
  const { data: seriesProduct } = await supabase
    .from("products")
    .select("id")
    .eq("code", seriesCode)
    .eq("category", "series")
    .maybeSingle();

  if (!seriesProduct) return {};

  // Fetch aliases for this series + global aliases
  const { data: relations } = await supabase
    .from("product_relations")
    .select("properties")
    .eq("relation_type", "sku_alias")
    .eq("active", true)
    .or(`series_id.eq.${seriesProduct.id},properties->>is_global.eq.true`);

  if (!relations) return {};

  const map: Record<string, string> = {};
  for (const r of relations) {
    const props = r.properties as Record<string, any> | null;
    if (props?.original_code && props?.mapped_code) {
      map[props.original_code] = props.mapped_code;
    }
  }
  return map;
}

/** @deprecated Use fetchSkuAliases instead */
export const fetchSideExceptionsGeneric = fetchSkuAliases;

// ======================================================
// Detect product type from first SKU segment
// ======================================================

async function detectProductType(firstSegment: string): Promise<ProductTypeInfo | null> {
  const types = await loadProductTypes();

  for (const pt of types) {
    if (pt.sku_prefix && firstSegment.startsWith(pt.sku_prefix)) {
      if (/^[A-Z]\d+$/.test(firstSegment)) {
        return pt;
      }
    }
  }
  return null;
}

// ======================================================
// Generic SKU Parser
// ======================================================

export async function parseSKUGeneric(
  sku: string,
  skuAliases?: Record<string, string>
): Promise<ParsedSKU> {
  const parts = sku.trim().toUpperCase().split("-");

  const result: ParsedSKU = {
    series: "",
    fabric: { code: "", color: "" },
    seat: { rawSegment: "" },
    side: { code: "", finish: "" },
    backrest: { code: "", finish: "" },
    chest: "",
    automat: "",
    extras: [],
    sideException: undefined,
  };

  if (parts.length === 0) return result;

  // 1. Detect product type from first segment
  const productType = await detectProductType(parts[0]);
  if (!productType) {
    result.series = parts[0];
    return result;
  }

  // 2. Load segment rules
  const rules = await loadSegmentRules(productType.id);
  if (rules.length === 0) {
    result.series = parts[0];
    return result;
  }

  // 3. Process each part
  const matchedRules = new Set<string>();
  let automatMatched = false;

  for (let part of parts) {
    let matched = false;

    // Pre-check: SKU aliases (side exceptions, chest aliases, etc.)
    if (skuAliases) {
      let mappedSegment: string | null = null;
      const originalPart = part;

      if (skuAliases[part]) {
        // Exact match (e.g. "B6D"→"B6C", "SK22"→"SK23")
        mappedSegment = skuAliases[part];
      } else if (part.length >= 3 && /[A-D]$/.test(part)) {
        // Strip finish, check base code (e.g. "B6SC" → base "B6S", finish "C")
        const baseCode = part.slice(0, -1);
        const finish = part.slice(-1);
        if (skuAliases[baseCode]) {
          const mappedBase = skuAliases[baseCode];
          // If mapped code already ends with A-D, it's an exact mapping — don't append finish
          // If not (alias), append the original finish
          if (/[A-D]$/.test(mappedBase)) {
            mappedSegment = mappedBase;
          } else {
            mappedSegment = mappedBase + finish;
          }
        }
      }

      if (mappedSegment) {
        result.sideException = `Zamieniono ${originalPart} → ${mappedSegment} (wyjątek Shopify)`;
        // Replace part and let normal rule matching handle it
        part = mappedSegment;
      }
    }

    // Try each rule (now with potentially aliased part)
    for (const rule of rules) {
      if (matchedRules.has(rule.segment_name) && rule.segment_name !== "extra") continue;

      if (rule.segment_name === "leg" && !automatMatched) continue;

      const captures = applyRule(rule, part);
      if (!captures) continue;

      applyToResult(result, rule, captures, part);
      matchedRules.add(rule.segment_name);
      if (rule.segment_name === "automat") automatMatched = true;
      matched = true;
      break;
    }

    // Fallback: extras (gdyby DB rule jeszcze nie dotarło / cache)
    if (!matched) {
      const m = part.match(/^(\d+X)?(PF|PFO|FT)$/);
      if (m) {
        const code = m[2];
        const qty = code === "FT" && m[1] ? parseInt(m[1].replace("X", ""), 10) || 1 : 1;
        for (let i = 0; i < qty; i++) result.extras.push(code);
      }
    }
  }

  return result;
}

// ======================================================
// Helpers
// ======================================================

function applyRule(rule: SegmentRule, part: string): Record<string, string> | null {
  const regex = new RegExp(rule.regex_pattern);
  const match = part.match(regex);
  if (!match) return null;

  const captures: Record<string, string> = {};
  for (const [name, groupIndex] of Object.entries(rule.capture_groups)) {
    captures[name] = match[groupIndex] || "";
  }
  return captures;
}

function applyToResult(
  result: ParsedSKU,
  rule: SegmentRule,
  captures: Record<string, string>,
  rawPart: string
) {
  switch (rule.segment_name) {
    case "series":
      result.series = rawPart;
      break;

    case "fabric":
      result.fabric = {
        code: captures.code ? `T${captures.code}` : rawPart,
        color: captures.color || "",
      };
      break;

    case "seat":
      result.seat = {
        rawSegment: captures.code ? `SD${captures.code}` : rawPart.replace(/[A-D]$/, ""),
        finish: captures.finish || undefined,
      };
      break;

    case "side": {
      const code = captures.code || "";
      result.side = { code: `B${code}`, finish: captures.finish || "" };
      break;
    }

    case "backrest":
      result.backrest = {
        code: captures.code ? `OP${captures.code}` : rawPart,
        finish: captures.finish || "",
      };
      break;

    case "chest": {
      const chestCode = captures.code ? `SK${captures.code}` : rawPart;
      // No more hardcoded SK22→SK23 — handled by sku_alias system
      result.chest = chestCode;
      break;
    }

    case "automat":
      result.automat = captures.code ? `AT${captures.code}` : rawPart;
      break;

    case "leg":
      result.legs = {
        code: captures.code ? `N${captures.code}` : rawPart,
        color: captures.color || undefined,
      };
      break;

    case "pillow":
      result.pillow = {
        code: captures.code ? `P${captures.code}` : rawPart,
        finish: captures.finish || undefined,
      };
      break;

    case "jasiek":
      result.jaski = {
        code: captures.code ? `J${captures.code}` : rawPart,
        finish: captures.finish || undefined,
      };
      break;

    case "walek":
      result.walek = {
        code: captures.code ? `W${captures.code}` : rawPart,
        finish: captures.finish || undefined,
      };
      break;

    case "extra": {
      const code = captures.code || rawPart;
      const qtyRaw = captures.quantity || "";
      const qty = code === "FT" && qtyRaw ? parseInt(qtyRaw.replace("X", ""), 10) || 1 : 1;
      for (let i = 0; i < qty; i++) result.extras.push(code);
      break;
    }

    case "width":
      result.width = captures.width || "";
      result.orientation = (captures.orientation || "") as "L" | "P";
      break;

    default:
      console.warn(`[SKU Parser] Unknown segment: ${rule.segment_name} for part: ${rawPart}`);
  }
}
