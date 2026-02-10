export interface ShopifyLineItem {
  line_item_id: number;
  sku: string;
  title: string;
  variant_title: string | null;
  quantity: number;
  image_url: string | null;
  product_id: number;
  shortcode: string | null;
  is_mmq_product: boolean;
  properties: Record<string, string>;
  selected: boolean;
  decoded: boolean;
  decode_error?: string;
}

export interface ShopifyOrderResponse {
  success: boolean;
  order_name: string | null;
  line_items: Omit<ShopifyLineItem, "selected" | "decoded" | "decode_error">[];
  error?: string;
}

export interface ShopifyOrderFormData {
  shopify_order_number: string;
  base_order_number: string;
  line_items: ShopifyLineItem[];
}
