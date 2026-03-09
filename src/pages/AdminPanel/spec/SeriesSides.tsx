import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Tables } from "@/integrations/supabase/types";

interface Props {
  seriesId: string;
}

type Side = Tables<"sides">;
type Seat = Tables<"seats_sofa">;
type Compat = Tables<"seat_side_compatibility">;

export default function SeriesSides({ seriesId }: Props) {
  const [sides, setSides] = useState<Side[]>([]);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [compat, setCompat] = useState<Compat[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = async () => {
    setLoading(true);
    const [sidesRes, seatsRes, compatRes] = await Promise.all([
      supabase.from("sides").select("*").eq("series_id", seriesId).order("code"),
      supabase.from("seats_sofa").select("*").eq("series_id", seriesId).order("code"),
      supabase.from("seat_side_compatibility").select("*").eq("series_id", seriesId),
    ]);
    setSides(sidesRes.data ?? []);
    setSeats(seatsRes.data ?? []);
    setCompat(compatRes.data ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, [seriesId]);

  const getCompat = (sideCode: string, seatCode: string) => {
    return compat.find((c) => c.side_code === sideCode && c.seat_code === seatCode);
  };

  const toggleCompat = async (sideCode: string, seatCode: string) => {
    const existing = getCompat(sideCode, seatCode);
    if (existing) {
      const { error } = await supabase.from("seat_side_compatibility")
        .update({ compatible: !existing.compatible })
        .eq("id", existing.id);
      if (error) toast.error("Błąd zapisu");
      else fetchAll();
    } else {
      const { error } = await supabase.from("seat_side_compatibility")
        .insert({ series_id: seriesId, side_code: sideCode, seat_code: seatCode, compatible: true });
      if (error) toast.error("Błąd zapisu");
      else fetchAll();
    }
  };

  if (loading) return <div className="text-muted-foreground py-8 text-center">Ładowanie...</div>;

  // Deduplicate seats by code (ignore D variants for compatibility matrix)
  const uniqueSeats = seats.filter((s) => !s.code.endsWith("D"));

  return (
    <div className="space-y-6">
      {/* Sides table */}
      <Card>
        <CardHeader><CardTitle className="text-lg">Boczki</CardTitle></CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kod</TableHead>
                  <TableHead>Nazwa</TableHead>
                  <TableHead>Stelaż</TableHead>
                  <TableHead>Wykończenia</TableHead>
                  <TableHead>Domyślne</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sides.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-4">Brak boczków</TableCell></TableRow>
                ) : sides.map((side) => (
                  <TableRow key={side.id}>
                    <TableCell className="font-medium">{side.code}</TableCell>
                    <TableCell>{side.name}</TableCell>
                    <TableCell>{side.frame ?? "—"}</TableCell>
                    <TableCell>{side.allowed_finishes?.join(", ") ?? "—"}</TableCell>
                    <TableCell>{side.default_finish ?? "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Compatibility matrix */}
      {compat.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-lg">Kompatybilność boczek ↔ siedzisko</CardTitle></CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Boczek</TableHead>
                    {uniqueSeats.map((seat) => (
                      <TableHead key={seat.code} className="text-center">
                        <div>{seat.code}</div>
                        {seat.model_name && <div className="text-xs font-normal text-muted-foreground">{seat.model_name}</div>}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sides.map((side) => (
                    <TableRow key={side.code}>
                      <TableCell className="font-medium">{side.code} {side.name}</TableCell>
                      {uniqueSeats.map((seat) => {
                        const c = getCompat(side.code, seat.code);
                        const isCompatible = c?.compatible ?? false;
                        return (
                          <TableCell key={seat.code} className="text-center">
                            <Checkbox
                              checked={isCompatible}
                              onCheckedChange={() => toggleCompat(side.code, seat.code)}
                            />
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
