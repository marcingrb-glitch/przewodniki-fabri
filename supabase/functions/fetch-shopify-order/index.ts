import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    // 1. Verify JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ success: false, order_name: null, line_items: [], error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ success: false, order_name: null, line_items: [], error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Parse body
    const { order_number } = await req.json();
    if (!order_number || typeof order_number !== "string") {
      return new Response(
        JSON.stringify({ success: false, order_name: null, line_items: [], error: "Missing or invalid order_number" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const cleanedOrderNumber = order_number.replace(/^#/, "").trim();
    console.log("Fetching Shopify order:", cleanedOrderNumber);

    // 3. Get Shopify access token
    const clientId = Deno.env.get("SHOPIFY_CLIENT_ID")!;
    const clientSecret = Deno.env.get("SHOPIFY_CLIENT_SECRET")!;
    const storeDomain = Deno.env.get("SHOPIFY_STORE_DOMAIN")!;
    const apiVersion = Deno.env.get("SHOPIFY_API_VERSION") || "2026-01";

    console.log("Requesting Shopify token for store:", storeDomain);
    const tokenRes = await fetch(`https://${storeDomain}/admin/oauth/access_token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      console.error("Shopify token error:", tokenRes.status, errText);
      return new Response(
        JSON.stringify({ success: false, order_name: null, line_items: [], error: "Failed to authenticate with Shopify" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { access_token: accessToken } = await tokenRes.json();
    console.log("Shopify token obtained");

    // 4. Fetch order from Shopify
    const ordersUrl = `https://${storeDomain}/admin/api/${apiVersion}/orders.json?name=${encodeURIComponent(cleanedOrderNumber)}&status=any`;
    console.log("Fetching orders from:", ordersUrl);

    const ordersRes = await fetch(ordersUrl, {
      headers: { "X-Shopify-Access-Token": accessToken },
    });

    if (!ordersRes.ok) {
      const errText = await ordersRes.text();
      console.error("Shopify orders error:", ordersRes.status, errText);
      return new Response(
        JSON.stringify({ success: false, order_name: null, line_items: [], error: "Failed to fetch order from Shopify" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const ordersData = await ordersRes.json();
    const orders = ordersData?.orders;
    console.log("Orders found:", orders?.length ?? 0);

    if (!orders || orders.length === 0) {
      return new Response(
        JSON.stringify({ success: false, order_name: null, line_items: [], error: "Order not found" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const order = orders[0];
    console.log("Processing order:", order.name, "with", order.line_items?.length, "line items");

    // 5. Map line items and fetch product images
    const rawItems = (order.line_items || []).map((li: any) => {
      const propsRecord: Record<string, string> = {};
      let shortcode: string | null = null;
      let isMmqProduct = false;
      let mmqSku: string | null = null;

      if (Array.isArray(li.properties)) {
        for (const prop of li.properties) {
          if (prop.name && prop.value != null) {
            propsRecord[prop.name] = String(prop.value);
            if (
              !shortcode &&
              (prop.name === "_mmq_shortcode" || prop.name === "shortcode" || prop.name === "_shortcode")
            ) {
              shortcode = String(prop.value);
            }
            if (prop.name === "_mmqProduct" && String(prop.value) === "true") {
              isMmqProduct = true;
            }
            if (prop.name === "SKU" && prop.value) {
              mmqSku = String(prop.value).trim();
            }
          }
        }
      }

      // Fallback: if no shortcode found in properties, check if variant_title looks like a Mimeeq shortcode
      if (!shortcode && li.variant_title && /^[A-Z0-9]{5,10}$/i.test(li.variant_title)) {
        shortcode = li.variant_title;
        console.log("Shortcode detected from variant_title:", shortcode);
      }

      // For Mimeeq products, use SKU from properties instead of generic line_item.sku
      const effectiveSku = (isMmqProduct || shortcode) && mmqSku ? mmqSku : (li.sku || "");

      return {
        line_item_id: li.id,
        sku: effectiveSku,
        title: li.title || "",
        variant_title: li.variant_title || null,
        quantity: li.quantity || 1,
        product_id: li.product_id,
        variant_id: li.variant_id,
        shortcode,
        is_mmq_product: isMmqProduct || !!shortcode,
        properties: propsRecord,
      };
    });

    // 6. Fetch product images for each unique product_id
    const uniqueProductIds = [...new Set(rawItems.map((i: any) => i.product_id).filter(Boolean))];
    console.log("Fetching images for", uniqueProductIds.length, "unique products");

    const productImageMap: Record<string, any> = {};
    await Promise.all(
      (uniqueProductIds as number[]).map(async (productId: number) => {
        try {
          const prodUrl = `https://${storeDomain}/admin/api/${apiVersion}/products/${productId}.json?fields=images,variants`;
          const prodRes = await fetch(prodUrl, {
            headers: { "X-Shopify-Access-Token": accessToken },
          });
          if (prodRes.ok) {
            const prodData = await prodRes.json();
            productImageMap[productId] = prodData.product;
          } else {
            console.warn("Failed to fetch product", productId, prodRes.status);
          }
        } catch (e) {
          console.warn("Error fetching product", productId, e);
        }
      })
    );

    // 7. Resolve image_url per line item
    const lineItems = rawItems.map((item: any) => {
      let imageUrl: string | null = null;
      const product = productImageMap[item.product_id];

      if (product) {
        const variant = (product.variants || []).find((v: any) => v.id === item.variant_id);
        if (variant?.image_id) {
          const variantImage = (product.images || []).find((img: any) => img.id === variant.image_id);
          if (variantImage) {
            imageUrl = variantImage.src;
          }
        }
        if (!imageUrl && product.images?.length > 0) {
          imageUrl = product.images[0].src;
        }
      }

      return {
        line_item_id: item.line_item_id,
        sku: item.sku,
        sku_source: "shopify" as const,
        title: item.title,
        variant_title: item.variant_title,
        quantity: item.quantity,
        image_url: imageUrl,
        product_id: item.product_id,
        shortcode: item.shortcode,
        is_mmq_product: item.is_mmq_product,
        properties: item.properties,
      };
    });

    console.log("Mapped", lineItems.length, "line items with images");

    // 8. Fetch full Mimeeq data for ALL items with shortcode (SKU enrichment + config capture)
    const mimeeqApiKey = Deno.env.get("MIMEEQ_API_KEY");

    if (mimeeqApiKey) {
      const isGenericSku = (sku: string) => /^S\d{1,2}$/.test(sku.trim());
      const itemsWithShortcode = lineItems.filter((item: any) => item.shortcode);

      console.log("Items with Mimeeq shortcode:", itemsWithShortcode.length);

      await Promise.all(
        itemsWithShortcode.map(async (item: any) => {
          try {
            const mimeeqUrl = `https://mimeeqapi.com/get-product-info?shortCode=${encodeURIComponent(item.shortcode)}`;
            console.log("Fetching Mimeeq data for shortcode:", item.shortcode);

            const mimeeqRes = await fetch(mimeeqUrl, {
              headers: { "X-API-KEY": mimeeqApiKey },
            });

            if (mimeeqRes.ok) {
              const mimeeqData = await mimeeqRes.json();
              console.log(`Mimeeq response for ${item.shortcode}:`, JSON.stringify(mimeeqData));

              // Store full Mimeeq response for debugging and future fallback decoding
              item.mimeeq_data = mimeeqData;

              // SKU enrichment: only for items that need it
              const needsSku = !item.sku || item.sku.trim() === "" || isGenericSku(item.sku);
              if (needsSku && mimeeqData.SKU && mimeeqData.SKU.trim() !== "") {
                console.log(`Mimeeq SKU for ${item.shortcode}: ${mimeeqData.SKU}`);
                item.sku = mimeeqData.SKU.trim();
                item.sku_source = "mimeeq";
              }

              // Image fallback: use Mimeeq image if no Shopify image
              if (!item.image_url && mimeeqData.image) {
                item.image_url = mimeeqData.image;
                console.log(`Using Mimeeq image for ${item.shortcode}`);
              }
            } else {
              console.warn(`Mimeeq API error for ${item.shortcode}:`, mimeeqRes.status);
            }
          } catch (e) {
            console.warn("Error fetching Mimeeq data for", item.shortcode, e);
          }
        })
      );
    } else {
      console.log("MIMEEQ_API_KEY not set, skipping Mimeeq enrichment");
    }

    return new Response(
      JSON.stringify({ success: true, order_name: order.name, line_items: lineItems }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("fetch-shopify-order error:", err);
    return new Response(
      JSON.stringify({ success: false, order_name: null, line_items: [], error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
