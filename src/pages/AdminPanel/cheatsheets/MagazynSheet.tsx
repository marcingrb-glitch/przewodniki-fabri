import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Json } from "@/integrations/supabase/types";

interface Props {
  seriesId: string;
  seriesCode: string;
  seriesName: string;
}

function NoData({ label }: { label: string }) {
  return <p className="text-destructive font-bold py-2">⚠️ BRAK DANYCH — {label} — uzupełnij w specyfikacji</p>;
}

export default function MagazynSheet({ seriesId, seriesCode, seriesName }: Props) {
  const { data: config } = useQuery({
    queryKey: ["cheat-config", seriesId],
    queryFn: async () => {
      const { data } = await supabase.from("series_config").select("*").eq("series_id", seriesId).maybeSingle();
      return data;
    },
  });

  const { data: seats = [] } = useQuery({
    queryKey: ["cheat-seats", seriesId],
    queryFn: async () => {
      const { data } = await supabase.from("seats_sofa").select("*").eq("series_id", seriesId).order("code");
      return data ?? [];
    },
  });

  const { data: foams = [] } = useQuery({
    queryKey: ["cheat-foams", seriesId],
    queryFn: async () => {
      const { data } = await supabase.from("product_foams").select("*").eq("series_id", seriesId).order("seat_code,position_number");
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

  const { data: sides = [] } = useQuery({
    queryKey: ["cheat-sides", seriesId],
    queryFn: async () => {
      const { data } = await supabase.from("sides").select("*").eq("series_id", seriesId).order("code");
      return data ?? [];
    },
  });

  const springExceptions = (config?.spring_exceptions as Array<{ model: string; spring: string }>) ?? [];

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold border-b-2 border-foreground pb-2">
        ŚCIĄGAWKA — Magazyn stolarki i pianek — {seriesCode} {seriesName}
      </h1>

      {/* Sprężyny */}
      <section>
        <h2 className="text-lg font-bold mb-2">🔩 Sprężyny</h2>
        {seats.length === 0 ? <NoData label="siedziska" /> : (
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-muted">
                <th className="border border-border px-2 py-1 text-left">Model</th>
                <th className="border border-border px-2 py-1 text-left">Kod</th>
                <th className="border border-border px-2 py-1 text-left">Sprężyna</th>
              </tr>
            </thead>
            <tbody>
              {seats.map(seat => {
                const exception = springExceptions.find(e => e.model === seat.code);
                const spring = exception?.spring ?? seat.spring_type ?? config?.default_spring ?? "B";
                const isException = !!exception;
                return (
                  <tr key={seat.id} className={isException ? "bg-red-100 dark:bg-red-900/30" : ""}>
                    <td className="border border-border px-2 py-1">{seat.model_name ?? "—"}</td>
                    <td className="border border-border px-2 py-1 font-mono">{seat.code}</td>
                    <td className="border border-border px-2 py-1 font-bold">{spring}{isException && " ⚠️"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>

      {/* Siedziska */}
      <section className="page-break">
        <h2 className="text-lg font-bold mb-2">🪑 Siedziska</h2>
        {seats.length === 0 ? <NoData label="siedziska" /> : (
          <div className="space-y-4">
            {seats.map(seat => {
              const seatFoams = foams.filter(f => f.seat_code === seat.code && f.component === "siedzisko");
              return (
                <div key={seat.id} className="border border-border p-3 rounded">
                  <h3 className="font-bold">{seat.code} — {seat.model_name ?? seat.type_name ?? "—"}</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm mt-1">
                    <div><span className="text-muted-foreground">Stelaż:</span> {seat.frame ?? "—"}</div>
                    <div><span className="text-muted-foreground">Modyfikacja:</span> {seat.frame_modification ?? "brak"}</div>
                    <div><span className="text-muted-foreground">Pianka (ogólna):</span> {seat.foam ?? "—"}</div>
                    <div><span className="text-muted-foreground">Front:</span> {seat.front ?? "—"}</div>
                  </div>
                  {seatFoams.length > 0 && (
                    <table className="w-full text-xs mt-2 border-collapse">
                      <thead>
                        <tr className="bg-muted">
                          <th className="border border-border px-1 py-0.5 text-left">#</th>
                          <th className="border border-border px-1 py-0.5 text-left">Nazwa</th>
                          <th className="border border-border px-1 py-0.5 text-left">Materiał</th>
                          <th className="border border-border px-1 py-0.5 text-left">Wymiary (DxSxW)</th>
                          <th className="border border-border px-1 py-0.5 text-left">Szt.</th>
                        </tr>
                      </thead>
                      <tbody>
                        {seatFoams.map(f => (
                          <tr key={f.id}>
                            <td className="border border-border px-1 py-0.5">{f.position_number}</td>
                            <td className="border border-border px-1 py-0.5">{f.name ?? "—"}</td>
                            <td className="border border-border px-1 py-0.5">{f.material ?? "—"}</td>
                            <td className="border border-border px-1 py-0.5">{f.length ?? "?"}×{f.width ?? "?"}×{f.height ?? "?"}</td>
                            <td className="border border-border px-1 py-0.5">{f.quantity ?? 1}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Oparcia */}
      <section className="page-break">
        <h2 className="text-lg font-bold mb-2">🛋️ Oparcia</h2>
        {backrests.length === 0 ? <NoData label="oparcia" /> : (
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-muted">
                <th className="border border-border px-2 py-1 text-left">Kod</th>
                <th className="border border-border px-2 py-1 text-left">Stelaż</th>
                <th className="border border-border px-2 py-1 text-left">Pianka</th>
                <th className="border border-border px-2 py-1 text-left">Wys. (cm)</th>
                <th className="border border-border px-2 py-1 text-left">Góra</th>
              </tr>
            </thead>
            <tbody>
              {backrests.map(b => (
                <tr key={b.id}>
                  <td className="border border-border px-2 py-1 font-mono">{b.code}</td>
                  <td className="border border-border px-2 py-1">{b.frame ?? "—"}</td>
                  <td className="border border-border px-2 py-1">{b.foam ?? "—"}</td>
                  <td className="border border-border px-2 py-1">{b.height_cm ?? "—"}</td>
                  <td className="border border-border px-2 py-1">{b.top ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* Boczki */}
      <section className="page-break">
        <h2 className="text-lg font-bold mb-2">📐 Boczki</h2>
        {sides.length === 0 ? <NoData label="boczki" /> : (
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-muted">
                <th className="border border-border px-2 py-1 text-left">Kod</th>
                <th className="border border-border px-2 py-1 text-left">Nazwa</th>
                <th className="border border-border px-2 py-1 text-left">Stelaż</th>
              </tr>
            </thead>
            <tbody>
              {sides.map(s => (
                <tr key={s.id}>
                  <td className="border border-border px-2 py-1 font-mono">{s.code}</td>
                  <td className="border border-border px-2 py-1">{s.name}</td>
                  <td className="border border-border px-2 py-1">{s.frame ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
