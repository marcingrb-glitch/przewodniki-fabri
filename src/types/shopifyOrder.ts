export interface MimeeqProductInfo {
  shortCode?: string;
  configurationCode?: string;
  productId?: string;
  productName?: string;
  collectionId?: string;
  selectedOptions?: Record<string, unknown>;
  SKU?: string;
  image?: string;
  [key: string]: unknown;
}

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
  sku_source?: "shopify" | "mimeeq";
  mimeeq_data?: MimeeqProductInfo;
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
