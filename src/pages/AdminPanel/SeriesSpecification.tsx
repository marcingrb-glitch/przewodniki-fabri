import { useEffect, useState } from "react";
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

export default function SeriesSpecification() {
  const { seriesCode } = useParams<{ seriesCode: string }>();
  const navigate = useNavigate();
  const [series, setSeries] = useState<Tables<"series"> | null>(null);
  const [config, setConfig] = useState<Tables<"series_config"> | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    if (!seriesCode) return;
    setLoading(true);
    const { data: seriesData } = await supabase
      .from("series").select("*").eq("code", seriesCode).single();
    setSeries(seriesData);
    if (seriesData) {
      const { data: configData } = await supabase
        .from("series_config").select("*").eq("series_id", seriesData.id).single();
      setConfig(configData);
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [seriesCode]);

  if (loading) return <div className="p-8 text-muted-foreground text-center">Ładowanie specyfikacji...</div>;
  if (!series) return <div className="p-8 text-center text-destructive">Nie znaleziono serii "{seriesCode}"</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/admin")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">
            {series.code} — {series.name}
          </h1>
          {series.collection && (
            <p className="text-sm text-muted-foreground">Kolekcja: {series.collection}</p>
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
          <TabsTrigger value="pufa">Pufa</TabsTrigger>
          {seriesCode !== "S2" && <TabsTrigger value="fotel">Fotel</TabsTrigger>}
        </TabsList>

        <TabsContent value="overview">
          <SeriesOverview config={config} seriesId={series.id} onConfigUpdate={fetchData} />
        </TabsContent>
        <TabsContent value="models">
          <SeriesModels seriesId={series.id} />
        </TabsContent>
        <TabsContent value="sides">
          <SeriesSides seriesId={series.id} />
        </TabsContent>
        <TabsContent value="backrests">
          <SeriesBackrests seriesId={series.id} />
        </TabsContent>
        <TabsContent value="automats">
          <SeriesAutomats seriesId={series.id} />
        </TabsContent>
        <TabsContent value="legs">
          <SeriesLegs seriesId={series.id} config={config} seriesCode={seriesCode} />
        </TabsContent>
        <TabsContent value="pufa">
          <SeriesPufa seriesId={series.id} config={config} />
        </TabsContent>
        {seriesCode !== "S2" && (
          <TabsContent value="fotel">
            <SeriesFotel />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
