import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Tables } from "@/integrations/supabase/types";

interface Props {
  config: Tables<"series_config"> | null;
  seriesId: string;
  onConfigUpdate: () => void;
}

export default function SeriesOverview({ config, seriesId, onConfigUpdate }: Props) {
  const [notes, setNotes] = useState(config?.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [chests, setChests] = useState<Tables<"chests">[]>([]);
  const [seats, setSeats] = useState<Tables<"seats_sofa">[]>([]);

  const availableChests: string[] = (config as any)?.available_chests ?? [];

  useEffect(() => {
    const fetchData = async () => {
      const seatsRes = await supabase.from("seats_sofa").select("code, spring_type").eq("series_id", seriesId).order("code");
      setSeats(seatsRes.data ?? []);
      if (availableChests.length > 0) {
        const chestsRes = await supabase.from("chests").select("*").in("code", availableChests).order("code");
        setChests(chestsRes.data ?? []);
      }
    };
    fetchData().then(() => {}).catch(() => {
      setSeats(seatsRes.data ?? []);
      setChests(chestsRes?.data ?? []);
    });
  }, [seriesId, config]);

  if (!config) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Brak konfiguracji dla tej serii. Skontaktuj się z administratorem.
        </CardContent>
      </Card>
    );
  }

  // Derive spring summary from seats_sofa
  const springTypes = [...new Set(seats.map((s) => s.spring_type).filter(Boolean))];
  const defaultSpring = springTypes.length === 1 ? springTypes[0] : (config.default_spring ?? "—");
  const springExceptions = seats.filter((s) => s.spring_type && s.spring_type !== defaultSpring);

  const saveNotes = async () => {
    setSaving(true);
    const { error } = await supabase.from("series_config").update({ notes }).eq("id", config.id);
    setSaving(false);
    if (error) toast.error("Błąd zapisu notatek");
    else { toast.success("Notatki zapisane"); onConfigUpdate(); }
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
          <div><span className="font-medium">Domyślna:</span> {defaultSpring ?? "—"}</div>
          {springExceptions.length > 0 && (
            <div>
              <span className="font-medium">Wyjątki:</span>
              <ul className="ml-4 list-disc">
                {springExceptions.map((s) => (
                  <li key={s.code}>{s.code} → {s.spring_type}</li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-lg">Nóżki pufy</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div><span className="font-medium">Typ:</span> {config.pufa_leg_type ?? "—"}</div>
          <div><span className="font-medium">Wysokość:</span> {config.pufa_leg_height_cm != null ? `${config.pufa_leg_height_cm} cm` : "—"}</div>
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader><CardTitle className="text-lg">Skrzynie dostępne w serii</CardTitle></CardHeader>
        <CardContent>
          {chests.length === 0 ? (
            <p className="text-muted-foreground text-sm">Brak skrzyń przypisanych do serii</p>
          ) : (
            <>
              {config.fixed_chest && (
                <p className="text-sm mb-3 font-medium">
                  Skrzynia: zawsze {config.fixed_chest}
                  {config.fixed_chest === "SK23" && " (alias SK22 → SK23)"}
                  . Nóżki plastikowe N4 H2.5cm.
                </p>
              )}
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Kod</TableHead>
                      <TableHead>Nazwa</TableHead>
                      <TableHead>Wys. nóżek</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {chests.map(c => (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium">{c.code}</TableCell>
                        <TableCell>{c.name}</TableCell>
                        <TableCell>{c.leg_height_cm} cm</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
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
