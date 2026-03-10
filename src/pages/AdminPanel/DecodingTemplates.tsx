import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { generateDecodingPDF } from "@/utils/pdfGenerators/decodingPDF";
import { DecodedSKU } from "@/types";
import { Eye, Download } from "lucide-react";

function buildExampleDecoded(data: any): DecodedSKU {
  const finish = data.finish || { code: "A", name: "Zwykłe" };
  const seat = data.seat || {};
  const side = data.side || {};
  const backrest = data.backrest || {};
  const chest = data.chest || {};
  const automat = data.automat || {};
  const series = data.series || { code: "S1", name: "Seria", collection: "Kolekcja" };
  const leg = data.leg || {};
  const pillow = data.pillow || null;
  const jaski = data.jaski || null;
  const walek = data.walek || null;
  const pufaSeat = data.pufaSeat || null;

  let legColor = "";
  let legColorName = "";
  if (leg?.colors && Array.isArray(leg.colors) && leg.colors.length > 0) {
    legColor = leg.colors[0]?.code || "";
    legColorName = leg.colors[0]?.name || "";
  }

  const decoded: DecodedSKU = {
    series: { code: series.code, name: series.name, collection: series.collection || "" },
    fabric: { code: "N01", name: "Novell", color: "12", colorName: "Szary", group: 3 },
    seat: {
      code: seat.code || "N01",
      type: seat.type || "N",
      finish: finish.code,
      finishName: finish.name,
      frame: seat.frame || "-",
      foam: "T25",
      front: seat.front || "-",
      midStrip: seat.center_strip || false,
      springType: seat.spring_type || "B",
      frameModification: seat.frame_modification || "",
    },
    side: {
      code: side.code || "B01",
      name: side.name || "Boczek standardowy",
      frame: side.frame || "-",
      finish: finish.code,
      finishName: finish.name,
    },
    backrest: {
      code: backrest.code || "O01",
      height: backrest.height_cm || "90",
      frame: backrest.frame || "-",
      foam: "HR35",
      top: backrest.top || "-",
      finish: finish.code,
      finishName: finish.name,
      springType: backrest.spring_type || "B",
    },
    chest: {
      code: chest.code || "SK15",
      name: chest.name || "Skrzynia 15",
      legHeight: chest.leg_height_cm || 5,
      legCount: chest.leg_count || 4,
    },
    automat: {
      code: automat.code || "AU01",
      name: automat.name || "Automat standardowy",
      type: automat.type || "DL",
      seatLegs: false,
      seatLegHeight: 0,
      seatLegCount: 0,
    },
    legs: leg?.code ? {
      code: leg.code,
      name: leg.name || "",
      material: leg.material || "",
      color: legColor,
      colorName: legColorName,
    } : undefined,
    pillow: pillow ? {
      code: pillow.code,
      name: pillow.name,
      finish: finish.code,
      finishName: finish.name,
    } : undefined,
    jaski: jaski ? {
      code: jaski.code,
      name: jaski.name,
      finish: finish.code,
      finishName: finish.name,
    } : undefined,
    walek: walek ? {
      code: walek.code,
      name: walek.name || "",
      finish: finish.code,
      finishName: finish.name,
    } : undefined,
    extras: [],
    legHeights: {
      sofa_chest: leg?.code ? { leg: leg.code, height: chest.leg_height_cm || 5, count: chest.leg_count || 4 } : null,
      sofa_seat: null,
    },
    pufaSeat: pufaSeat ? {
      frontBack: pufaSeat.front_back || "-",
      sides: pufaSeat.sides || "-",
      foam: pufaSeat.base_foam || "-",
      box: pufaSeat.box_height || "-",
    } : undefined,
    pufaSKU: pufaSeat ? `${series.code}-PUFA-EXAMPLE` : undefined,
    orderNumber: "12345",
    orderDate: new Date().toISOString().slice(0, 10),
    rawSKU: `${series.code}-N0112-${seat.code || "N01"}${finish.code}-${side.code || "B01"}${finish.code}-${backrest.code || "O01"}${finish.code}-${chest.code || "SK15"}-${automat.code || "AU01"}-${leg?.code || "N01"}BK`,
  };

  return decoded;
}

