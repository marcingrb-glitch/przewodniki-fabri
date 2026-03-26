import type { SectionRendererProps } from "../types";

export function SewingVariantsRenderer({ section, data }: SectionRendererProps) {
  const variants = data.sewingVariants;
  if (variants.length === 0) return null;

  return (
    <div className="border-4 border-orange-500 rounded-lg p-4 bg-orange-50 dark:bg-orange-950/30">
      <h2 className="text-lg font-bold mb-2 text-orange-700 dark:text-orange-400">⚠️ {section.section_name} — WAŻNE!</h2>
      {section.notes && <p className="text-sm mb-3 font-medium">{section.notes}</p>}
      <table className="w-full table-auto text-sm border-collapse">
        <thead>
          <tr className="bg-orange-100 dark:bg-orange-900/40">
            <th className="border border-border px-2 py-1 text-left">Wariant</th>
            <th className="border border-border px-2 py-1 text-left">Modele</th>
            <th className="border border-border px-2 py-1 text-left">Opis</th>
          </tr>
        </thead>
        <tbody>
          {variants.map((v: any) => (
            <tr key={v.id}>
              <td className="border border-border px-2 py-1 font-bold">{v.variant_name}</td>
              <td className="border border-border px-2 py-1">{(v.models ?? []).join(", ")}</td>
              <td className="border border-border px-2 py-1">{v.description ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
