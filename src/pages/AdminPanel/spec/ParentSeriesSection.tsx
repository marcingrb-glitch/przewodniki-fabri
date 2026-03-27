import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import GenericSpecSection from "./GenericSpecSection";
import type { SpecSectionConfig } from "./specSectionConfigs";

interface ParentSeriesSectionProps {
  seriesProductId: string;
  parentSeriesId: string;
  parentSeriesCode: string;
  category: string;
  config: SpecSectionConfig;
  ownLabel: string;
  parentLabel: string;
}

export default function ParentSeriesSection({
  seriesProductId, parentSeriesId, parentSeriesCode,
  category, config, ownLabel, parentLabel,
}: ParentSeriesSectionProps) {
  const navigate = useNavigate();

  return (
    <div className="space-y-8">
      {/* === SEKCJA WŁASNA (130) — edytowalna === */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <h3 className="text-lg font-semibold">{ownLabel}</h3>
          <Badge variant="default">Edytowalne</Badge>
        </div>
        <GenericSpecSection
          seriesProductId={seriesProductId}
          category={category}
          config={config}
        />
      </div>

      {/* === SEKCJA PARENT (190) — read-only === */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <h3 className="text-lg font-semibold">{parentLabel}</h3>
          <Badge variant="secondary">Tylko odczyt</Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/admin/spec/${parentSeriesCode}`)}
          >
            Edytuj w {parentSeriesCode} <ExternalLink className="ml-1 h-3 w-3" />
          </Button>
        </div>
        <div className="opacity-70 pointer-events-none">
          <GenericSpecSection
            seriesProductId={parentSeriesId}
            category={category}
            config={config}
          />
        </div>
      </div>
    </div>
  );
}
