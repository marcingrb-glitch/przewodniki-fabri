import type { SectionRendererProps } from "../types";
import { getFoamsWithFallback } from "../shared/helpers";
import { NoData } from "../shared/NoData";

export function SeatsDetailRenderer({ data }: SectionRendererProps) {
  const seats = data.getByCategory("seat");
  if (seats.length === 0) return <NoData label="siedziska" />;

  return (
    <div className="space-y-4">
      {seats.map(seat => {
        const props = seat.properties as any;
        const { specs, isReference, referenceCode } = getFoamsWithFallback(
          seat, data.productSpecs, data.getByCategory('seat')
        );
        return (
          <div key={seat.id} className="border border-border p-3 rounded">
            <h3 className="font-bold">{seat.code} — {props?.model_name ?? "—"}{props?.seat_type ? ` (${props.seat_type})` : ""}</h3>
            <div className="grid grid-cols-2 gap-2 text-sm mt-1">
              <div><span className="text-muted-foreground">Stelaż:</span> {props?.frame ?? "—"}</div>
              <div><span className="text-muted-foreground">Modyfikacja:</span> {props?.frame_modification ?? "brak"}</div>
              <div><span className="text-muted-foreground">Front:</span> {props?.front ?? "—"}</div>
              <div><span className="text-muted-foreground">Pasek środkowy:</span> <strong>{props?.center_strip ? "TAK ✅" : "NIE"}</strong></div>
            </div>
            {specs.length > 0 && (
              <div>
                {isReference && (
                  <p className="text-xs text-muted-foreground italic mt-1">
                    Pianki jak {referenceCode} + pasek środkowy
                  </p>
                )}
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
                    {specs.map(f => (
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
              </div>
            )}
            {specs.length === 0 && props?.seat_type === 'Dzielone' && (
              <p className="text-xs text-muted-foreground italic mt-1">
                Brak danych pianek — sprawdź odpowiednik Gładkie
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
