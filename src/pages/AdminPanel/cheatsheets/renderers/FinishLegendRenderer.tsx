import type { SectionRendererProps } from "../types";

export function FinishLegendRenderer({ data }: SectionRendererProps) {
  const finishes = data.getByCategory("finish");
  if (finishes.length === 0) return null;

  return (
    <div className="border-2 border-border rounded p-2 bg-muted text-sm font-bold">
      LEGENDA WYKOŃCZEŃ: {finishes.map(f => `${f.code} = ${f.name}`).join(" | ")}
    </div>
  );
}
