import type { SectionRendererProps } from "../types";
import { NoData } from "../shared/NoData";

function naturalSort(items: any[]) {
  return [...items].sort((a, b) => {
    const codeA = a.code.replace(/^[A-Z]+/, "");
    const codeB = b.code.replace(/^[A-Z]+/, "");
    return codeA.localeCompare(codeB, undefined, { numeric: true });
  });
}

export function SidesFullRenderer({ data }: SectionRendererProps) {
  const sides = naturalSort(data.getByCategory("side"));
  if (sides.length === 0) return <NoData label="Boczki" />;

  return (
    <div className="rounded-md border border-border overflow-hidden">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-muted">
            <th className="border border-border px-2 py-1 text-left">Kod</th>
            <th className="border border-border px-2 py-1 text-left">Nazwa (prod.)</th>
            <th className="border border-border px-2 py-1 text-left">Stelaż</th>
          </tr>
        </thead>
        <tbody>
          {sides.map(s => (
            <tr key={s.id}>
              <td className="border border-border px-2 py-1 font-mono font-bold">{s.code}</td>
              <td className="border border-border px-2 py-1">{s.name}</td>
              <td className="border border-border px-2 py-1">{(s.properties as any)?.frame ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
