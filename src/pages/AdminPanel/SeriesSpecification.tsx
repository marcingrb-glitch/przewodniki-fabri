import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import SeriesOverview from "./spec/SeriesOverview";
import SeriesModels from "./spec/SeriesModels";
import SeriesSides from "./spec/SeriesSides";
import SeriesBackrests from "./spec/SeriesBackrests";
import SeriesLegs from "./spec/SeriesLegs";
import SeriesPufa from "./spec/SeriesPufa";
import SeriesFotel from "./spec/SeriesFotel";
import SeriesAutomats from "./spec/SeriesAutomats";

type SeriesProduct = Tables<"products">;

/**
 * Build a config shim compatible with Tables<"series_config"> from products.properties.
 * Child components (SeriesOverview, SeriesLegs, SeriesPufa) expect this shape.
 * This shim will be removed when children are refactored in krok 3.
 */
function buildConfigShim(
  seriesProduct: SeriesProduct,
  oldSeriesId: string,
  oldConfigId: string
): Tables<"series_config"> {
  const props = seriesProduct.properties as Record<string, any> | null;
  return {
    id: oldConfigId,
    series_id: oldSeriesId,
    product_id: seriesProduct.id,
    created_at: seriesProduct.created_at ?? new Date().toISOString(),
    available_chests: props?.available_chests ?? null,
    default_spring: props?.default_spring ?? null,
    spring_exceptions: props?.spring_exceptions ?? null,
    fixed_automat: props?.fixed_automat ?? null,
    fixed_backrest: props?.fixed_backrest ?? null,
    fixed_chest: props?.fixed_chest ?? null,
    pufa_leg_type: props?.pufa_leg_type ?? null,
    pufa_leg_height_cm: props?.pufa_leg_height_cm ?? null,
    pufa_leg_count: props?.pufa_leg_count ?? null,
    seat_leg_type: props?.seat_leg_type ?? null,
    seat_leg_height_cm: props?.seat_leg_height_cm ?? null,
    notes: props?.notes ?? null,
  };
}

export default function SeriesSpecification() {
  const { seriesCode } = useParams<{ seriesCode: string }>();
  const navigate = useNavigate();

  // New: series data from products table
  const [seriesProduct, setSeriesProduct] = useState<SeriesProduct | null>(null);
  // Shim: config object compatible with Tables<"series_config">
  const [config, setConfig] = useState<Tables<"series_config"> | null>(null);
  // Old series.id needed by child components that still query old tables
  const [oldSeriesId, setOldSeriesId] = useState<string | null>(null);
  // Extras for conditional tab rendering
  const [extras, setExtras] = useState<{ code: string }[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    if (!seriesCode) return;
    setLoading(true);

    // 1. Load series from products table (new)
    const { data: sp } = await supabase
      .from("products")
      .select("*")
      .eq("category", "series")
      .eq("code", seriesCode)
      .single();
    setSeriesProduct(sp);

    if (sp) {
      // 2. Load old series.id for child components (temporary shim)
      const { data: oldSeries } = await supabase
        .from("series")
        .select("id")
        .eq("code", seriesCode)
        .single();
      const oldSId = oldSeries?.id ?? "";
      setOldSeriesId(oldSId);

      // 3. Load old series_config.id for write operations in SeriesOverview (temporary shim)
      let oldConfigId = "";
      if (oldSId) {
        const { data: oldConfig } = await supabase
          .from("series_config")
          .select("id")
          .eq("series_id", oldSId)
          .maybeSingle();
        oldConfigId = oldConfig?.id ?? "";
      }

      // 4. Build config shim from products.properties
      setConfig(buildConfigShim(sp, oldSId, oldConfigId));

      // 5. Load extras for conditional tab visibility (data-driven, not hardcoded)
      const { data: extrasData } = await supabase
        .from("products")
        .select("code")
        .eq("category", "extra")
        .eq("series_id", sp.id);
      setExtras(extrasData ?? []);
    }

    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [seriesCode]);

  if (loading) return <div className="p-8 text-muted-foreground text-center">Ładowanie specyfikacji...</div>;
  if (!seriesProduct) return <div className="p-8 text-center text-destructive">Nie znaleziono serii "{seriesCode}"</div>;

  const hasPufa = extras.some(e => e.code === "PF" || e.code === "PFO");
  const hasFotel = extras.some(e => e.code === "FT");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/admin")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">
            {seriesProduct.code} — {seriesProduct.name}
          </h1>
          {(seriesProduct.properties as any)?.collection && (
            <p className="text-sm text-muted-foreground">
              Kolekcja: {(seriesProduct.properties as any).collection}
            </p>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="overview">Przegląd</TabsTrigger>
          <TabsTrigger value="models">Modele / Siedziska</TabsTrigger>
          <TabsTrigger value="sides">Boczki</TabsTrigger>
          <TabsTrigger value="backrests">Oparcia</TabsTrigger>
          <TabsTrigger value="automats">Automaty</TabsTrigger>
          <TabsTrigger value="legs">Nóżki & Montaż</TabsTrigger>
          {hasPufa && <TabsTrigger value="pufa">Pufa</TabsTrigger>}
          {hasFotel && <TabsTrigger value="fotel">Fotel</TabsTrigger>}
        </TabsList>

        <TabsContent value="overview">
          <SeriesOverview config={config} seriesId={oldSeriesId ?? ""} onConfigUpdate={fetchData} />
        </TabsContent>
        <TabsContent value="models">
          <SeriesModels seriesId={oldSeriesId ?? ""} />
        </TabsContent>
        <TabsContent value="sides">
          <SeriesSides seriesId={oldSeriesId ?? ""} />
        </TabsContent>
        <TabsContent value="backrests">
          <SeriesBackrests seriesId={oldSeriesId ?? ""} />
        </TabsContent>
        <TabsContent value="automats">
          <SeriesAutomats seriesId={oldSeriesId ?? ""} />
        </TabsContent>
        <TabsContent value="legs">
          <SeriesLegs seriesId={oldSeriesId ?? ""} config={config} seriesCode={seriesCode} />
        </TabsContent>
        {hasPufa && (
          <TabsContent value="pufa">
            <SeriesPufa seriesId={oldSeriesId ?? ""} config={config} />
          </TabsContent>
        )}
        {hasFotel && (
          <TabsContent value="fotel">
            <SeriesFotel />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
