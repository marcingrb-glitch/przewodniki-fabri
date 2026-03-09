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

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold border-b-2 border-foreground pb-2">
        ŚCIĄGAWKA — Kompletacja nóżek — {seriesCode} {seriesName}
      </h1>

      {/* CO KOMPLETOWAĆ */}
      <section>
        <h2 className="text-xl font-bold mb-3 text-green-700 dark:text-green-400">🟢 CO KOMPLETOWAĆ</h2>
        {!config ? <NoData label="konfiguracja serii" /> : (
          <div className="space-y-2 text-sm">
            {chests.filter(c => c.leg_height_cm > 0).map(c => (
              <div key={c.id} className="border border-border p-2 rounded">
                <strong>Pod skrzynią {c.code} ({c.name}):</strong>{" "}
                N z SKU, H{c.leg_height_cm}cm, 4szt
              </div>
            ))}
            {automats.filter(a => a.has_seat_legs).map(a => (
              <div key={a.id} className="border border-border p-2 rounded">
                <strong>Pod siedziskiem {a.code} ({a.name}):</strong>{" "}
                {seatLegType === "built_in_plastic" ? "plastikowe (wbudowane)" : `N z SKU, H${a.seat_leg_height_cm ?? seatLegH}cm, ${a.seat_leg_count ?? 2}szt`}
              </div>
            ))}
            {pufaLegType !== "plastic_2_5" && pufaLegType !== "built_in_plastic" && (
              <div className="border border-border p-2 rounded">
                <strong>Pufa:</strong> N z SKU, H{pufaLegH ?? "?"}cm, 4szt
              </div>
            )}
            <div className="border border-border p-2 rounded">
              <strong>Fotel:</strong> N z SKU, H{seatLegH ?? pufaLegH ?? "?"}cm, 4szt
            </div>
          </div>
        )}
      </section>

      {/* CZEGO NIE KOMPLETOWAĆ */}
      <section>
        <div className="border-4 border-red-600 rounded-lg p-4 bg-red-50 dark:bg-red-950/30">
          <h2 className="text-2xl font-black mb-3 text-red-700 dark:text-red-400">🔴 CZEGO NIE KOMPLETOWAĆ!</h2>
          <div className="space-y-2 text-lg font-bold">
            <p className="warning underline text-xl">❌ Nóżki plastikowe 2.5cm — NIGDY nie kompletować!</p>
            {seatLegType === "built_in_plastic" && (
              <>
                <p>❌ {seriesCode}: Pod skrzynią = plastikowe → NIE kompletować</p>
                <p>❌ {seriesCode}: Pod siedziskiem = plastikowe wbudowane → NIE kompletować</p>
              </>
            )}
            {pufaLegType === "plastic_2_5" && (
              <p>❌ {seriesCode}: Pufa = plastikowe 2.5cm → NIE kompletować</p>
            )}
            {chests.filter(c => c.leg_height_cm === 0).map(c => (
              <p key={c.id}>❌ {c.code} ({c.name}) = plastikowe → NIE kompletować</p>
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
              {legs.map(l => {
                const colors = Array.isArray(l.colors) ? (l.colors as string[]).join(", ") : "—";
                return (
                  <tr key={l.id}>
                    <td className="border border-border px-2 py-1 font-mono font-bold">{l.code}</td>
                    <td className="border border-border px-2 py-1">{l.name}</td>
                    <td className="border border-border px-2 py-1">{l.material ?? "—"}</td>
                    <td className="border border-border px-2 py-1">{colors}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
