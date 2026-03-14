import type { SectionRendererProps } from "../types";
import { formatLegType } from "../shared/helpers";
import { NoData } from "../shared/NoData";

export function SeriesConfigRenderer({ data }: SectionRendererProps) {
  const config = data.seriesConfig;
  if (!config) return <NoData label="konfiguracja" />;

  const availableChests = (config as any)?.available_chests as string[] ?? [];

  return (
    <div className="grid grid-cols-2 gap-2 text-sm border border-border p-3 rounded">
      <div><span className="text-muted-foreground">Sprężyna domyślna:</span> <strong>{config.default_spring ?? "B"}</strong></div>
      <div><span className="text-muted-foreground">Nóżki siedziska:</span> <strong>{formatLegType(config.seat_leg_type, config.seat_leg_height_cm)}</strong></div>
      <div><span className="text-muted-foreground">Nóżki pufa:</span> <strong>{formatLegType(config.pufa_leg_type, config.pufa_leg_height_cm)}</strong></div>
      <div><span className="text-muted-foreground">Stały automat:</span> <strong>{config.fixed_automat ?? "brak"}</strong></div>
      <div><span className="text-muted-foreground">Stałe oparcie:</span> <strong>{config.fixed_backrest ?? "brak"}</strong></div>
      <div><span className="text-muted-foreground">Stała skrzynia:</span> <strong>{config.fixed_chest ?? "brak"}</strong></div>
      <div><span className="text-muted-foreground">Dostępne skrzynie:</span> <strong>{availableChests.join(", ") || "—"}</strong></div>
      {config.notes && <div className="col-span-2"><span className="text-muted-foreground">Notatki:</span> {config.notes}</div>}
    </div>
  );
}
