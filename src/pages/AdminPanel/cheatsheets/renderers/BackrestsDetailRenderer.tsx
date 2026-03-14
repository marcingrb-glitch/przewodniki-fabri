import type { SectionRendererProps } from "../types";
import { NoData } from "../shared/NoData";

export function BackrestsDetailRenderer({ data }: SectionRendererProps) {
  const backrests = data.getByCategory("backrest");
  if (backrests.length === 0) return <NoData label="oparcia" />;

  return (
    <div className="space-y-4">
      {backrests.map(b => {
        const props = b.properties as any;
        const specs = data.getSpecsForProduct(b.id).filter(s => s.spec_type === "foam");
        return (
          <div key={b.id} className="border border-border p-3 rounded">
            <h3 className="font-bold">{b.code} — {props?.model_name ?? "—"}{props?.spring_type ? ` (spr. ${props.spring_type})` : ""}</h3>
            <div className="grid grid-cols-2 gap-2 text-sm mt-1">
              <div><span className="text-muted-foreground">Stelaż:</span> {props?.frame ?? "—"}</div>
              <div><span className="text-muted-foreground">Wys. (cm):</span> {props?.height_cm ?? "—"}</div>
              <div><span className="text-muted-foreground">Góra:</span> {props?.top ?? "—"}</div>
            </div>
            {specs.length > 0 && (
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
            )}
          </div>
        );
      })}
    </div>
  );
}
