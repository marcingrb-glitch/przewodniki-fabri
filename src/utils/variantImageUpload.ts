import { supabase } from "@/integrations/supabase/client";

export async function uploadVariantImage(
  orderId: string,
  orderNumber: string,
  file: File
): Promise<string> {
  const fileExt = file.name.split(".").pop();
  const fileName = `${orderNumber}_variant.${fileExt}`;

  // Upload via edge function (service role bypasses storage RLS)
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error("Not authenticated");

  const formData = new FormData();
  formData.append("orderId", orderId);
  formData.append("orderNumber", orderNumber);
  formData.append("fileName", fileName);
  formData.append("fileType", "variant_image");
  formData.append("file", file, fileName);

  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/upload-order-file`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
      body: formData,
    }
  );

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: "Upload failed" }));
    throw new Error(err.error || "Upload failed");
  }

  return `${orderNumber}/${fileName}`;
}

export function getVariantImageSignedUrl(filePath: string): Promise<string | null> {
  return supabase.storage
    .from("order-files")
    .createSignedUrl(filePath, 60 * 60)
    .then(({ data, error }) => {
      if (error || !data?.signedUrl) return null;
      return data.signedUrl;
    });
}
