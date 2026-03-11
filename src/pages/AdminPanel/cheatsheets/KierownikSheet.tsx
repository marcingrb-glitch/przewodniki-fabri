import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  seriesId: string;
  seriesCode: string;
  seriesName: string;
}

function NoData({ label }: {label: string;}) {
  return <p className="text-destructive font-bold py-2">⚠️ BRAK DANYCH — {label} — uzupełnij w specyfikacji</p>;
}

const formatLegType = (type: string | null, height: number | null): string => {
  if (!type) return '—';
  switch (type) {
    case 'plastic_2_5': return `N4 plastikowe, H${height}cm`;
    case 'from_sku': return `Z segmentu N (z SKU), H${height}cm`;
    default: return `${type}, H${height}cm`;
  }
};

const formatColors = (colors: any): string => {
  if (!colors) return '—';
  if (Array.isArray(colors)) {
    if (colors.length === 0) return '—';
    if (typeof colors[0] === 'object') return colors.map((c: any) => `${c.code}=${c.name}`).join(', ');
    return colors.join(', ');
  }
  if (typeof colors === 'object') {
    return Object.entries(colors).map(([k, v]) => `${k}=${v}`).join(', ');
  }
  return String(colors);
};

export default function KierownikSheet({ seriesId, seriesCode, seriesName }: Props) {
  const { data: config } = useQuery({
    queryKey: ["cheat-config", seriesId],
    queryFn: async () => {
      const { data } = await supabase.from("series_config").select("*").eq("series_id", seriesId).maybeSingle();
      return data;
    }
  });

  const { data: seats = [] } = useQuery({
    queryKey: ["cheat-seats", seriesId],
    queryFn: async () => {
      const { data } = await supabase.from("seats_sofa").select("*").eq("series_id", seriesId).order("code");
      return data ?? [];
    }
  });

  const { data: foams = [] } = useQuery({
    queryKey: ["cheat-foams", seriesId],
    queryFn: async () => {
      const { data } = await supabase.from("product_foams").select("*").eq("series_id", seriesId).order("seat_code,position_number");
      return data ?? [];
    }
  });

  const { data: backrests = [] } = useQuery({
    queryKey: ["cheat-backrests", seriesId],
    queryFn: async () => {
      const { data } = await supabase.from("backrests").select("*").eq("series_id", seriesId).order("code");
      return data ?? [];
    }
  });

  const { data: sides = [] } = useQuery({
    queryKey: ["cheat-sides", seriesId],
    queryFn: async () => {
      const { data } = await supabase.from("sides").select("*").eq("series_id", seriesId).order("code");
      return data ?? [];
    }
  });

  const { data: legs = [] } = useQuery({
    queryKey: ["cheat-legs-global"],
    queryFn: async () => {
      const { data } = await supabase.from("legs").select("*").order("code");
      return data ?? [];
    }
  });

  const { data: seriesAutomats = [] } = useQuery({
    queryKey: ["cheat-series-automats", seriesId],
    queryFn: async () => {
      const { data } = await supabase.from("series_automats" as any).select("*").eq("series_id", seriesId).order("automat_code");
      return (data ?? []) as unknown as { automat_code: string; has_seat_legs: boolean; seat_leg_height_cm: number | null; seat_leg_count: number | null }[];
    }
  });

  const { data: globalAutomats = [] } = useQuery({
    queryKey: ["cheat-global-automats"],
    queryFn: async () => {
      const { data } = await supabase.from("automats").select("code, name, type").order("code");
      return (data ?? []) as { code: string; name: string; type: string | null }[];
    }
  });

  const { data: seatsPufa = [] } = useQuery({
    queryKey: ["cheat-pufa", seriesId],
    queryFn: async () => {
      const { data } = await supabase.from("seats_pufa").select("*").eq("series_id", seriesId).order("code");
      return data ?? [];
    }
  });

  const { data: finishes = [] } = useQuery({
    queryKey: ["cheat-finishes"],
    queryFn: async () => {
      const { data } = await supabase.from("finishes").select("*").order("code");
      return data ?? [];
    }
  });

  const { data: fabrics = [] } = useQuery({
    queryKey: ["cheat-fabrics"],
    queryFn: async () => {
      const { data } = await supabase.from("fabrics").select("*").order("code");
      return data ?? [];
    }
  });

  const availableChests: string[] = (config as any)?.available_chests ?? [];

  const { data: chests = [] } = useQuery({
    queryKey: ["cheat-chests-kier", availableChests],
    queryFn: async () => {
      if (availableChests.length === 0) return [];
      const { data } = await supabase.from("chests").select("*").in("code", availableChests).order("code");
      return data ?? [];
    },
    enabled: availableChests.length > 0
  });

  const springExceptions = config?.spring_exceptions as Array<{model: string;spring: string;}> ?? [];

  // Aggregate product_foams per seat_code+component
  const formatFoamsForCode = (code: string, component: string): string => {
    const matching = foams.filter((f: any) => f.seat_code === code && f.component === component);
    if (matching.length === 0) return "—";
    return matching
      .sort((a: any, b: any) => (a.position_number ?? 0) - (b.position_number ?? 0))
      .map((f: any) => {
        const dims = [f.quantity && f.quantity > 1 ? `${f.quantity}×` : "", f.height, f.width, f.length].filter(Boolean);
        const dimStr = f.quantity && f.quantity > 1
          ? `${f.quantity} × ${f.height ?? "?"} × ${f.width ?? "?"} × ${f.length ?? "?"}`
          : `${f.height ?? "?"} × ${f.width ?? "?"} × ${f.length ?? "?"}`;
        return `${dimStr} ${f.material ?? ""}`.trim();
      })
      .join(" + ");
  };

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold border-b-2 border-foreground pb-2">
        SPECYFIKACJA PRODUKCYJNA — {seriesCode} {seriesName}
      </h1>

      {finishes.length > 0 &&
      <div className="border-2 border-border rounded p-2 bg-muted text-sm font-bold">
          LEGENDA WYKOŃCZEŃ: {finishes.map((f) => `${f.code} = ${f.name}`).join(" | ")}
        </div>
      }

      {/* Konfiguracja ogólna */}
      <section>
        <h2 className="text-lg font-bold mb-2">⚙️ Konfiguracja</h2>
        {!config ? <NoData label="konfiguracja" /> :
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
        }
      </section>

      {/* Skrzynie */}
      {chests.length > 0 &&
      <section>
          <h2 className="text-lg font-bold mb-2">📦 Skrzynie ({chests.length})</h2>
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-muted">
                <th className="border border-border px-1 py-1 text-left">Kod</th>
                <th className="border border-border px-1 py-1 text-left">Nazwa</th>
                <th className="border border-border px-1 py-1 text-left">Wys. nóżek</th>
              </tr>
            </thead>
            <tbody>
              {chests.map((c) =>
            <tr key={c.id}>
                  <td className="border border-border px-1 py-0.5 font-mono">{c.code}</td>
                  <td className="border border-border px-1 py-0.5">{c.name}</td>
                  <td className="border border-border px-1 py-0.5">{c.leg_height_cm} cm</td>
                </tr>
            )}
            </tbody>
          </table>
        </section>
      }

      {/* Siedziska sofa */}
      <section className="mb-6 avoid-break">
        <h2 className="text-lg font-bold mb-2">🪑 Siedziska sofa ({seats.length})</h2>
        {seats.length === 0 ? <NoData label="siedziska" /> :
        <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-muted">
                <th className="border border-border px-1 py-1 text-left">Kod</th>
                <th className="border border-border px-1 py-1 text-left">Model</th>
                <th className="border border-border px-1 py-1 text-left">Typ</th>
                <th className="border border-border px-1 py-1 text-left">Stelaż</th>
                <th className="border border-border px-1 py-1 text-left">Mod.</th>
                <th className="border border-border px-1 py-1 text-left">Sprężyna</th>
                <th className="border border-border px-1 py-1 text-left">Pianka</th>
                <th className="border border-border px-1 py-1 text-left">Pasek</th>
                <th className="border border-border px-1 py-1 text-left">Wykoń.</th>
              </tr>
            </thead>
            <tbody>
              {seats.map((s) => {
              const exc = springExceptions.find((e) => e.model === s.code);
              const spring = exc?.spring ?? s.spring_type ?? config?.default_spring ?? "B";
              return (
                <tr key={s.id} className={exc ? "bg-red-100 dark:bg-red-900/30" : ""}>
                    <td className="border border-border px-1 py-0.5 font-mono">{s.code}</td>
                    <td className="border border-border px-1 py-0.5">{s.model_name ?? "—"}</td>
                    <td className="border border-border px-1 py-0.5">{s.type ?? "—"}</td>
                    <td className="border border-border px-1 py-0.5">{s.frame ?? "—"}</td>
                    <td className="border border-border px-1 py-0.5">{s.frame_modification ?? "—"}</td>
                    <td className="border border-border px-1 py-0.5 font-bold">{spring}</td>
                    <td className="border border-border px-1 py-0.5">{formatFoamsForCode(s.code, "siedzisko")}</td>
                    <td className="border border-border px-1 py-0.5 font-bold">{s.center_strip ? "TAK" : "—"}</td>
                    <td className="border border-border px-1 py-0.5">{(s.allowed_finishes ?? []).join(",")}</td>
                  </tr>);

            })}
            </tbody>
          </table>
        }
      </section>

      {/* Oparcia */}
      <section className="mb-6 avoid-break">
        <h2 className="text-lg font-bold mb-2">🛋️ Oparcia ({backrests.length})</h2>
        {backrests.length === 0 ? <NoData label="oparcia" /> :
        <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-muted">
                <th className="border border-border px-1 py-1 text-left">Kod</th>
                <th className="border border-border px-1 py-1 text-left">Wys.</th>
                <th className="border border-border px-1 py-1 text-left">Stelaż</th>
                <th className="border border-border px-1 py-1 text-left">Pianka</th>
                <th className="border border-border px-1 py-1 text-left">Góra</th>
                <th className="border border-border px-1 py-1 text-left">Wykoń.</th>
              </tr>
            </thead>
            <tbody>
              {backrests.map((b) =>
            <tr key={b.id}>
                  <td className="border border-border px-1 py-0.5 font-mono">{b.code}</td>
                  <td className="border border-border px-1 py-0.5">{b.height_cm ?? "—"}</td>
                  <td className="border border-border px-1 py-0.5">{b.frame ?? "—"}</td>
                  <td className="border border-border px-1 py-0.5">{formatFoamsForCode(b.code, "oparcie")}</td>
                  <td className="border border-border px-1 py-0.5">{b.top ?? "—"}</td>
                  <td className="border border-border px-1 py-0.5">{(b.allowed_finishes ?? []).join(",")}</td>
                </tr>
            )}
            </tbody>
          </table>
        }
      </section>

      {/* Boczki */}
      <section className="mb-6 avoid-break">
        <h2 className="text-lg font-bold mb-2">📐 Boczki ({sides.length})</h2>
        {sides.length === 0 ? <NoData label="boczki" /> :
        <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-muted">
                <th className="border border-border px-1 py-1 text-left">Kod</th>
                <th className="border border-border px-1 py-1 text-left">Nazwa</th>
                <th className="border border-border px-1 py-1 text-left">Stelaż</th>
                <th className="border border-border px-1 py-1 text-left">Wykoń.</th>
              </tr>
            </thead>
            <tbody>
              {sides.map((s) =>
            <tr key={s.id}>
                  <td className="border border-border px-1 py-0.5 font-mono">{s.code}</td>
                  <td className="border border-border px-1 py-0.5">{s.name}</td>
                  <td className="border border-border px-1 py-0.5">{s.frame ?? "—"}</td>
                  <td className="border border-border px-1 py-0.5">{(s.allowed_finishes ?? []).join(",")}</td>
                </tr>
            )}
            </tbody>
          </table>
        }
      </section>

      {/* Nóżki */}
      <section className="mb-6 avoid-break">
        <h2 className="text-lg font-bold mb-2">👟 Nóżki ({legs.length})</h2>
        {legs.length === 0 ? <NoData label="nóżki" /> :
        <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-muted">
                <th className="border border-border px-1 py-1 text-left">Kod</th>
                <th className="border border-border px-1 py-1 text-left">Nazwa</th>
                <th className="border border-border px-1 py-1 text-left">Materiał</th>
                <th className="border border-border px-1 py-1 text-left">Kolory</th>
              </tr>
            </thead>
            <tbody>
              {legs.map((l) =>
            <tr key={l.id}>
                  <td className="border border-border px-1 py-0.5 font-mono">{l.code}</td>
                  <td className="border border-border px-1 py-0.5">{l.name}</td>
                  <td className="border border-border px-1 py-0.5">{l.material ?? "—"}</td>
                  <td className="border border-border px-1 py-0.5">{formatColors(l.colors)}</td>
                </tr>
            )}
            </tbody>
          </table>
        }
      </section>

      {/* Automaty */}
      {seriesAutomats.length > 0 &&
      <section className="mb-6 avoid-break">
          <h2 className="text-lg font-bold mb-2">🔧 Automaty ({seriesAutomats.length})</h2>
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-muted">
                <th className="border border-border px-1 py-1 text-left">Kod</th>
                <th className="border border-border px-1 py-1 text-left">Nazwa</th>
                <th className="border border-border px-1 py-1 text-left">Typ</th>
                <th className="border border-border px-1 py-1 text-left">Nóżki siedziska</th>
              </tr>
            </thead>
            <tbody>
              {seriesAutomats.map((sa, i) => {
                const ga = globalAutomats.find(g => g.code === sa.automat_code);
                return (
              <tr key={i}>
                    <td className="border border-border px-1 py-0.5 font-mono">{sa.automat_code}</td>
                    <td className="border border-border px-1 py-0.5">{ga?.name ?? "?"}</td>
                    <td className="border border-border px-1 py-0.5">{ga?.type ?? "—"}</td>
                    <td className="border border-border px-1 py-0.5">{sa.has_seat_legs ? `Tak, ${sa.seat_leg_count}szt, H${sa.seat_leg_height_cm}cm` : "Nie"}</td>
                  </tr>
                );
              })}

            </tbody>
          </table>
        </section>
      }

      {/* Pufa */}
      {seatsPufa.length > 0 &&
      <section className="mb-6 avoid-break">
          <h2 className="text-lg font-bold mb-2">🟫 Pufa ({seatsPufa.length})</h2>
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-muted">
                <th className="border border-border px-1 py-1 text-left">Kod</th>
                <th className="border border-border px-1 py-1 text-left">Przód/tył</th>
                <th className="border border-border px-1 py-1 text-left">Boki</th>
                <th className="border border-border px-1 py-1 text-left">Pianka bazy</th>
                <th className="border border-border px-1 py-1 text-left">Wys. skrzynki</th>
              </tr>
            </thead>
            <tbody>
              {seatsPufa.map((p) =>
            <tr key={p.id}>
                  <td className="border border-border px-1 py-0.5 font-mono">{p.code}</td>
                  <td className="border border-border px-1 py-0.5">{p.front_back ?? "—"}</td>
                  <td className="border border-border px-1 py-0.5">{p.sides ?? "—"}</td>
                  <td className="border border-border px-1 py-0.5">{p.base_foam ?? "—"}</td>
                  <td className="border border-border px-1 py-0.5">{p.box_height ?? "—"}</td>
                </tr>
            )}
            </tbody>
          </table>
        </section>
      }

      {/* Tkaniny */}
      <section className="mb-6 avoid-break">
        <h2 className="text-lg font-bold mb-2">🧵 Tkaniny ({fabrics.length})</h2>
        {fabrics.length === 0 ? <NoData label="tkaniny" /> :
        <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-muted">
                <th className="border border-border px-1 py-1 text-left">Kod</th>
                <th className="border border-border px-1 py-1 text-left">Nazwa</th>
                <th className="border border-border px-1 py-1 text-left">Grupa</th>
                <th className="border border-border px-1 py-1 text-left">Kolory</th>
              </tr>
            </thead>
            <tbody>
              {fabrics.map((f) =>
            <tr key={f.id}>
                  <td className="border border-border px-1 py-0.5 font-mono font-bold">{f.code}</td>
                  <td className="border border-border px-1 py-0.5">{f.name}</td>
                  <td className="border border-border px-1 py-0.5">{f.price_group}</td>
                  <td className="border border-border px-1 py-0.5 text-xs">
                    {Array.isArray(f.colors) && f.colors.length > 0
                      ? (f.colors as any[]).map((c: any) => `${c.code}=${c.name}`).join(", ")
                      : "—"}
                  </td>
                </tr>
            )}
            </tbody>
          </table>
        }
      </section>
    </div>);

}