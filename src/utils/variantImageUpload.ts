import { supabase } from "@/integrations/supabase/client";

export async function uploadVariantImage(
  orderId: string,
  orderNumber: string,
  file: File
): Promise<string> {
  const fileExt = file.name.split(".").pop();
  const fileName = `${orderNumber}_variant.${fileExt}`;
  const filePath = `${orderNumber}/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from("order-files")
    .upload(filePath, file, { upsert: true });

  if (uploadError) throw uploadError;

  // Save path to orders table
  const { error: updateError } = await supabase
    .from("orders")
    .update({ variant_image_path: filePath } as any)
    .eq("id", orderId);

  if (updateError) throw updateError;

  return filePath;
}

export function getVariantImageSignedUrl(filePath: string): Promise<string | null> {
  return supabase.storage
    .from("order-files")
    .createSignedUrl(filePath, 60 * 60) // 1 hour
    .then(({ data, error }) => {
      if (error || !data?.signedUrl) return null;
      return data.signedUrl;
    });
}
