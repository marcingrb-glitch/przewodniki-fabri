import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  seriesId: string;
  seriesCode: string;
  seriesName: string;
}

function NoData({ label }: { label: string }) {
  return <p className="text-destructive font-bold py-2">⚠️ BRAK DANYCH — {label} — uzupełnij w specyfikacji</p>;
}

const formatColors = (colors: any): string => {
  if (!colors) return "—";
  if (Array.isArray(colors)) {
    if (colors.length === 0) return "—";
    if (typeof colors[0] === "object") return colors.map((c: any) => `${c.code}=${c.name}`).join(", ");
    return colors.join(", ");
  }
  if (typeof colors === "object") {
    return Object.entries(colors).map(([k, v]) => `${k}=${v}`).join(", ");
  }
  return String(colors);
};

interface CheatRow {
  element: string;
  detail: string;
  type: string;
  height: string;
  count: string;
  reason?: string;
}

export default function NozkiSheet({ seriesId, seriesCode, seriesName }: Props) {
  const { data: config } = useQuery({
    queryKey: ["cheat-config", seriesId],
    queryFn: async () => {
      const { data } = await supabase.from("series_config").select("*").eq("series_id", seriesId).maybeSingle();
      return data;
    },
  });

  const { data: legs = [] } = useQuery({
    queryKey: ["cheat-legs", seriesId],
    queryFn: async () => {
      const { data } = await supabase.from("legs").select("*").eq("series_id", seriesId).order("code");
      return data ?? [];
    },
  });

  const availableChests: string[] = (config as any)?.available_chests ?? [];

  const { data: chests = [] } = useQuery({
    queryKey: ["cheat-chests", availableChests],
    queryFn: async () => {
      if (availableChests.length === 0) return [];
      const { data } = await supabase.from("chests").select("*").in("code", availableChests).order("code");
      return data ?? [];
    },
    enabled: availableChests.length > 0,
  });

  const { data: automats = [] } = useQuery({
    queryKey: ["cheat-automats", seriesId],
    queryFn: async () => {
      const { data } = await supabase.from("automats").select("*").eq("series_id", seriesId).order("code");
      return data ?? [];
    },
  });

  const seatLegType = config?.seat_leg_type ?? "from_sku";
  const pufaLegType = config?.pufa_leg_type ?? "from_sku";
  const seatLegH = config?.seat_leg_height_cm;
  const pufaLegH = config?.pufa_leg_height_cm;

  // Build doRows and dontRows
  const doRows: CheatRow[] = [];
  const dontRows: CheatRow[] = [];

  // --- Chests ---
  for (const c of chests) {
    if (c.leg_height_cm > 0) {
      doRows.push({
        element: "Pod skrzynią",
        detail: `${c.code} (${c.name})`,
        type: "N z SKU",
        height: `H${c.leg_height_cm}cm`,
        count: "4szt",
      });
    } else {
      dontRows.push({
        element: "Pod skrzynią",
        detail: `${c.code} (${c.name})`,
        type: "N4 plastikowe",
        height: "2.5cm",
        count: "4szt",
        reason: "tapicer ma na stanowisku",
      });
    }
  }

  // --- Automats (seats) ---
  for (const a of automats) {
    if (!a.has_seat_legs) {
      dontRows.push({
        element: "Pod siedziskiem",
        detail: `${a.code} (${a.name})`,
        type: "BRAK",
        height: "—",
        count: "—",
        reason: "brak nóżek pod siedziskiem",
      });
    } else if (seatLegType === "from_sku") {
      doRows.push({
        element: "Pod siedziskiem",
        detail: `${a.code} (${a.name})`,
        type: "N z SKU",
        height: `H${a.seat_leg_height_cm ?? seatLegH ?? "?"}cm`,
        count: `${a.seat_leg_count ?? 2}szt`,
      });
    } else {
      dontRows.push({
        element: "Pod siedziskiem",
        detail: `${a.code} (${a.name})`,
        type: seatLegType === "built_in_plastic" ? "wbudowane plastikowe" : "N4 plastikowe",
        height: seatLegType === "plastic_2_5" ? "2.5cm" : "—",
        count: `${a.seat_leg_count ?? 2}szt`,
        reason: seatLegType === "built_in_plastic" ? "wbudowane" : "tapicer ma na stanowisku",
      });
    }
  }

  // --- Pufa ---
  if (config) {
    if (pufaLegType === "from_sku") {
      doRows.push({
        element: "Pufa",
        detail: "",
        type: "N z SKU",
        height: `H${pufaLegH ?? "?"}cm`,
        count: "4szt",
      });
    } else {
      dontRows.push({
        element: "Pufa",
        detail: "",
        type: pufaLegType === "built_in_plastic" ? "wbudowane plastikowe" : "N4 plastikowe",
        height: pufaLegType === "plastic_2_5" ? "2.5cm" : "—",
        count: "4szt",
        reason: pufaLegType === "built_in_plastic" ? "wbudowane" : "tapicer ma na stanowisku",
      });
    }
  }

  // --- Fotel ---
  doRows.push({
    element: "Fotel",
    detail: "",
    type: "N z SKU",
    height: `H${seatLegH ?? pufaLegH ?? "?"}cm`,
    count: "4szt",
  });

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold border-b-2 border-foreground pb-2">
        ŚCIĄGAWKA — Kompletacja nóżek — {seriesCode} {seriesName}
      </h1>

      {/* CO KOMPLETOWAĆ */}
      <section>
        <h2 className="text-xl font-bold mb-3 text-green-700 dark:text-green-400">🟢 CO KOMPLETOWAĆ</h2>
        {!config ? <NoData label="konfiguracja serii" /> : doRows.length === 0 ? (
          <p className="text-muted-foreground py-2">Brak elementów do kompletacji nóżek w tej serii.</p>
        ) : (
          <div className="space-y-2 text-sm">
            {doRows.map((r, i) => (
              <div key={i} className="border border-border p-2 rounded">
                <strong>{r.element}{r.detail ? ` ${r.detail}` : ""}:</strong>{" "}
                {r.type}, {r.height}, {r.count}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* CZEGO NIE KOMPLETOWAĆ */}
      <section>
        <div className="border-4 border-red-600 rounded-lg p-4 bg-red-50 dark:bg-red-950/30">
          <h2 className="text-2xl font-black mb-3 text-red-700 dark:text-red-400">🔴 CZEGO NIE KOMPLETOWAĆ!</h2>
          <div className="space-y-2 text-lg font-bold">
            <p className="warning underline text-xl">❌ Nóżki plastikowe 2.5cm — NIGDY nie kompletować!</p>
            {dontRows.map((r, i) => (
              <p key={i}>
                ❌ {r.element}{r.detail ? ` ${r.detail}` : ""}: {r.type}{r.height !== "—" ? `, ${r.height}` : ""}{r.count !== "—" ? `, ${r.count}` : ""} — {r.reason}
              </p>
            ))}
          </div>
        </div>
      </section>

      {/* Tabela typów nóżek */}
      <section className="page-break">
        <h2 className="text-lg font-bold mb-2">👟 Typy nóżek w serii {seriesCode}</h2>
        {legs.length === 0 ? <NoData label="nóżki" /> : (
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-muted">
                <th className="border border-border px-2 py-1 text-left">Kod</th>
                <th className="border border-border px-2 py-1 text-left">Nazwa</th>
                <th className="border border-border px-2 py-1 text-left">Materiał</th>
                <th className="border border-border px-2 py-1 text-left">Kolory</th>
              </tr>
            </thead>
            <tbody>
              {legs.map(l => (
                <tr key={l.id}>
                  <td className="border border-border px-2 py-1 font-mono font-bold">{l.code}</td>
                  <td className="border border-border px-2 py-1">{l.name}</td>
                  <td className="border border-border px-2 py-1">{l.material ?? "—"}</td>
                  <td className="border border-border px-2 py-1">{formatColors(l.colors)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
