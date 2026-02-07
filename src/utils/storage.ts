import { supabase } from "@/integrations/supabase/client";

export async function uploadPDF(orderNumber: string, fileName: string, pdfBlob: Blob): Promise<string> {
  const path = `${orderNumber}/${fileName}`;

  const { error } = await supabase.storage
    .from("order-files")
    .upload(path, pdfBlob, {
      contentType: "application/pdf",
      upsert: true,
    });

  if (error) throw error;

  const { data } = supabase.storage
    .from("order-files")
    .getPublicUrl(path);

  return data.publicUrl;
}

export async function saveOrderFile(orderId: string, fileType: string, fileUrl: string, fileName?: string) {
  const { error } = await supabase
    .from("order_files")
    .insert([{ order_id: orderId, file_type: fileType, file_url: fileUrl, file_name: fileName }]);

  if (error) throw error;
}
