import { supabase } from "@/integrations/supabase/client";
import { DecodedSKU } from "@/types";

export async function resolveSeriesId(seriesCode: string): Promise<string | null> {
  const { data } = await supabase
    .from("products")
    .select("id")
    .eq("category", "series")
    .eq("code", seriesCode)
    .maybeSingle();
  return data?.id ?? null;
}

interface OrderInsert {
  order_number: string;
  order_date: string;
  sku: string;
  series_code: string;
  decoded_data: DecodedSKU;
  created_by?: string;
  visible_to_workers?: boolean;
  variant_image_url?: string;
  mimeeq_shortcode?: string;
  mimeeq_data?: Record<string, unknown>;
  shopify_order_name?: string;
}

export async function checkOrderNumberExists(orderNumber: string): Promise<boolean> {
  const { data } = await supabase
    .from("orders")
    .select("id")
    .eq("order_number", orderNumber)
    .maybeSingle();
  return !!data;
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
      created_by: data.created_by,
      visible_to_workers: data.visible_to_workers ?? false,
      variant_image_url: data.variant_image_url ?? null,
      mimeeq_shortcode: data.mimeeq_shortcode ?? null,
      mimeeq_data: data.mimeeq_data ?? null,
      shopify_order_name: data.shopify_order_name ?? null,
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

interface GetOrdersParams {
  searchQuery?: string;
  dateFrom?: string | null;
  dateTo?: string | null;
  seriesCode?: string | null;
  fabricFilter?: "all" | "missing";
  page?: number;
  limit?: number;
}

export async function getOrders({
  searchQuery = "",
  dateFrom = null,
  dateTo = null,
  seriesCode = null,
  fabricFilter = "all",
  page = 1,
  limit = 20,
}: GetOrdersParams = {}) {
  let query = supabase
    .from("orders")
    .select("*", { count: "exact" });

  if (searchQuery) {
    query = query.or(`order_number.ilike.%${searchQuery}%,shopify_order_name.ilike.%${searchQuery}%`);
  }
  if (dateFrom) {
    query = query.gte("order_date", dateFrom);
  }
  if (dateTo) {
    query = query.lte("order_date", dateTo);
  }
  if (seriesCode && seriesCode !== "all") {
    query = query.eq("series_code", seriesCode);
  }
  if (fabricFilter === "missing") {
    query = query.is("fabric_usage_mb", null);
  }

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data, error, count } = await query
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) throw error;
  return { data, count };
}

export async function deleteOrder(orderId: string, orderNumber: string) {
  // 1. Delete files from storage
  const { data: files } = await supabase.storage
    .from("order-files")
    .list(orderNumber);

  if (files && files.length > 0) {
    const filePaths = files.map((f) => `${orderNumber}/${f.name}`);
    await supabase.storage.from("order-files").remove(filePaths);
  }

  // 2. Delete order_files records
  await supabase.from("order_files").delete().eq("order_id", orderId);

  // 3. Delete order
  const { error } = await supabase.from("orders").delete().eq("id", orderId);
  if (error) throw error;
}
