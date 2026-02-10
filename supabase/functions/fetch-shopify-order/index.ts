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

    // 5. Map line items
    const lineItems = (order.line_items || []).map((li: any) => {
      const propsRecord: Record<string, string> = {};
      let shortcode: string | null = null;

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
          }
        }
      }

      return {
        line_item_id: li.id,
        sku: li.sku || "",
        title: li.title || "",
        variant_title: li.variant_title || null,
        quantity: li.quantity || 1,
        image_url: li.image?.src || null,
        product_id: li.product_id,
        shortcode,
        is_mmq_product: !!shortcode,
        properties: propsRecord,
      };
    });

    console.log("Mapped", lineItems.length, "line items");

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
