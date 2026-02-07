import { supabase } from "@/integrations/supabase/client";
import { DecodedSKU } from "@/types";

interface OrderInsert {
  order_number: string;
  order_date: string;
  sku: string;
  series_code: string;
  decoded_data: DecodedSKU;
}

export async function saveOrder(data: OrderInsert) {
  const { data: result, error } = await supabase
    .from("orders")
    .insert([{
      order_number: data.order_number,
      order_date: data.order_date,
      sku: data.sku,
      series_code: data.series_code,
      decoded_data: JSON.parse(JSON.stringify(data.decoded_data)),
    }])
    .select()
    .maybeSingle();

  if (error) throw error;
  return result;
}

export async function getRecentOrders(limit = 5) {
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
}

export async function getOrderById(id: string) {
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data;
}
