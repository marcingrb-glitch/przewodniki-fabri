import type { SectionRendererProps } from "../types";

export function AutomatsTableRenderer({ data }: SectionRendererProps) {
  const automatConfigs = data.getRelationsByType("automat_config");
  if (automatConfigs.length === 0) return null;

  const allProducts = [...data.seriesComponents, ...data.globalProducts];

  return (
    <table className="w-full text-xs border-collapse">
      <thead>
        <tr className="bg-muted">
          <th className="border border-border px-1 py-1 text-left">Kod</th>
          <th className="border border-border px-1 py-1 text-left">Nazwa</th>
          <th className="border border-border px-1 py-1 text-left">Typ</th>
          <th className="border border-border px-1 py-1 text-left">Nóżki siedziska</th>
        </tr>
      </thead>
      <tbody>
        {automatConfigs.map((rel: any) => {
          const props = rel.properties as any;
          const target = allProducts.find(p => p.id === rel.target_product_id);
          const code = props?.automat_code ?? target?.code ?? "?";
          const name = target?.name ?? "?";
          const type = (target?.properties as any)?.type ?? "—";
          return (
            <tr key={rel.id}>
              <td className="border border-border px-1 py-0.5 font-mono">{code}</td>
              <td className="border border-border px-1 py-0.5">{name}</td>
              <td className="border border-border px-1 py-0.5">{type}</td>
              <td className="border border-border px-1 py-0.5">
                {props?.has_seat_legs ? `Tak, ${props?.seat_leg_count ?? "?"}szt, H${props?.seat_leg_height_cm ?? "?"}cm` : "Nie"}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