export default function DecodingTemplates() {
  const [selectedSeriesId, setSelectedSeriesId] = useState<string>("__any__");
  const [pdfDataUri, setPdfDataUri] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  const { data: seriesList = [] } = useQuery({
    queryKey: ["series-list"],
    queryFn: async () => {
      const { data, error } = await supabase.from("series").select("id, code, name, collection").order("code");
      if (error) throw error;
      return data;
    },
  });

  const seriesFilter = selectedSeriesId !== "__any__" ? selectedSeriesId : seriesList[0]?.id;

  const { data: exampleData } = useQuery({
    queryKey: ["decoding-example-data", seriesFilter],
    queryFn: async () => {
      const sid = seriesFilter;
      const [seatRes, sideRes, backrestRes, chestRes, automatRes, legRes, pufaSeatRes, pillowRes, finishRes, jaskiRes, walekRes] = await Promise.all([
        supabase.from("seats_sofa").select("code, type, frame, front, spring_type, center_strip, frame_modification").eq("series_id", sid!).limit(1).maybeSingle(),
        supabase.from("sides").select("code, name, frame").eq("series_id", sid!).limit(1).maybeSingle(),
        supabase.from("backrests").select("code, height_cm, frame, top, spring_type").eq("series_id", sid!).limit(1).maybeSingle(),
        supabase.from("chests").select("code, name, leg_height_cm, leg_count").limit(1).maybeSingle(),
        supabase.from("automats").select("code, name, type").limit(1).maybeSingle(),
        supabase.from("legs").select("code, name, material, colors").limit(1).maybeSingle(),
        supabase.from("seats_pufa").select("code, front_back, sides, base_foam, box_height").eq("series_id", sid!).limit(1).maybeSingle(),
        supabase.from("pillows").select("code, name").limit(1).maybeSingle(),
        supabase.from("finishes").select("code, name").limit(1).maybeSingle(),
        supabase.from("jaskis").select("code, name").limit(1).maybeSingle(),
        supabase.from("waleks").select("code, name").limit(1).maybeSingle(),
      ]);

      const selectedSeries = seriesList.find(s => s.id === sid);

      return {
        seat: seatRes.data, side: sideRes.data, backrest: backrestRes.data,
        chest: chestRes.data, automat: automatRes.data,
        series: selectedSeries || { code: "S1", name: "Seria", collection: "Kolekcja" },
        leg: legRes.data, pufaSeat: pufaSeatRes.data, pillow: pillowRes.data,
        finish: finishRes.data, jaski: jaskiRes.data, walek: walekRes.data,
      };
    },
    enabled: !!seriesFilter,
    staleTime: 5 * 60 * 1000,
  });

  const generatePreview = async () => {
    if (!exampleData) return;
    setGenerating(true);
    try {
      const decoded = buildExampleDecoded(exampleData);
      const blob = await generateDecodingPDF(decoded);
      const reader = new FileReader();
      reader.onload = () => setPdfDataUri(reader.result as string);
      reader.readAsDataURL(blob);
    } catch (err) {
      console.error("Error generating decoding PDF:", err);
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = async () => {
    if (!exampleData) return;
    setGenerating(true);
    try {
      const decoded = buildExampleDecoded(exampleData);
      const blob = await generateDecodingPDF(decoded);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `dekodowanie-przyklad.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error downloading decoding PDF:", err);
    } finally {
      setGenerating(false);
    }
  };

  useEffect(() => {
    if (exampleData) {
      generatePreview();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exampleData]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">🔍 Podgląd dekodowania PDF</h1>
      <p className="text-muted-foreground text-sm">
        Podgląd dokumentu dekodowania SKU z przykładowymi danymi z bazy. Wybierz serię, aby zobaczyć jak wygląda PDF dla jej komponentów.
      </p>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Label className="text-sm whitespace-nowrap">Seria:</Label>
          <Select value={selectedSeriesId} onValueChange={setSelectedSeriesId}>
            <SelectTrigger className="w-64"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__any__">Pierwsza dostępna</SelectItem>
              {seriesList.map(s => (
                <SelectItem key={s.id} value={s.id}>{s.code} - {s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button onClick={generatePreview} disabled={generating || !exampleData} variant="outline" size="sm">
          <Eye className="mr-1 h-4 w-4" /> Podgląd
        </Button>
        <Button onClick={handleDownload} disabled={generating || !exampleData} variant="outline" size="sm">
          <Download className="mr-1 h-4 w-4" /> Pobierz PDF
        </Button>
      </div>

      <Card>
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-sm font-semibold">
            📄 Podgląd dekodowania
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          {pdfDataUri ? (
            <iframe
              src={pdfDataUri}
              className="w-full border rounded-md bg-background"
              style={{ height: 700 }}
              title="Podgląd dekodowania PDF"
            />
          ) : (
            <div className="flex items-center justify-center h-64 text-sm text-muted-foreground">
              {generating ? "Generowanie podglądu..." : "Kliknij 'Podgląd' aby wygenerować PDF"}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
