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
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } =
      await supabaseAuth.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Parse shortcode
    const { shortcode } = await req.json();
    if (!shortcode || typeof shortcode !== "string") {
      return new Response(
        JSON.stringify({ error: "Missing or invalid shortcode" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // 3. Check cache
    const supabaseService = createClient(supabaseUrl, supabaseServiceKey);
    const { data: cached } = await supabaseService
      .from("variant_images")
      .select("image_url")
      .eq("shortcode", shortcode)
      .maybeSingle();

    if (cached?.image_url) {
      return new Response(
        JSON.stringify({ image_url: cached.image_url, source: "cache" }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // 4. Get Shopify access token via Client Credentials Grant
    const clientId = Deno.env.get("SHOPIFY_CLIENT_ID")!;
    const clientSecret = Deno.env.get("SHOPIFY_CLIENT_SECRET")!;
    const storeDomain = Deno.env.get("SHOPIFY_STORE_DOMAIN")!;
    const apiVersion = Deno.env.get("SHOPIFY_API_VERSION") || "2026-01";

    console.log("Requesting Shopify token for store:", storeDomain);
    const tokenRes = await fetch(
      `https://${storeDomain}/admin/oauth/access_token`,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "client_credentials",
          client_id: clientId,
          client_secret: clientSecret,
        }),
      }
    );

    console.log("Shopify token response status:", tokenRes.status);
    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      console.error("Shopify token error:", tokenRes.status, errText);
      return new Response(
        JSON.stringify({
          error: "Failed to authenticate with Shopify",
          image_url: null,
        }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    // 5. Query Shopify Files API via GraphQL
    const graphqlQuery = `{
      files(first: 1, query: "${shortcode}") {
        edges {
          node {
            ... on MediaImage {
              image {
                url
              }
            }
          }
        }
      }
    }`;

    const shopifyRes = await fetch(
      `https://${storeDomain}/admin/api/${apiVersion}/graphql.json`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Access-Token": accessToken,
        },
        body: JSON.stringify({ query: graphqlQuery }),
      }
    );

    if (!shopifyRes.ok) {
      const errText = await shopifyRes.text();
      console.error("Shopify GraphQL error:", shopifyRes.status, errText);
      return new Response(
        JSON.stringify({
          error: "Failed to query Shopify",
          image_url: null,
        }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const shopifyData = await shopifyRes.json();
    console.log("Shopify files response:", JSON.stringify(shopifyData));
    const edges = shopifyData?.data?.files?.edges;
    const imageUrl = edges?.[0]?.node?.image?.url || null;

    // 6. Save to cache if found
    if (imageUrl) {
      await supabaseService
        .from("variant_images")
        .upsert({ shortcode, image_url: imageUrl });
    }

    return new Response(
      JSON.stringify({
        image_url: imageUrl,
        source: imageUrl ? "shopify" : null,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("get-variant-image error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error", image_url: null }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
