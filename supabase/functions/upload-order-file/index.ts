import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("[upload-order-file] Missing Authorization header");
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // User client to verify identity
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      console.error("[upload-order-file] Auth failed:", userError?.message);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[upload-order-file] User ${user.id} requesting upload`);

    // Parse multipart form data
    const formData = await req.formData();
    const orderId = formData.get("orderId") as string;
    const orderNumber = formData.get("orderNumber") as string;
    const fileName = formData.get("fileName") as string;
    const fileType = formData.get("fileType") as string;
    const file = formData.get("file") as File;

    if (!orderId || !orderNumber || !fileName || !fileType || !file) {
      console.error("[upload-order-file] Missing required fields");
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Service client for privileged operations
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

    // Verify order ownership or admin role
    const { data: order, error: orderError } = await serviceClient
      .from("orders")
      .select("id, created_by, order_number")
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      console.error("[upload-order-file] Order not found:", orderId);
      return new Response(JSON.stringify({ error: "Order not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check ownership or admin
    const { data: isAdmin } = await serviceClient.rpc("has_role", {
      _user_id: user.id,
      _role: "admin",
    });

    if (order.created_by !== user.id && !isAdmin) {
      console.error(`[upload-order-file] User ${user.id} not authorized for order ${orderId}`);
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[upload-order-file] Authorized. Uploading ${fileName} for order ${orderNumber}`);

    // Upload file using service client (bypasses storage RLS)
    const path = `${orderNumber}/${fileName}`;
    const fileBuffer = await file.arrayBuffer();

    const { error: uploadError } = await serviceClient.storage
      .from("order-files")
      .upload(path, fileBuffer, {
        contentType: "application/pdf",
        upsert: true,
      });

    if (uploadError) {
      console.error("[upload-order-file] Upload failed:", uploadError.message);
      return new Response(JSON.stringify({ error: "Upload failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create signed URL
    const { data: signedData, error: signError } = await serviceClient.storage
      .from("order-files")
      .createSignedUrl(path, 60 * 60 * 24 * 7); // 7 days

    if (signError || !signedData?.signedUrl) {
      console.error("[upload-order-file] Signed URL failed:", signError?.message);
      return new Response(JSON.stringify({ error: "Failed to create signed URL" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Save file metadata using service client
    const { error: metaError } = await serviceClient
      .from("order_files")
      .insert([{
        order_id: orderId,
        file_type: fileType,
        file_url: signedData.signedUrl,
        file_name: fileName,
      }]);

    if (metaError) {
      console.error("[upload-order-file] Metadata save failed:", metaError.message);
      // File uploaded but metadata failed - not critical
    }

    console.log(`[upload-order-file] Success: ${path}`);

    return new Response(
      JSON.stringify({ signedUrl: signedData.signedUrl }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[upload-order-file] Unexpected error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
