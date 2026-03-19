import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Tables } from "@/integrations/supabase/types";

interface Props {
  seriesProductId: string;
  seriesProperties: Record<string, any>;
  seriesCode?: string;
}

type ProductRow = Tables<"products">;

export default function SeriesLegs({ seriesProductId }: Props) {
  const [legs, setLegs] = useState<ProductRow[]>([]);
  const [allowedLegIds, setAllowedLegIds] = useState<Set<string>>(new Set());
  const [allowedLegRelations, setAllowedLegRelations] = useState<{ id: string; target_product_id: string | null }[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = async () => {
    setLoading(true);
    const [legsRes, allowedLegsRes] = await Promise.all([
      supabase.from("products").select("id, code, name, properties, colors")
        .eq("category", "leg").eq("is_global", true).order("code"),
      supabase.from("product_relations").select("id, target_product_id")
        .eq("series_id", seriesProductId).eq("relation_type", "allowed_leg"),
    ]);
    setLegs((legsRes.data as any) ?? []);
    setAllowedLegRelations(allowedLegsRes.data ?? []);
    setAllowedLegIds(new Set((allowedLegsRes.data ?? []).map(r => r.target_product_id).filter(Boolean) as string[]));
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, [seriesProductId]);

  const toggleLeg = (legId: string) => {
    setAllowedLegIds(prev => {
      const next = new Set(prev);
      if (next.has(legId)) next.delete(legId); else next.add(legId);
      return next;
    });
  };

  const saveAllowedLegs = async () => {
    const toDelete = allowedLegRelations.filter(r => r.target_product_id && !allowedLegIds.has(r.target_product_id));
    if (toDelete.length > 0) {
      await supabase.from("product_relations").delete().in("id", toDelete.map(r => r.id));
    }
    const existingIds = new Set(allowedLegRelations.map(r => r.target_product_id));
    const toInsert = [...allowedLegIds]
      .filter(id => !existingIds.has(id))
      .map(id => ({ series_id: seriesProductId, relation_type: "allowed_leg" as const, target_product_id: id }));
    if (toInsert.length > 0) {
      await supabase.from("product_relations").insert(toInsert);
    }
    toast.success("Dozwolone nóżki zapisane");
    fetchAll();
  };

  if (loading) return <div className="text-muted-foreground py-8 text-center">Ładowanie...</div>;

  return (
    <Card>
      <CardHeader><CardTitle className="text-lg">Dozwolone nóżki w serii</CardTitle></CardHeader>
      <CardContent>
        <div className="space-y-2">
          {legs.map(leg => {
            const legProps = (leg.properties as Record<string, any>) ?? {};
            return (
              <label key={leg.id} className="flex items-center gap-2 cursor-pointer">
                <Checkbox checked={allowedLegIds.has(leg.id)} onCheckedChange={() => toggleLeg(leg.id)} />
                <span className="font-mono font-bold">{leg.code}</span>
                <span>— {leg.name}</span>
                <span className="text-muted-foreground text-sm">({legProps.material ?? "—"})</span>
              </label>
            );
          })}
        </div>
        <Button size="sm" className="mt-3" onClick={saveAllowedLegs}>Zapisz</Button>
      </CardContent>
    </Card>
  );
}
