import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Tables } from "@/integrations/supabase/types";
import GenericSpecSection from "./spec/GenericSpecSection";
import { SPEC_SECTION_CONFIGS } from "./spec/specSectionConfigs";
import ParentSeriesSection from "./spec/ParentSeriesSection";
import ParentSewingVariantsReadonly from "./spec/plugins/ParentSewingVariantsReadonly";
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
  const [hasChaise, setHasChaise] = useState(false);
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

      const { data: chaiseData } = await supabase
        .from("products")
        .select("id")
        .eq("category", "chaise")
        .eq("series_id", sp.id)
        .eq("active", true)
        .limit(1);
      setHasChaise((chaiseData ?? []).length > 0);
    }

    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [seriesCode]);

  const seriesProps = (seriesProduct?.properties as Record<string, any>) ?? {};
  const parentSeriesId = seriesProps.parent_series_id ?? null;

  const { data: parentSeries } = useQuery({
    queryKey: ["parent-series", parentSeriesId],
    queryFn: async () => {
      const { data } = await supabase
        .from("products")
        .select("id, code, name")
        .eq("id", parentSeriesId)
        .single();
      return data;
    },
    enabled: !!parentSeriesId,
  });
  const parentSeriesCode = parentSeries?.code ?? "";

  if (loading) return <div className="p-8 text-muted-foreground text-center">Ładowanie specyfikacji...</div>;
  if (!seriesProduct) return <div className="p-8 text-center text-destructive">Nie znaleziono serii "{seriesCode}"</div>;

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

      <Tabs defaultValue="models">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="models">Modele / Siedziska</TabsTrigger>
          <TabsTrigger value="sides">Boczki</TabsTrigger>
          <TabsTrigger value="backrests">Oparcia</TabsTrigger>
          <TabsTrigger value="chests">Skrzynie</TabsTrigger>
          <TabsTrigger value="automats">Automaty</TabsTrigger>
          <TabsTrigger value="legs">Nóżki & Montaż</TabsTrigger>
          
          {hasPufa && <TabsTrigger value="pufa">Pufa</TabsTrigger>}
          {hasFotel && <TabsTrigger value="fotel">Fotel</TabsTrigger>}
          {hasChaise && <TabsTrigger value="chaise">Szezlong</TabsTrigger>}
        </TabsList>

        <TabsContent value="models">
          {parentSeriesId ? (
            <ParentSeriesSection
              seriesProductId={seriesProduct.id}
              parentSeriesId={parentSeriesId}
              parentSeriesCode={parentSeriesCode}
              category="seat"
              config={SPEC_SECTION_CONFIGS.seat}
              ownLabel="Siedziska 130 cm"
              parentLabel={`Siedziska 190 cm (z serii ${parentSeriesCode})`}
            />
          ) : (
            <GenericSpecSection seriesProductId={seriesProduct.id} category="seat" config={SPEC_SECTION_CONFIGS.seat} />
          )}
        </TabsContent>
        <TabsContent value="sides">
          {parentSeriesId ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Boczki</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 space-y-3">
                  <p className="text-muted-foreground">
                    Boczki pobierane z serii <strong>{parentSeriesCode}</strong>
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => navigate(`/admin/spec/${parentSeriesCode}`)}
                  >
                    Przejdź do {parentSeriesCode} → Boczki <ExternalLink className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <GenericSpecSection seriesProductId={seriesProduct.id} category="side" config={SPEC_SECTION_CONFIGS.side} />
          )}
        </TabsContent>
        <TabsContent value="backrests">
          {parentSeriesId ? (
            <div className="space-y-8">
              <ParentSeriesSection
                seriesProductId={seriesProduct.id}
                parentSeriesId={parentSeriesId}
                parentSeriesCode={parentSeriesCode}
                category="backrest"
                config={SPEC_SECTION_CONFIGS.backrest}
                ownLabel="Oparcia 130 cm"
                parentLabel={`Oparcia 190 cm (z serii ${parentSeriesCode})`}
              />
              <ParentSewingVariantsReadonly
                seriesProductId={seriesProduct.id}
                parentSeriesId={parentSeriesId}
              />
            </div>
          ) : (
            <GenericSpecSection seriesProductId={seriesProduct.id} category="backrest" config={SPEC_SECTION_CONFIGS.backrest} />
          )}
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
            <SeriesFotel seriesProductId={seriesProduct.id} seriesProperties={seriesProps} />
          </TabsContent>
        )}
        {hasChaise && (
          <TabsContent value="chaise">
            <div className="space-y-4">
              <div className="rounded-md border bg-muted/30 p-3 text-sm text-muted-foreground">
                Stelaż szezlonga: 124.2 × 79 × 26 cm (wszystkie modele). Oparcie szezlonga bez sprężyn.
              </div>
              <GenericSpecSection
                seriesProductId={seriesProduct.id}
                category="chaise"
                config={SPEC_SECTION_CONFIGS.chaise}
              />
              <ParentSewingVariantsReadonly
                seriesProductId={seriesProduct.id}
                parentSeriesId={parentSeriesId}
              />
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
