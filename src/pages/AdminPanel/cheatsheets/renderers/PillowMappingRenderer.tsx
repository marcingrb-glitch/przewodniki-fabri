import type { SectionRendererProps } from "../types";

export function PillowMappingRenderer({ data }: SectionRendererProps) {
  const pillowMaps = data.getRelationsByType("seat_pillow_map");
  if (pillowMaps.length === 0) return null;

  const allProducts = [...data.seriesComponents, ...data.globalProducts];
  const findCode = (id: string | null) => allProducts.find(p => p.id === id)?.code ?? "?";

  const resolved = pillowMaps.map((rel: any) => ({
    id: rel.id,
    seatCode: findCode(rel.source_product_id),
    pillowCode: findCode(rel.target_product_id),
    pillowFinish: (rel.properties as any)?.pillow_finish ?? "dziedziczone",
  }));

  return (
    <table className="w-full text-sm border-collapse">
      <thead>
        <tr className="bg-muted">
          <th className="border border-border px-2 py-1 text-left">Siedzisko</th>
          <th className="border border-border px-2 py-1 text-left">Poduszka</th>
          <th className="border border-border px-2 py-1 text-left">Wykończenie</th>
        </tr>
      </thead>
      <tbody>
        {resolved.map(m => (
          <tr key={m.id}>
            <td className="border border-border px-2 py-1 font-mono">{m.seatCode}</td>
            <td className="border border-border px-2 py-1">{m.pillowCode}</td>
            <td className="border border-border px-2 py-1">{m.pillowFinish}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
