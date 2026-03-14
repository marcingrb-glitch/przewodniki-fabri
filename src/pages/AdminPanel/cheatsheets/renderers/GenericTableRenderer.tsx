import type { SectionRendererProps } from "../types";
import { getNestedValue, formatColors } from "../shared/helpers";

export function GenericTableRenderer({ section, data }: SectionRendererProps) {
  const filters = section.filters as Record<string, any>;
  const config = section.renderer_config;
  
  let products = data.getByCategory(filters.category ?? "");
  
  // Filter by series config field (e.g. available_chests)
  if (config.filter_by_series_config && data.seriesConfig) {
    const allowedCodes = (data.seriesConfig as any)?.[config.filter_by_series_config] as string[] | undefined;
    if (allowedCodes) {
      products = products.filter(p => allowedCodes.includes(p.code));
    }
  }

  if (products.length === 0) return null;

  const columns = section.columns;
  if (!columns.length) return null;

  return (
    <table className="w-full text-sm border-collapse">
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
              if (col.key === "colors") {
                val = formatColors(p.colors);
              } else {
                val = getNestedValue(p, col.key);
              }

              // Formatting
              if (col.format === "join" && Array.isArray(val)) val = val.join(", ");
              else if (col.format === "boolean") val = val ? "TAK" : "—";
              else if (col.format === "colors") val = formatColors(val);
              
              if (col.suffix && val != null && val !== "—") val = `${val}${col.suffix}`;
              
              return (
                <td key={i} className={`border border-border px-2 py-1 ${col.mono ? "font-mono" : ""} ${col.bold ? "font-bold" : ""}`}>
                  {val ?? "—"}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
