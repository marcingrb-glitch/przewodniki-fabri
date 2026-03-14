import type { SectionRendererProps } from "../types";
import { isSpringException } from "../shared/helpers";

export function SpringsTableRenderer({ data }: SectionRendererProps) {
  const seats = data.getByCategory("seat");
  if (seats.length === 0) return null;

  return (
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
          const spring = data.getSpringForSeat(seat);
          const isExc = isSpringException(seat, data.seriesConfig);
          return (
            <tr key={seat.id} className={isExc ? "bg-red-100 dark:bg-red-900/30" : ""}>
              <td className="border border-border px-2 py-1">{(seat.properties as any)?.model_name ?? "—"}</td>
              <td className="border border-border px-2 py-1 font-mono">{seat.code}</td>
              <td className="border border-border px-2 py-1 font-bold">{spring}{isExc && " ⚠️"}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
