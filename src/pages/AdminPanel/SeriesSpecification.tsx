import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import SeriesOverview from "./spec/SeriesOverview";
import GenericSpecSection from "./spec/GenericSpecSection";
import { SPEC_SECTION_CONFIGS } from "./spec/specSectionConfigs";
import SeriesLegs from "./spec/SeriesLegs";
import SeriesChests from "./spec/SeriesChests";
import SeriesPufa from "./spec/SeriesPufa";
import SeriesFotel from "./spec/SeriesFotel";
import SeriesAutomats from "./spec/SeriesAutomats";

type SeriesProduct = Tables<"products">;

export default function SeriesSpecification() {
  const { seriesCode } = useParams<{ seriesCode: string }>();
  const navigate = useNavigate();

  const [seriesProduct, setSeriesProduct] = useState<SeriesProduct | null>(null);
  const [extras, setExtras] = useState<{ code: string }[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    if (!seriesCode) return;
    setLoading(true);

    const { data: sp } = await supabase
      .from("products")
      .select("*")
      .eq("category", "series")
      .eq("code", seriesCode)
      .single();
    setSeriesProduct(sp);

    if (sp) {
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

  const seriesProps = (seriesProduct.properties as Record<string, any>) ?? {};
  const hasPufa = extras.some(e => e.code === "PF" || e.code === "PFO");
  const hasFotel = extras.some(e => e.code === "FT");

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/admin")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">
            {seriesProduct.code} — {seriesProduct.name}
          </h1>
          {seriesProps.collection && (
            <p className="text-sm text-muted-foreground">
              Kolekcja: {seriesProps.collection}
            </p>
          )}
        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="overview">Przegląd</TabsTrigger>
          <TabsTrigger value="models">Modele / Siedziska</TabsTrigger>
          <TabsTrigger value="sides">Boczki</TabsTrigger>
          <TabsTrigger value="backrests">Oparcia</TabsTrigger>
          <TabsTrigger value="chests">Skrzynie</TabsTrigger>
          <TabsTrigger value="automats">Automaty</TabsTrigger>
          <TabsTrigger value="legs">Nóżki & Montaż</TabsTrigger>
          {hasPufa && <TabsTrigger value="pufa">Pufa</TabsTrigger>}
          {hasFotel && <TabsTrigger value="fotel">Fotel</TabsTrigger>}
        </TabsList>

        <TabsContent value="overview">
          <SeriesOverview seriesProductId={seriesProduct.id} seriesProduct={seriesProduct} onSeriesUpdate={fetchData} />
        </TabsContent>
        <TabsContent value="models">
          <GenericSpecSection seriesProductId={seriesProduct.id} category="seat" config={SPEC_SECTION_CONFIGS.seat} />
        </TabsContent>
        <TabsContent value="sides">
          <GenericSpecSection seriesProductId={seriesProduct.id} category="side" config={SPEC_SECTION_CONFIGS.side} />
        </TabsContent>
        <TabsContent value="backrests">
          <GenericSpecSection seriesProductId={seriesProduct.id} category="backrest" config={SPEC_SECTION_CONFIGS.backrest} />
        </TabsContent>
        <TabsContent value="chests">
          <SeriesChests seriesProductId={seriesProduct.id} seriesProperties={seriesProps} onUpdate={fetchData} />
        </TabsContent>
        <TabsContent value="automats">
          <SeriesAutomats seriesProductId={seriesProduct.id} />
        </TabsContent>
        <TabsContent value="legs">
          <SeriesLegs seriesProductId={seriesProduct.id} seriesProperties={seriesProps} seriesCode={seriesCode} />
        </TabsContent>
        {hasPufa && (
          <TabsContent value="pufa">
            <SeriesPufa seriesProductId={seriesProduct.id} seriesProperties={seriesProps} />
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
