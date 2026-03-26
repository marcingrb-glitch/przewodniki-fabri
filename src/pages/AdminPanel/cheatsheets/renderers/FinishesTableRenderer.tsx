import type { SectionRendererProps } from "../types";
import { getNestedValue } from "../shared/helpers";

export function FinishesTableRenderer({ section, data }: SectionRendererProps) {
  const filters = section.filters as Record<string, any>;
  const products = data.getByCategory(filters.category ?? "");
  if (products.length === 0) return null;

  const columns = section.columns;

  return (
    <table className="w-full table-auto text-sm border-collapse">
      <thead>
        <tr className="bg-muted">
          {columns.map((col, i) => (
            <th key={i} className="border border-border px-2 py-1 text-left">{col.label}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {products.map(p => (
          <tr key={p.id}>
            {columns.map((col, i) => {
              let val: any;
              if (col.key === "allowed_finishes") val = (p.allowed_finishes ?? []).join(", ") || "—";
              else if (col.key === "default_finish") val = p.default_finish ?? "—";
              else val = getNestedValue(p, col.key) ?? "—";
              return (
                <td key={i} className={`border border-border px-2 py-1 ${col.mono ? "font-mono" : ""} ${col.bold ? "font-bold" : ""}`}>
                  {val}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
