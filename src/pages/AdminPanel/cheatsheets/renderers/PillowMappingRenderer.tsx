import type { SectionRendererProps } from "../types";

export function PillowMappingRenderer({ data }: SectionRendererProps) {
  const pillowMaps = data.getRelationsByType("seat_pillow_map");
  if (pillowMaps.length === 0) return null;

  const allProducts = [...data.seriesComponents, ...data.globalProducts];
  const findProduct = (id: string | null) => allProducts.find(p => p.id === id);
  const findCode = (id: string | null) => findProduct(id)?.code ?? "?";

  const resolved = pillowMaps.map((rel: any) => {
    const pillowProduct = findProduct(rel.target_product_id);
    const pillowProps = (pillowProduct?.properties ?? {}) as Record<string, any>;
    const shortName = (pillowProduct?.name ?? "—").replace(/^Poduszka\s*/i, "");
    return {
      id: rel.id,
      seatCode: findCode(rel.source_product_id),
      pillowCode: findCode(rel.target_product_id),
      pillowName: shortName || "—",
      sewingTechnique: pillowProps.sewing_technique ?? "—",
    };
  });

  return (
    <table className="w-full text-sm border-collapse">
      <thead>
        <tr className="bg-muted">
          <th className="border border-border px-2 py-1 text-left">Siedzisko</th>
          <th className="border border-border px-2 py-1 text-left">Poduszka</th>
          <th className="border border-border px-2 py-1 text-left">Typ</th>
          <th className="border border-border px-2 py-1 text-left">Szycie</th>
        </tr>
      </thead>
      <tbody>
        {resolved.map(m => (
          <tr key={m.id}>
            <td className="border border-border px-2 py-1 font-mono">{m.seatCode}</td>
            <td className="border border-border px-2 py-1">{m.pillowCode}</td>
            <td className="border border-border px-2 py-1">{m.pillowName}</td>
            <td className="border border-border px-2 py-1">{m.sewingTechnique}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
