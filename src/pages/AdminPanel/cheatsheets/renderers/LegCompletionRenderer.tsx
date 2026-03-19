import type { SectionRendererProps } from "../types";
import { NoData } from "../shared/NoData";

interface CheatRow {
  element: string;
  detail: string;
  type: string;
  height: string;
  count: string;
  reason?: string;
}

export function LegCompletionRenderer({ data }: SectionRendererProps) {
  const config = data.seriesConfig;
  if (!config) return <NoData label="konfiguracja serii" />;

  const seatLegType = config.seat_leg_type ?? "from_sku";
  const pufaLegType = config.pufa_leg_type ?? "from_sku";
  const seatLegH = config.seat_leg_height_cm;
  const pufaLegH = config.pufa_leg_height_cm;
  const allowedChestCodes = data.getAllowedChestCodes();
  const chests = data.getByCategory("chest").filter(c => allowedChestCodes.includes(c.code));
  const automatConfigs = data.getRelationsByType("automat_config");
  const automats = data.getByCategory("automat");
  const automatNameMap = Object.fromEntries(automats.map(a => [a.code, a.name]));

  const doRows: CheatRow[] = [];
  const dontRows: CheatRow[] = [];

  // Chests
  for (const c of chests) {
    const legH = Number((c.properties as any)?.leg_height_cm ?? 0);
    const legCount = Number((c.properties as any)?.leg_count ?? 4);
    if (legH > 2.5) {
      doRows.push({
        element: "Pod skrzynią", detail: `${c.code} (${c.name})`,
        type: "N z SKU", height: `H${legH}cm`, count: `${legCount}szt`
      });
    } else if (legH > 0) {
      dontRows.push({
        element: "Pod skrzynią", detail: `${c.code} (${c.name})`,
        type: "N4 plastikowe", height: `${legH}cm`, count: `${legCount}szt`,
        reason: "tapicer ma na stanowisku"
      });
    } else {
      dontRows.push({
        element: "Pod skrzynią", detail: `${c.code} (${c.name})`,
        type: "BRAK", height: "—", count: "—",
        reason: "brak nóżek"
      });
    }
  }

  // Automats — descriptive format
  for (const rel of automatConfigs) {
    const props = rel.properties as any;
    const automatProduct = [...data.seriesComponents, ...data.globalProducts].find(p => p.id === rel.source_product_id);
    const aCode = automatProduct?.code ?? props?.automat_code ?? "?";
    const aName = automatProduct?.name ?? "";
    const suffix = aName ? `${aCode} (${aName})` : aCode;
    if (!props?.has_seat_legs) {
      dontRows.push({ element: "Pod siedziskiem", detail: "", type: "BRAK", height: "—", count: "—", reason: `gdy automat ${suffix}` });
    } else if (seatLegType === "from_sku") {
      doRows.push({ element: "Pod siedziskiem", detail: "", type: "N z SKU", height: `H${props?.seat_leg_height_cm ?? seatLegH ?? "?"}cm`, count: `${props?.seat_leg_count ?? 2}szt`, reason: `tylko gdy automat ${aCode}` });
    } else {
      dontRows.push({ element: "Pod siedziskiem", detail: "", type: "N4 plastikowe", height: "2.5cm", count: `${props?.seat_leg_count ?? 2}szt`, reason: "tapicer ma na stanowisku" });
    }
  }

  // Pufa
  const extras = data.getByCategory("extra");
  const hasPufa = extras.some(e => e.code === "PF" || e.code === "PFO");
  const hasFotel = extras.some(e => e.code === "FT");

  if (hasPufa) {
    const pufaLegCount = config.pufa_leg_count ?? 4;
    if (pufaLegType === "from_sku") {
      doRows.push({ element: "Pufa", detail: "", type: "N z SKU", height: `H${pufaLegH ?? "?"}cm`, count: `${pufaLegCount}szt` });
    } else {
      dontRows.push({ element: "Pufa", detail: "", type: "N4 plastikowe", height: "2.5cm", count: `${pufaLegCount}szt`, reason: "tapicer ma na stanowisku" });
    }
  }

  // Fotel
  if (hasFotel) {
    const fotelLegH = config.fotel_leg_height_cm ?? 15;
    const fotelLegCount = config.fotel_leg_count ?? 4;
    doRows.push({ element: "Fotel", detail: "", type: "N z SKU", height: `H${fotelLegH}cm`, count: `${fotelLegCount}szt` });
  }

  // Check if ALL legs are plastic (S2 case)
  const allPlastic = doRows.length === 0 && dontRows.length > 0 && dontRows.every(r => r.type.includes("plastikowe") || r.type === "BRAK");

  if (allPlastic) {
    // Find the plastic leg code/height from first plastic row
    const plasticRow = dontRows.find(r => r.type.includes("plastikowe"));
    const plasticType = plasticRow?.type ?? "N4 plastikowe";
    const plasticHeight = plasticRow?.height ?? "2.5cm";

    return (
      <div className="border-2 border-foreground rounded-lg p-6">
        <h3 className="text-xl font-bold mb-2">NÓŻKI — NIE KOMPLETOWAĆ</h3>
        <p className="text-base">
          Wszystkie nóżki w tej serii to <strong>{plasticType} {plasticHeight}</strong>.
        </p>
        <p className="text-base mt-2">
          Tapicer montuje na stanowisku. <strong>Nie kompletować.</strong>
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold mb-3">🟢 CO KOMPLETOWAĆ</h3>
        {doRows.length === 0 ? (
          <p className="text-muted-foreground py-2">Brak elementów do kompletacji.</p>
        ) : (
          <div className="space-y-2 text-sm">
            {doRows.map((r, i) => (
              <div key={i} className="border border-border p-2 rounded">
                <strong>{r.element}{r.detail ? ` ${r.detail}` : ""}:</strong> {r.type}, {r.height}, {r.count}{r.reason ? ` — ${r.reason}` : ""}
              </div>
            ))}
          </div>
        )}
      </div>

      {dontRows.length > 0 && (
        <div className="border-4 border-foreground rounded-lg p-4">
          <h3 className="text-2xl font-black mb-3">🔴 CZEGO NIE KOMPLETOWAĆ!</h3>
          <div className="space-y-2 text-lg font-bold">
            {dontRows.map((r, i) => (
              <p key={i}>
                ❌ {r.element}{r.detail ? ` ${r.detail}` : ""}: {r.type}{r.height !== "—" ? `, ${r.height}` : ""}{r.count !== "—" ? `, ${r.count}` : ""} — {r.reason}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
