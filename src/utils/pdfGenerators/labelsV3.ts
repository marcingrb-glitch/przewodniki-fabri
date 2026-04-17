/**
 * Etykiety V3 — tryb HYBRID: duże V2 dla wybranych komponentów (include_in_v3=true)
 * + małe V1 dla komponentów nie pokrytych przez V2.
 *
 * Output: DWA pliki PDF (różne rozmiary drukarek):
 *   v3_large.pdf — 100×150mm (duże V2, drukarka szeroka)
 *   v3_small.pdf — 100×30mm  (małe V1, drukarka wąska)
 *
 * Patrz plan: .claude/plans/mossy-riding-bear.md
 */
import { DecodedSKU } from "@/types";
import { createDoc, addLabel, toBlob } from "@/utils/pdfHelpers";
import {
  fetchSheets,
  shouldShowSheet,
  renderSheet,
  renderCutSheetS1,
  V2_PAGE,
  type LabelTemplateV2,
} from "./labelsV2";
import {
  fetchTemplates,
  fetchLabelSettings,
  shouldShow,
  buildLabelLines,
  type LabelTemplate,
} from "./labels";

export interface LabelsV3Result {
  large: Blob | null; // null when no V2 sheets apply
  small: Blob | null; // null when no V1 templates remain
}

/**
 * Collect components covered by V2 sheets selected for V3 (include_in_v3=true).
 * Returns a set of V1 component names (seat, side, chest, ...) that should be
 * filtered OUT of the small V1 PDF (since they're already on large V2).
 */
function collectCoveredComponents(v2Sheets: LabelTemplateV2[]): Set<string> {
  const covered = new Set<string>();
  for (const sheet of v2Sheets) {
    const sections = sheet.sections ?? [];
    for (const section of sections) {
      if (section.component) covered.add(section.component);
    }
  }
  // Chaise sections cover chaise_seat/chaise_backrest too — map them to broader components
  // (for V1 small, keep chaise-specific V1 out if main chaise covered).
  if (covered.has("chaise") || covered.has("chaise_seat") || covered.has("chaise_backrest")) {
    covered.add("chaise");
    covered.add("chaise_seat");
    covered.add("chaise_backrest");
    covered.add("leg_chaise");
  }
  return covered;
}

async function renderLargeV2(
  decoded: DecodedSKU,
  productType: "sofa" | "naroznik" | "pufa" | "fotel"
): Promise<{ blob: Blob | null; coveredComponents: Set<string>; cutSheetRendered: boolean }> {
  const allSheets = await fetchSheets(productType, decoded.series.code);
  const v3Sheets = allSheets
    .filter((s) => s.include_in_v3)
    .filter((s) => shouldShowSheet(decoded, s));

  const covered = collectCoveredComponents(v3Sheets);

  // Cut sheet covers side, chest, leg_seat, leg_chest — only for S1 sofa
  const shouldCutSheet =
    productType === "sofa" && decoded.series.code === "S1";

  if (v3Sheets.length === 0 && !shouldCutSheet) {
    return { blob: null, coveredComponents: covered, cutSheetRendered: false };
  }

  const doc = await createDoc("portrait", [V2_PAGE.width, V2_PAGE.height]);

  let isFirst = true;
  for (const sheet of v3Sheets) {
    renderSheet(doc, sheet, decoded, isFirst);
    isFirst = false;
  }

  let cutSheetRendered = false;
  if (shouldCutSheet) {
    cutSheetRendered = await renderCutSheetS1(doc, decoded, isFirst);
    if (cutSheetRendered) {
      // Components on cut sheet are "covered" — don't duplicate in small V1
      covered.add("side");
      covered.add("chest");
      covered.add("leg_seat");
      covered.add("leg_chest");
      isFirst = false;
    }
  }

  if (isFirst) {
    // Nothing was rendered — return null
    return { blob: null, coveredComponents: covered, cutSheetRendered: false };
  }

  return { blob: toBlob(doc), coveredComponents: covered, cutSheetRendered };
}

async function renderSmallV1(
  decoded: DecodedSKU,
  productType: "sofa" | "naroznik" | "pufa" | "fotel",
  coveredComponents: Set<string>
): Promise<Blob | null> {
  const [allTemplates, settings] = await Promise.all([
    fetchTemplates(productType, decoded.series.code),
    fetchLabelSettings(),
  ]);

  // Keep only templates whose component is NOT covered by V2
  const remaining: LabelTemplate[] = allTemplates.filter(
    (t) => !coveredComponents.has(t.component)
  );

  const visible = remaining.filter((t) => shouldShow(decoded, t));
  if (visible.length === 0) return null;

  const doc = await createDoc("landscape", [100, 30]);

  let isFirst = true;
  for (const tpl of visible) {
    const lines = buildLabelLines(decoded, tpl, productType, settings);
    for (let i = 0; i < tpl.quantity; i++) {
      addLabel(doc, lines, isFirst, settings);
      isFirst = false;
    }
  }

  if (isFirst) return null;
  return toBlob(doc);
}

/**
 * Main V3 entry point — returns two optional blobs.
 */
export async function generateLabelsV3PDF(
  decoded: DecodedSKU,
  productType: "sofa" | "naroznik" | "pufa" | "fotel"
): Promise<LabelsV3Result> {
  const { blob: largeBlob, coveredComponents } = await renderLargeV2(decoded, productType);
  const smallBlob = await renderSmallV1(decoded, productType, coveredComponents);

  return {
    large: largeBlob,
    small: smallBlob,
  };
}

/**
 * Legacy-style wrappers matching V1/V2 entry points.
 */
export async function generateSofaLabelsV3PDF(decoded: DecodedSKU): Promise<LabelsV3Result> {
  const type = decoded.chaise ? "naroznik" : "sofa";
  return generateLabelsV3PDF(decoded, type);
}

export async function generatePufaLabelsV3PDF(decoded: DecodedSKU): Promise<LabelsV3Result> {
  return generateLabelsV3PDF(decoded, "pufa");
}

export async function generateFotelLabelsV3PDF(decoded: DecodedSKU): Promise<LabelsV3Result> {
  return generateLabelsV3PDF(decoded, "fotel");
}
