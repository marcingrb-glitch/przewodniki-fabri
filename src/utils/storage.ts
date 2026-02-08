import { supabase } from "@/integrations/supabase/client";

export async function uploadAndSaveOrderFile(
  orderId: string,
  orderNumber: string,
  fileName: string,
  fileType: string,
  pdfBlob: Blob
): Promise<string> {
  const formData = new FormData();
  formData.append("orderId", orderId);
  formData.append("orderNumber", orderNumber);
  formData.append("fileName", fileName);
  formData.append("fileType", fileType);
  formData.append("file", pdfBlob, fileName);

  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error("Not authenticated");

  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID || "gvjthssbfiftbfeounhm";
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

  const result = await response.json();
  return result.signedUrl;
}
