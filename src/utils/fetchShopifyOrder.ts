import { supabase } from "@/integrations/supabase/client";
import type { ShopifyOrderResponse, ShopifyLineItem } from "@/types/shopifyOrder";

export async function fetchShopifyOrder(orderNumber: string): Promise<{
  success: boolean;
  orderName: string | null;
  lineItems: ShopifyLineItem[];
  error?: string;
}> {
  try {
    const { data, error } = await supabase.functions.invoke("fetch-shopify-order", {
      body: { order_number: orderNumber },
    });

    if (error) {
      throw new Error(error.message || "Błąd połączenia z Edge Function");
    }

    const response = data as ShopifyOrderResponse;

    if (!response.success) {
      return {
        success: false,
        orderName: null,
        lineItems: [],
        error: response.error || "Nie udało się pobrać zamówienia",
      };
    }

    const enrichedItems: ShopifyLineItem[] = response.line_items.map((item) => ({
      ...item,
      selected: true,
      decoded: false,
      decode_error: undefined,
    }));

    return {
      success: true,
      orderName: response.order_name,
      lineItems: enrichedItems,
    };
  } catch (err: any) {
    console.error("fetchShopifyOrder error:", err);
    return {
      success: false,
      orderName: null,
      lineItems: [],
      error: err.message || "Wystąpił nieoczekiwany błąd",
    };
  }
}

export function getImageForLineItem(
  item: ShopifyLineItem,
  manualUploadUrl?: string | null,
  mimeeqFetchedUrl?: string | null
): string | null {
  return item.image_url || manualUploadUrl || mimeeqFetchedUrl || null;
}
