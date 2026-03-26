import type { SectionRendererProps } from "../types";
import { isSpringException, getNestedValue } from "../shared/helpers";
import { NoData } from "../shared/NoData";

export function SeatsCompactRenderer({ data }: SectionRendererProps) {
  const seats = data.getByCategory("seat");
  if (seats.length === 0) return <NoData label="siedziska" />;

  return (
    <table className="w-full table-auto text-xs border-collapse">
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
        {seats.map(s => {
          const spring = data.getSpringForSeat(s);
          const isExc = isSpringException(s, data.seriesConfig);
          const props = s.properties as any;
          return (
            <tr key={s.id} className={isExc ? "bg-red-100 dark:bg-red-900/30" : ""}>
              <td className="border border-border px-1 py-0.5 font-mono">{s.code}</td>
              <td className="border border-border px-1 py-0.5">{props?.model_name ?? "—"}</td>
              <td className="border border-border px-1 py-0.5">{props?.seat_type ?? "—"}</td>
              <td className="border border-border px-1 py-0.5">{props?.frame ?? "—"}</td>
              <td className="border border-border px-1 py-0.5">{props?.frame_modification ?? "—"}</td>
              <td className="border border-border px-1 py-0.5 font-bold">{spring}</td>
              <td className="border border-border px-1 py-0.5">{data.formatFoamsInlineWithFallback(s)}</td>
              <td className="border border-border px-1 py-0.5 font-bold">{props?.center_strip ? "TAK" : "—"}</td>
              <td className="border border-border px-1 py-0.5">{(s.allowed_finishes ?? []).join(",")}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
