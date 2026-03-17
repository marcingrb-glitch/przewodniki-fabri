import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Tables } from "@/integrations/supabase/types";

interface Props {
  seriesProductId: string;
  seriesProduct: Tables<"products">;
  onSeriesUpdate: () => void;
}

const formatLegType = (type: string | null, height: number | null): string => {
  if (!type) return '—';
  switch (type) {
    case 'plastic_2_5': return `N4 plastikowe, H${height}cm`;
    case 'from_sku': return `Z segmentu N (z SKU), H${height}cm`;
    default: return `${type}, H${height}cm`;
  }
};

const LEG_COMPLETION_LABELS: Record<string, string> = {
  from_sku: "Dziewczyny od nóżek (kompletacja do worka)",
  plastic_2_5: "Tapicer (na stanowisku)",
};

export default function SeriesOverview({ seriesProductId, seriesProduct, onSeriesUpdate }: Props) {
  const props = (seriesProduct.properties as Record<string, any>) ?? {};

  const [notes, setNotes] = useState(props.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [seats, setSeats] = useState<{ code: string; spring_type: string | null; model_name: string | null }[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const seatsRes = await supabase
        .from("products")
        .select("code, properties")
        .eq("category", "seat")
        .eq("series_id", seriesProductId)
        .order("code");
      setSeats((seatsRes.data ?? []).map(s => ({
        code: s.code,
        spring_type: (s.properties as any)?.spring_type ?? null,
        model_name: (s.properties as any)?.model_name ?? null,
      })));
    };
    fetchData();
  }, [seriesProductId, seriesProduct]);

  // Derive spring summary from seats
  const springTypes = [...new Set(seats.map((s) => s.spring_type).filter(Boolean))];
  const defaultSpring = springTypes.length === 1 ? springTypes[0] : (springTypes[0] ?? props.default_spring ?? "—");
  const springExceptions = seats.filter((s) => s.spring_type && s.spring_type !== defaultSpring);

  let springSummary = defaultSpring ?? "—";
  if (springExceptions.length > 0) {
    const exceptionTexts = springExceptions.map((s) => {
      const label = s.model_name ? `${s.model_name} (${s.code})` : s.code;
      return `${label} = ${s.spring_type}`;
    });
    springSummary += ` (wyjątek: ${exceptionTexts.join(", ")})`;
  }

  const saveNotes = async () => {
    setSaving(true);
    const currentProps = (seriesProduct.properties as Record<string, any>) ?? {};
    const updatedProps = { ...currentProps, notes };
    const { error } = await supabase
      .from("products")
      .update({ properties: updatedProps })
      .eq("id", seriesProductId);
    setSaving(false);
    if (error) toast.error("Błąd zapisu notatek");
    else { toast.success("Notatki zapisane"); onSeriesUpdate(); }
  };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader><CardTitle className="text-lg">Stałe elementy</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div><span className="font-medium">Oparcie:</span> {props.fixed_backrest ? `zawsze ${props.fixed_backrest}` : "dowolne"}</div>
          <div><span className="font-medium">Skrzynia:</span> {props.fixed_chest ? `zawsze ${props.fixed_chest}` : "dowolna"}</div>
          <div><span className="font-medium">Automat:</span> {props.fixed_automat ? `zawsze ${props.fixed_automat}` : "dowolny"}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-lg">Sprężyna</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div>{springSummary}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-lg">Nóżki pufy</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div><span className="font-medium">Typ:</span> {formatLegType(props.pufa_leg_type, props.pufa_leg_height_cm)}</div>
          <div><span className="font-medium">Kompletacja:</span> {LEG_COMPLETION_LABELS[props.pufa_leg_type ?? "from_sku"] ?? "—"}</div>
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader><CardTitle className="text-lg">Notatki</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Dodaj notatki do tej serii..." rows={4} />
          <Button size="sm" onClick={saveNotes} disabled={saving}>{saving ? "Zapisywanie..." : "Zapisz notatki"}</Button>
        </CardContent>
      </Card>
    </div>
  );
}
