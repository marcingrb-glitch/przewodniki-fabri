import type { SectionRendererProps } from "../types";
import { GenericTableRenderer } from "./GenericTableRenderer";
import { SpringsTableRenderer } from "./SpringsTableRenderer";
import { SeatsDetailRenderer } from "./SeatsDetailRenderer";
import { BackrestsDetailRenderer } from "./BackrestsDetailRenderer";
import { FinishLegendRenderer } from "./FinishLegendRenderer";
import { FinishWarningsRenderer } from "./FinishWarningsRenderer";
import { FinishesTableRenderer } from "./FinishesTableRenderer";
import { SewingVariantsRenderer } from "./SewingVariantsRenderer";
import { PillowMappingRenderer } from "./PillowMappingRenderer";
import { FabricsTableRenderer } from "./FabricsTableRenderer";
import { LegCompletionRenderer } from "./LegCompletionRenderer";
import { SeriesConfigRenderer } from "./SeriesConfigRenderer";
import { SeatsCompactRenderer } from "./SeatsCompactRenderer";
import { BackrestsCompactRenderer } from "./BackrestsCompactRenderer";
import { AutomatsTableRenderer } from "./AutomatsTableRenderer";
import React from "react";

export const rendererRegistry: Record<string, React.ComponentType<SectionRendererProps>> = {
  generic_table: GenericTableRenderer,
  springs_table: SpringsTableRenderer,
  seats_detail: SeatsDetailRenderer,
  backrests_detail: BackrestsDetailRenderer,
  finish_legend: FinishLegendRenderer,
  finish_warnings: FinishWarningsRenderer,
  finishes_table: FinishesTableRenderer,
  sewing_variants: SewingVariantsRenderer,
  pillow_mapping: PillowMappingRenderer,
  fabrics_table: FabricsTableRenderer,
  leg_completion: LegCompletionRenderer,
  series_config_summary: SeriesConfigRenderer,
  seats_compact_table: SeatsCompactRenderer,
  backrests_compact_table: BackrestsCompactRenderer,
  automats_table: AutomatsTableRenderer,
};

// Section icons by renderer type
export const sectionIcons: Record<string, string> = {
  springs_table: "🔩",
  seats_detail: "🪑",
  seats_compact_table: "🪑",
  backrests_detail: "🛋️",
  backrests_compact_table: "🛋️",
  finish_legend: "🎨",
  finish_warnings: "⚠️",
  finishes_table: "✂️",
  sewing_variants: "🧵",
  pillow_mapping: "🛏️",
  fabrics_table: "🧵",
  leg_completion: "👟",
  generic_table: "📋",
  series_config_summary: "⚙️",
  automats_table: "🔧",
};
