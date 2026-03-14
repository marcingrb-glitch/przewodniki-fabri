import type { SectionRendererProps } from "../types";
import { formatColors } from "../shared/helpers";

export function FabricsTableRenderer({ data }: SectionRendererProps) {
  const fabrics = data.getByCategory("fabric");
  if (fabrics.length === 0) return null;

  return (
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
            <td className="border border-border px-2 py-1">{(f.properties as any)?.price_group ?? "—"}</td>
            <td className="border border-border px-2 py-1 text-xs">{formatColors(f.colors)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
