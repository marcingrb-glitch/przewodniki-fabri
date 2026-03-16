import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface PillowMappingProps {
  productId: string;
  seriesProductId: string;
}

export default function PillowMapping({ productId, seriesProductId }: PillowMappingProps) {
  const { data: mapping } = useQuery({
    queryKey: ["pillow-mapping", productId, seriesProductId],
    queryFn: async () => {
      // Try join first, fallback to separate query
      const { data, error } = await supabase
        .from("product_relations")
        .select("*, target_product_id")
        .eq("series_id", seriesProductId)
        .eq("relation_type", "seat_pillow_map")
        .eq("source_product_id", productId)
        .eq("active", true)
        .maybeSingle();
      if (error || !data) return null;

      // Load target product info
      if (data.target_product_id) {
        const { data: target } = await supabase
          .from("products")
          .select("code, name")
          .eq("id", data.target_product_id)
          .single();
        return { ...data, target };
      }
      return data;
    },
  });

  if (!mapping) return null;

  const pillowCode = (mapping as any).target?.code ?? "?";
  const pillowFinish = (mapping as any).properties?.pillow_finish;

  return (
    <div className="text-sm">
      <span className="font-medium">Poduszka oparciowa:</span> {pillowCode}
      {pillowFinish && ` (wykończenie: ${pillowFinish})`}
    </div>
  );
}
