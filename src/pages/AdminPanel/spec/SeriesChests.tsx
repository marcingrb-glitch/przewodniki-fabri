import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Tables } from "@/integrations/supabase/types";

interface Props {
  seriesProductId: string;
  seriesProperties: Record<string, any>;
  onUpdate: () => void;
}

type ProductRow = Tables<"products">;

export default function SeriesChests({ seriesProductId, seriesProperties, onUpdate }: Props) {
  const [globalChests, setGlobalChests] = useState<ProductRow[]>([]);
  const [allowedChestIds, setAllowedChestIds] = useState<Set<string>>(new Set());
  const [allowedChestRelations, setAllowedChestRelations] = useState<{ id: string; target_product_id: string | null }[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    const [chestsRes, allowedRes] = await Promise.all([
      supabase.from("products").select("*").eq("category", "chest").eq("is_global", true).order("code"),
      supabase.from("product_relations").select("id, target_product_id").eq("series_id", seriesProductId).eq("relation_type", "allowed_chest"),
    ]);
    setGlobalChests((chestsRes.data ?? []) as ProductRow[]);
    setAllowedChestRelations(allowedRes.data ?? []);
    setAllowedChestIds(new Set((allowedRes.data ?? []).map(r => r.target_product_id).filter(Boolean) as string[]));
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [seriesProductId]);

  const toggleChest = (chestId: string) => {
    setAllowedChestIds(prev => {
      const next = new Set(prev);
      if (next.has(chestId)) next.delete(chestId); else next.add(chestId);
      return next;
    });
  };

  const saveAllowedChests = async () => {
    const toDelete = allowedChestRelations.filter(r => r.target_product_id && !allowedChestIds.has(r.target_product_id));
    if (toDelete.length > 0) {
      await supabase.from("product_relations").delete().in("id", toDelete.map(r => r.id));
    }
    const existingIds = new Set(allowedChestRelations.map(r => r.target_product_id));
    const toInsert = [...allowedChestIds]
      .filter(id => !existingIds.has(id))
      .map(id => ({ series_id: seriesProductId, relation_type: "allowed_chest" as const, target_product_id: id }));
    if (toInsert.length > 0) {
      await supabase.from("product_relations").insert(toInsert);
    }
    toast.success("Dozwolone skrzynie zapisane");
    onUpdate();
    fetchData();
  };

  if (loading) return <div className="text-muted-foreground py-8 text-center">Ładowanie...</div>;

  const checkedChests = globalChests.filter(c => allowedChestIds.has(c.id));

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle className="text-lg">Dozwolone skrzynie w serii</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            {globalChests.map(chest => {
              const cProps = (chest.properties as Record<string, any>) ?? {};
              return (
                <label key={chest.id} className="flex items-center gap-2 cursor-pointer">
                  <Checkbox checked={allowedChestIds.has(chest.id)} onCheckedChange={() => toggleChest(chest.id)} />
                  <span className="font-mono font-bold">{chest.code}</span>
                  <span>— {chest.name}</span>
                  <span className="text-muted-foreground text-sm">(H{cProps.leg_height_cm ?? "?"}cm)</span>
                </label>
              );
            })}
          </div>
          <Button size="sm" className="mt-3" onClick={saveAllowedChests}>Zapisz</Button>
        </CardContent>
      </Card>

      {checkedChests.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-lg">Szczegóły skrzyń w serii</CardTitle></CardHeader>
          <CardContent>
            {seriesProperties.fixed_chest && (
              <p className="text-sm mb-3 font-medium">
                Skrzynia: zawsze {seriesProperties.fixed_chest}. Nóżki plastikowe N4 H2.5cm.
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
                  {checkedChests.map(c => {
                    const cProps = (c.properties as Record<string, any>) ?? {};
                    return (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium">{c.code}</TableCell>
                        <TableCell>{c.name}</TableCell>
                        <TableCell>{cProps.leg_height_cm ?? "—"} cm</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
