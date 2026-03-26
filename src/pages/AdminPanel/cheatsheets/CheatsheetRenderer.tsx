import { rendererRegistry, sectionIcons } from "./renderers";
import { Loader2 } from "lucide-react";
import type { CheatsheetData } from "./types";

interface Props {
  data: CheatsheetData;
  workstationCode: string;
  seriesCode: string;
  seriesName: string;
}

export default function CheatsheetRenderer({ data, workstationCode, seriesCode, seriesName }: Props) {
  if (data.isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data.seriesProduct) {
    return <p className="text-center text-destructive py-8">Nie znaleziono serii</p>;
  }

  const collection = (data.seriesProduct?.properties as any)?.collection ?? "";
  const title = `SPECYFIKACJA TECHNICZNA | SOFA ${seriesCode} ${collection}`.toUpperCase();

  return (
    <div className="space-y-8 overflow-hidden">
      <h1 className="text-2xl font-bold border-b-2 border-foreground pb-2">{title}</h1>

      {data.sections.map(section => {
        const Renderer = rendererRegistry[section.renderer_type];
        if (!Renderer) return null;

        const icon = sectionIcons[section.renderer_type] ?? "📋";

        // For warehouse_full, sewing_variants, finish_legend — no section header
        if (section.renderer_type === "warehouse_full" || section.renderer_type === "kierownik_full" || section.renderer_type === "sewing_variants" || section.renderer_type === "finish_legend" || section.renderer_type === "sides_full") {
          return (
            <section key={section.id} className="mb-6">
              <Renderer section={section} data={data} seriesProduct={data.seriesProduct!} />
            </section>
          );
        }

        return (
          <section key={section.id} className="mb-6 avoid-break">
            <h2 className="text-lg font-bold mb-2">{icon} {section.section_name}</h2>
            {section.notes && section.renderer_type !== "finish_warnings" && (
              <p className="text-sm text-muted-foreground mb-2">{section.notes}</p>
            )}
            <Renderer section={section} data={data} seriesProduct={data.seriesProduct!} />
          </section>
        );
      })}
    </div>
  );
}
