import type { SectionRendererProps } from "../types";
import { NoData } from "../shared/NoData";

export function BackrestsCompactRenderer({ data }: SectionRendererProps) {
  const backrests = data.getByCategory("backrest");
  if (backrests.length === 0) return <NoData label="oparcia" />;

  return (
    <table className="w-full table-auto text-xs border-collapse">
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
        {backrests.map(b => {
          const props = b.properties as any;
          return (
            <tr key={b.id}>
              <td className="border border-border px-1 py-0.5 font-mono">{b.code}</td>
              <td className="border border-border px-1 py-0.5">{props?.height_cm ?? "—"}</td>
              <td className="border border-border px-1 py-0.5">{props?.frame ?? "—"}</td>
              <td className="border border-border px-1 py-0.5">{data.formatFoamsInline(b.id)}</td>
              <td className="border border-border px-1 py-0.5">{props?.top ?? "—"}</td>
              <td className="border border-border px-1 py-0.5">{(b.allowed_finishes ?? []).join(",")}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
