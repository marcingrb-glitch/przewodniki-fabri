import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Tables } from "@/integrations/supabase/types";

interface Props {
  config: Tables<"series_config"> | null;
  seriesId: string;
  onConfigUpdate: () => void;
}

const LEG_TYPE_LABELS: Record<string, string> = {
  from_sku: "Z kodu SKU (drewniane)",
  built_in_plastic: "Wbudowane plastikowe",
  plastic_2_5: "Plastikowe 2.5cm",
};

export default function SeriesOverview({ config, seriesId, onConfigUpdate }: Props) {
  const [notes, setNotes] = useState(config?.notes ?? "");
  const [saving, setSaving] = useState(false);

  if (!config) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Brak konfiguracji dla tej serii. Skontaktuj się z administratorem.
        </CardContent>
      </Card>
    );
  }

  const springExceptions = (config.spring_exceptions as Array<{ seat_code: string; spring: string }>) ?? [];

  const saveNotes = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("series_config")
      .update({ notes })
      .eq("id", config.id);
    setSaving(false);
    if (error) toast.error("Błąd zapisu notatek");
    else {
      toast.success("Notatki zapisane");
      onConfigUpdate();
    }
  };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader><CardTitle className="text-lg">Stałe elementy</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div><span className="font-medium">Oparcie:</span> {config.fixed_backrest ? `zawsze ${config.fixed_backrest}` : "dowolne"}</div>
          <div><span className="font-medium">Skrzynia:</span> {config.fixed_chest ? `zawsze ${config.fixed_chest}` : "dowolna"}</div>
          <div><span className="font-medium">Automat:</span> {config.fixed_automat ? `zawsze ${config.fixed_automat}` : "dowolny"}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-lg">Sprężyna</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div><span className="font-medium">Domyślna:</span> {config.default_spring ?? "—"}</div>
          {springExceptions.length > 0 && (
            <div>
              <span className="font-medium">Wyjątki:</span>
              <ul className="ml-4 list-disc">
                {springExceptions.map((ex, i) => (
                  <li key={i}>{ex.seat_code} → {ex.spring}</li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-lg">Nóżki pod siedziskiem</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div><span className="font-medium">Typ:</span> {LEG_TYPE_LABELS[config.seat_leg_type ?? ""] ?? config.seat_leg_type ?? "—"}</div>
          <div><span className="font-medium">Wysokość:</span> {config.seat_leg_height_cm != null ? `${config.seat_leg_height_cm} cm` : "—"}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-lg">Nóżki pufy</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div><span className="font-medium">Typ:</span> {LEG_TYPE_LABELS[config.pufa_leg_type ?? ""] ?? config.pufa_leg_type ?? "—"}</div>
          <div><span className="font-medium">Wysokość:</span> {config.pufa_leg_height_cm != null ? `${config.pufa_leg_height_cm} cm` : "—"}</div>
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader><CardTitle className="text-lg">Notatki</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Dodaj notatki do tej serii..."
            rows={4}
          />
          <Button size="sm" onClick={saveNotes} disabled={saving}>
            {saving ? "Zapisywanie..." : "Zapisz notatki"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
