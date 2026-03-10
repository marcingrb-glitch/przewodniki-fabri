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

export default function KrojowniaSheet({ seriesId, seriesCode, seriesName }: Props) {
  const { data: seats = [] } = useQuery({
    queryKey: ["cheat-seats", seriesId],
    queryFn: async () => {
      const { data } = await supabase.from("seats_sofa").select("*").eq("series_id", seriesId).order("code");
      return data ?? [];
    },
  });

  const { data: sides = [] } = useQuery({
    queryKey: ["cheat-sides", seriesId],
    queryFn: async () => {
      const { data } = await supabase.from("sides").select("*").eq("series_id", seriesId).order("code");
      return data ?? [];
    },
  });

  const { data: backrests = [] } = useQuery({
    queryKey: ["cheat-backrests", seriesId],
    queryFn: async () => {
      const { data } = await supabase.from("backrests").select("*").eq("series_id", seriesId).order("code");
      return data ?? [];
    },
  });

  const { data: pillowMappings = [] } = useQuery({
    queryKey: ["cheat-pillow-map", seriesId],
    queryFn: async () => {
      const { data } = await supabase.from("seat_pillow_mapping").select("*").eq("series_id", seriesId);
      return data ?? [];
    },
  });

  const { data: finishes = [] } = useQuery({
    queryKey: ["cheat-finishes"],
    queryFn: async () => {
      const { data } = await supabase.from("finishes").select("*").order("code");
      return data ?? [];
    },
  });

  const { data: fabrics = [] } = useQuery({
    queryKey: ["cheat-fabrics"],
    queryFn: async () => {
      const { data } = await supabase.from("fabrics").select("*").order("code");
      return data ?? [];
    },
  });

  const { data: sewingVariants = [] } = useQuery({
    queryKey: ["cheat-sewing-variants", seriesId],
    queryFn: async () => {
      const { data } = await supabase.from("sewing_variants").select("*").eq("series_id", seriesId).eq("component_type", "backrest").order("variant_name");
      return data ?? [];
    },
  });

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold border-b-2 border-foreground pb-2">
        ŚCIĄGAWKA — Krojownia — {seriesCode} {seriesName}
      </h1>

      {finishes.length > 0 && (
        <div className="border-2 border-border rounded p-2 bg-muted text-sm font-bold">
          LEGENDA WYKOŃCZEŃ: {finishes.map(f => `${f.code} = ${f.name}`).join(" | ")}
        </div>
      )}

      {/* Pułapki */}
      <section>
        <h2 className="text-lg font-bold mb-2">⚠️ PUŁAPKI — PRZECZYTAJ UWAŻNIE!</h2>
        <div className="space-y-2">
          <p className="warning font-bold underline text-lg">
            Wykończenie poduszek / jaśków / wałków = DZIEDZICZONE od siedziska!
          </p>
          {seats.filter(s => {
            const finishes = s.allowed_finishes ?? [];
            return finishes.length > 1;
          }).map(s => (
            <p key={s.id} className="warning font-bold underline">
              {s.code} ({s.model_name ?? "—"}) — dozwolone: {(s.allowed_finishes ?? []).join(", ")} — uwaga na różne rysunki!
            </p>
          ))}
        </div>
      </section>

      {/* Dozwolone wykończenia - siedziska */}
      <section className="page-break">
        <h2 className="text-lg font-bold mb-2">✂️ Wykończenia siedzisk</h2>
        {seats.length === 0 ? <NoData label="siedziska" /> : (
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-muted">
                <th className="border border-border px-2 py-1 text-left">Kod</th>
                <th className="border border-border px-2 py-1 text-left">Model</th>
                <th className="border border-border px-2 py-1 text-left">Dozwolone</th>
                <th className="border border-border px-2 py-1 text-left">Domyślne</th>
              </tr>
            </thead>
            <tbody>
              {seats.map(s => (
                <tr key={s.id}>
                  <td className="border border-border px-2 py-1 font-mono">{s.code}</td>
                  <td className="border border-border px-2 py-1">{s.model_name ?? "—"}</td>
                  <td className="border border-border px-2 py-1">{(s.allowed_finishes ?? []).join(", ") || "—"}</td>
                  <td className="border border-border px-2 py-1 font-bold">{s.default_finish ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* Wykończenia boczków */}
      <section className="page-break">
        <h2 className="text-lg font-bold mb-2">📐 Wykończenia boczków</h2>
        {sides.length === 0 ? <NoData label="boczki" /> : (
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-muted">
                <th className="border border-border px-2 py-1 text-left">Kod</th>
                <th className="border border-border px-2 py-1 text-left">Nazwa</th>
                <th className="border border-border px-2 py-1 text-left">Dozwolone</th>
                <th className="border border-border px-2 py-1 text-left">Domyślne</th>
              </tr>
            </thead>
            <tbody>
              {sides.map(s => (
                <tr key={s.id}>
                  <td className="border border-border px-2 py-1 font-mono">{s.code}</td>
                  <td className="border border-border px-2 py-1">{s.name}</td>
                  <td className="border border-border px-2 py-1">{(s.allowed_finishes ?? []).join(", ") || "—"}</td>
                  <td className="border border-border px-2 py-1 font-bold">{s.default_finish ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* Wykończenia oparć */}
      <section className="page-break">
        <h2 className="text-lg font-bold mb-2">🛋️ Wykończenia oparć</h2>
        {backrests.length === 0 ? <NoData label="oparcia" /> : (
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-muted">
                <th className="border border-border px-2 py-1 text-left">Kod</th>
                <th className="border border-border px-2 py-1 text-left">Dozwolone</th>
                <th className="border border-border px-2 py-1 text-left">Domyślne</th>
              </tr>
            </thead>
            <tbody>
              {backrests.map(b => (
                <tr key={b.id}>
                  <td className="border border-border px-2 py-1 font-mono">{b.code}</td>
                  <td className="border border-border px-2 py-1">{(b.allowed_finishes ?? []).join(", ") || "—"}</td>
                  <td className="border border-border px-2 py-1 font-bold">{b.default_finish ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* Warianty szycia oparcia */}
      {sewingVariants.length > 0 && (
        <section className="page-break">
          <div className="border-4 border-orange-500 rounded-lg p-4 bg-orange-50 dark:bg-orange-950/30">
            <h2 className="text-lg font-bold mb-2 text-orange-700 dark:text-orange-400">⚠️ Warianty szycia oparcia — WAŻNE!</h2>
            <p className="text-sm mb-3 font-medium">Różne modele mają różne rysunki oparcia. Sprawdź model przed krojem!</p>
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-orange-100 dark:bg-orange-900/40">
                  <th className="border border-border px-2 py-1 text-left">Wariant</th>
                  <th className="border border-border px-2 py-1 text-left">Modele</th>
                  <th className="border border-border px-2 py-1 text-left">Opis</th>
                </tr>
              </thead>
              <tbody>
                {sewingVariants.map(v => (
                  <tr key={v.id}>
                    <td className="border border-border px-2 py-1 font-bold">{v.variant_name}</td>
                    <td className="border border-border px-2 py-1">{(v.models ?? []).join(", ")}</td>
                    <td className="border border-border px-2 py-1">{v.description ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Mapowanie poduszek */}
      {pillowMappings.length > 0 && (
        <section className="page-break">
          <h2 className="text-lg font-bold mb-2">🛏️ Poduszki per siedzisko</h2>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-muted">
                <th className="border border-border px-2 py-1 text-left">Siedzisko</th>
                <th className="border border-border px-2 py-1 text-left">Poduszka</th>
                <th className="border border-border px-2 py-1 text-left">Wykończenie</th>
              </tr>
            </thead>
            <tbody>
              {pillowMappings.map(m => (
                <tr key={m.id}>
                  <td className="border border-border px-2 py-1 font-mono">{m.seat_code}</td>
                  <td className="border border-border px-2 py-1">{m.pillow_code}</td>
                  <td className="border border-border px-2 py-1">{m.pillow_finish ?? "dziedziczone"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {/* Tkaniny */}
      <section className="page-break">
        <h2 className="text-lg font-bold mb-2">🧵 Tkaniny ({fabrics.length})</h2>
        {fabrics.length === 0 ? <NoData label="tkaniny" /> : (
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-muted">
                <th className="border border-border px-2 py-1 text-left">Kod</th>
                <th className="border border-border px-2 py-1 text-left">Nazwa</th>
                <th className="border border-border px-2 py-1 text-left">Grupa</th>
                <th className="border border-border px-2 py-1 text-left">Kolory</th>
              </tr>
            </thead>
            <tbody>
              {fabrics.map(f => (
                <tr key={f.id}>
                  <td className="border border-border px-2 py-1 font-mono font-bold">{f.code}</td>
                  <td className="border border-border px-2 py-1">{f.name}</td>
                  <td className="border border-border px-2 py-1">{f.price_group}</td>
                  <td className="border border-border px-2 py-1 text-xs">
                    {Array.isArray(f.colors) && f.colors.length > 0
                      ? (f.colors as any[]).map((c: any) => `${c.code}=${c.name}`).join(", ")
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
