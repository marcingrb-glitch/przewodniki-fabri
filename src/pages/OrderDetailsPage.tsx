import { useState, useEffect, useCallback } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Download, Eye, FileText, Tag, Package, Loader2, Maximize2, Save } from "lucide-react";
import { toast } from "sonner";
import JSZip from "jszip";
import { DecodedSKU } from "@/types";
import { getOrderById } from "@/utils/supabaseQueries";
import { getVariantImageSignedUrl } from "@/utils/variantImageUpload";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";

import { downloadBlob } from "@/utils/pdfHelpers";
import { generateWarehouseGuidePDF } from "@/utils/pdfGenerators/warehouseGuide";
import { generateSofaLabelsPDF, generatePufaLabelsPDF, generateFotelLabelsPDF } from "@/utils/pdfGenerators/labels";
import { generateProductionGuidePDF, generatePufaProductionGuidePDF, generateFotelProductionGuidePDF } from "@/utils/pdfGenerators/productionGuide";
import { uploadAndSaveOrderFile } from "@/utils/storage";
import PDFPreview from "@/components/PDFPreview";

const OrderDetailsPage = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null);
  const [previewTitle, setPreviewTitle] = useState("");
  const [previewFileName, setPreviewFileName] = useState("");
  const [loading, setLoading] = useState<string | null>(null);
  const [imagePopupOpen, setImagePopupOpen] = useState(false);
  const [variantImageUrl, setVariantImageUrl] = useState<string | null>(null);
  const [fabricUsage, setFabricUsage] = useState<number | null>(null);
  const [savingFabric, setSavingFabric] = useState(false);

  const stateDecoded = (location.state as { decoded?: DecodedSKU })?.decoded;

  const { data: order, isLoading } = useQuery({
    queryKey: ["order", id],
    queryFn: () => getOrderById(id!),
    enabled: !!id,
  });

  const decoded: DecodedSKU | undefined = stateDecoded || (order?.decoded_data as unknown as DecodedSKU);
  const variantImagePath = (order as any)?.variant_image_path as string | undefined;
  const variantImageUrlFromOrder = (order as any)?.variant_image_url as string | undefined;
  const orderId = id || "";
  const orderNumber = decoded?.orderNumber || order?.order_number || "";

  useEffect(() => {
    if (variantImagePath) {
      getVariantImageSignedUrl(variantImagePath).then(url => setVariantImageUrl(url));
    } else if (variantImageUrlFromOrder) {
      setVariantImageUrl(variantImageUrlFromOrder);
    }
  }, [variantImagePath, variantImageUrlFromOrder]);

  // Init fabric usage from order
  useEffect(() => {
    if (order) {
      setFabricUsage((order as any).fabric_usage_mb ?? null);
    }
  }, [order]);

  const handleSaveFabricUsage = useCallback(async () => {
    if (!order) return;
    setSavingFabric(true);
    try {
      const { error } = await supabase
        .from("orders")
        .update({
          fabric_usage_mb: fabricUsage,
          fabric_usage_updated_at: new Date().toISOString(),
          fabric_usage_updated_by: (await supabase.auth.getUser()).data.user?.id ?? null,
        } as any)
        .eq("id", order.id);
      if (error) throw error;
      toast.success("✅ Zużycie tkaniny zapisane");
    } catch (err: any) {
      toast.error(`❌ Błąd zapisu: ${err.message}`);
    } finally {
      setSavingFabric(false);
    }
  }, [order, fabricUsage]);

  const withLoading = async (key: string, fn: () => Promise<void>) => {
    setLoading(key);
    try { await fn(); } catch (err: unknown) {
      toast.error(`❌ ${err instanceof Error ? err.message : "Błąd"}`);
    } finally { setLoading(null); }
  };

  const preview = (blob: Blob, title: string, fileName: string) => {
    setPreviewBlob(blob);
    setPreviewTitle(title);
    setPreviewFileName(fileName);
  };

  const downloadAndSave = async (blob: Blob, fileName: string, fileType: string) => {
    downloadBlob(blob, fileName);
    try {
      await uploadAndSaveOrderFile(orderId, orderNumber, fileName, fileType, blob);
    } catch { /* storage upload is optional */ }
    toast.success(`✅ Pobrano: ${fileName}`);
  };

  if (isLoading && !stateDecoded) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!decoded) {
    return (
      <Card className="shadow-md">
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">Nie znaleziono danych zamówienia.</p>
          <Button variant="link" onClick={() => navigate("/")}>Wróć do strony głównej</Button>
        </CardContent>
      </Card>
    );
  }

  const hasPufa = !!decoded.pufaSKU;
  const hasFotel = !!decoded.fotelSKU;
  const pufaSeat = decoded.pufaSeat;

  const ActionBtn = ({ icon: Icon, label, loadKey, onClick }: { icon: typeof Eye; label: string; loadKey: string; onClick: () => Promise<void> | void }) => (
    <Button variant="outline" size="sm" className="gap-1.5" disabled={loading === loadKey} onClick={() => withLoading(loadKey, async () => { await onClick(); })}>
      {loading === loadKey ? <Loader2 className="h-4 w-4 animate-spin" /> : <Icon className="h-4 w-4" />}
      {label}
    </Button>
  );

  return (
    <div className="space-y-6">
      <PDFPreview pdfBlob={previewBlob} title={previewTitle} fileName={previewFileName} onClose={() => setPreviewBlob(null)} />

      {/* Header */}
      <Card className="shadow-md">
        <CardHeader>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              {variantImageUrl && (
                <div
                  className="relative w-16 h-16 rounded border cursor-pointer hover:opacity-80 transition shrink-0 overflow-hidden"
                  onClick={() => setImagePopupOpen(true)}
                >
                  <img
                    src={variantImageUrl}
                    alt="Wariant sofy"
                    className="w-full h-full object-cover rounded"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/20 transition">
                    <Maximize2 className="w-4 h-4 text-white opacity-0 group-hover:opacity-100" />
                  </div>
                </div>
              )}
              <div>
                <CardTitle className="text-2xl">ZAMÓWIENIE: {orderNumber}</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  SKU: <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">{decoded.rawSKU || order?.sku}</code>
                </p>
                <p className="text-sm text-muted-foreground">Data: {decoded.orderDate || (order?.order_date ? new Date(order.order_date).toLocaleDateString("pl-PL") : "")}</p>
                {decoded.fabricOverride && (
                  <Badge variant="outline" className="mt-1 border-orange-400 text-orange-600">
                    Zmiana tkaniny: {decoded.fabricOverride.name} {decoded.fabricOverride.color}
                  </Badge>
                )}
              </div>
            </div>
            <div className="self-start text-right">
              <p className="text-sm text-muted-foreground mb-1">Zużycie tkaniny</p>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="—"
                  value={fabricUsage ?? ""}
                  onChange={(e) => setFabricUsage(e.target.value ? Number(e.target.value) : null)}
                  className="w-[100px] h-10 rounded-md border border-input bg-background px-3 text-lg font-mono font-bold text-right"
                />
                <span className="text-lg font-bold">mb</span>
                <Button size="sm" onClick={handleSaveFabricUsage} disabled={savingFabric}>
                  {savingFabric ? "..." : "Zapisz"}
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* SOFA */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-xl">🛋️ SOFA - {decoded.series.code} {decoded.series.name} [{decoded.series.collection}]</CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" defaultValue="decoding" collapsible>
            <AccordionItem value="decoding">
              <AccordionTrigger className="text-base font-semibold">Dekodowanie SKU</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2 text-sm">
                  <InfoRow label="Seria" value={`${decoded.series.code} - ${decoded.series.name} [${decoded.series.collection}]`} />
                  <InfoRow label="Tkanina" value={`${decoded.fabric.code}${decoded.fabric.color} - ${decoded.fabric.name}, kolor ${decoded.fabric.colorName}`} />
                  <InfoRow label="Siedzisko" value={`${decoded.seat.code} - ${decoded.seat.modelName ? `${decoded.seat.modelName}${decoded.seat.type ? ` ${decoded.seat.type}` : ''}` : decoded.seat.type || '?'}, wykończenie ${decoded.seat.finish} (${decoded.seat.finishName})`} />
                  <InfoRow label="Boczek" value={`${decoded.side.code}${decoded.side.finish} - ${decoded.side.name}, wykończenie ${decoded.side.finishName}`} />
                  <InfoRow label="Oparcie" value={`${decoded.backrest.code}${decoded.backrest.finish} - ${decoded.backrest.height}cm${decoded.backrest.springType ? `, sprężyna ${decoded.backrest.springType}` : ''}, wykończenie ${decoded.backrest.finishName}`} />
                  <InfoRow label="Skrzynia" value={decoded.chest.code} />
                  <InfoRow label="Automat" value={`${decoded.automat.code} - ${decoded.automat.name}`} />
                  {decoded.legs && <InfoRow label="Nóżki" value={`${decoded.legs.code}${decoded.legs.color || ""} - ${decoded.legs.name} ${decoded.legs.material}${decoded.legs.colorName ? `, ${decoded.legs.colorName}` : ""}`} />}
                  {decoded.pillow && <InfoRow label="Poduszka" value={`${decoded.pillow.code} - ${decoded.pillow.name}`} />}
                  {decoded.jaski && <InfoRow label="Jaśki" value={`${decoded.jaski.code} - ${decoded.jaski.name}`} />}
                  {decoded.walek && <InfoRow label="Wałek" value={`${decoded.walek.code} - ${decoded.walek.name}`} />}
                  <div className="mt-3 border-t pt-3">
                    <p className="font-semibold mb-1">Nóżki sofy:</p>
                    {decoded.legHeights.sofa_chest
                      ? <InfoRow label="Pod skrzynią" value={`${decoded.legHeights.sofa_chest.leg} H ${decoded.legHeights.sofa_chest.height}cm (${decoded.legHeights.sofa_chest.count} szt)`} />
                      : <InfoRow label="Pod skrzynią" value="BRAK" />}
                    {decoded.legHeights.sofa_seat
                      ? <InfoRow label="Pod siedziskiem" value={`${decoded.legHeights.sofa_seat.leg} H ${decoded.legHeights.sofa_seat.height}cm (${decoded.legHeights.sofa_seat.count} szt)`} />
                      : <InfoRow label="Pod siedziskiem" value="BRAK (AT2)" />}
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
          <div className="mt-4 flex flex-wrap gap-2">
            <ActionBtn icon={Eye} label="Przewodnik Magazyn" loadKey="guide-preview" onClick={async () => preview(await generateWarehouseGuidePDF(decoded), "Przewodnik Magazyn", `przewodnik_magazyn_${orderNumber}.pdf`)} />
            <ActionBtn icon={Download} label="Pobierz Przew. Magazyn" loadKey="guide-dl" onClick={async () => downloadAndSave(await generateWarehouseGuidePDF(decoded), `przewodnik_magazyn_${orderNumber}.pdf`, "guide")} />
            <ActionBtn icon={Eye} label="Podgląd etykiet" loadKey="sofa-labels-preview" onClick={async () => preview(await generateSofaLabelsPDF(decoded), "Etykiety Sofy", `sofa_etykiety_${orderNumber}.pdf`)} />
            <ActionBtn icon={Tag} label="Pobierz etykiety" loadKey="sofa-labels-dl" onClick={async () => downloadAndSave(await generateSofaLabelsPDF(decoded), `sofa_etykiety_${orderNumber}.pdf`, "sofa_labels")} />
            <ActionBtn icon={Eye} label="Przewodnik Produkcja" loadKey="sofa-decode-preview" onClick={async () => preview(await generateProductionGuidePDF(decoded, variantImageUrl || undefined), "Przewodnik Produkcja", `przewodnik_produkcja_sofa_${orderNumber}.pdf`)} />
            <ActionBtn icon={Download} label="Pobierz Przew. Produkcja" loadKey="sofa-decode-dl" onClick={async () => downloadAndSave(await generateProductionGuidePDF(decoded, variantImageUrl || undefined), `przewodnik_produkcja_sofa_${orderNumber}.pdf`, "production_sofa")} />
          </div>
        </CardContent>
      </Card>

      {/* PUFA */}
      {hasPufa && (
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="text-xl">🪑 PUFA - {decoded.pufaSKU}</CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" defaultValue="pufa-decoding" collapsible>
              <AccordionItem value="pufa-decoding">
                <AccordionTrigger className="text-base font-semibold">Dekodowanie SKU pufy</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2 text-sm">
                    <InfoRow label="Seria" value={`${decoded.series.code} - ${decoded.series.name}`} />
                    <InfoRow label="Tkanina" value={`${decoded.fabric.code}${decoded.fabric.color} - ${decoded.fabric.name}, ${decoded.fabric.colorName}`} />
                     <InfoRow label="Siedzisko" value={`${decoded.seat.code} - ${decoded.seat.modelName ? `${decoded.seat.modelName}${decoded.seat.type ? ` ${decoded.seat.type}` : ''}` : decoded.seat.type || '?'}`} />
                    {pufaSeat && <>
                      <InfoRow label="Front/Tył" value={pufaSeat.frontBack} />
                      <InfoRow label="Boki" value={pufaSeat.sides} />
                      <InfoRow label="Pianka bazowa" value={pufaSeat.foam} />
                      <InfoRow label="Skrzynka" value={pufaSeat.box} />
                    </>}
                    {decoded.pufaLegs && <InfoRow label="Nóżki" value={`${decoded.pufaLegs.code} H ${decoded.pufaLegs.height}cm (${decoded.pufaLegs.count} szt)`} />}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
            <div className="mt-4 flex flex-wrap gap-2">
              <ActionBtn icon={Eye} label="Podgląd etykiet" loadKey="pufa-labels-preview" onClick={async () => preview(await generatePufaLabelsPDF(decoded), "Etykiety Pufy", `pufa_etykiety_${orderNumber}.pdf`)} />
              <ActionBtn icon={Tag} label="Pobierz etykiety" loadKey="pufa-labels-dl" onClick={async () => downloadAndSave(await generatePufaLabelsPDF(decoded), `pufa_etykiety_${orderNumber}.pdf`, "pufa_labels")} />
              <ActionBtn icon={Eye} label="Przewodnik Produkcja pufy" loadKey="pufa-decode-preview" onClick={async () => preview(await generatePufaProductionGuidePDF(decoded), "Przewodnik Produkcja pufy", `przewodnik_produkcja_pufa_${orderNumber}.pdf`)} />
              <ActionBtn icon={Download} label="Pobierz Przew. Produkcja pufy" loadKey="pufa-decode-dl" onClick={async () => downloadAndSave(await generatePufaProductionGuidePDF(decoded), `przewodnik_produkcja_pufa_${orderNumber}.pdf`, "production_pufa")} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* FOTEL */}
      {hasFotel && (
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="text-xl">💺 FOTEL - {decoded.fotelSKU}</CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" defaultValue="fotel-decoding" collapsible>
              <AccordionItem value="fotel-decoding">
                <AccordionTrigger className="text-base font-semibold">Dekodowanie SKU fotela</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2 text-sm">
                    <InfoRow label="Seria" value={`${decoded.series.code} - ${decoded.series.name}`} />
                    <InfoRow label="Tkanina" value={`${decoded.fabric.code}${decoded.fabric.color} - ${decoded.fabric.name}, ${decoded.fabric.colorName}`} />
                    <InfoRow label="Siedzisko" value={`${decoded.seat.code} - ${decoded.seat.modelName ? `${decoded.seat.modelName}${decoded.seat.type ? ` ${decoded.seat.type}` : ''}` : decoded.seat.type || '?'}`} />
                    <InfoRow label="Boczek" value={`${decoded.side.code}${decoded.side.finish} - ${decoded.side.name}`} />
                    {decoded.jaski && <InfoRow label="Jaśki" value={`${decoded.jaski.code} - ${decoded.jaski.name}`} />}
                    {decoded.fotelLegs && <InfoRow label="Nóżki" value={`${decoded.fotelLegs.code} H ${decoded.fotelLegs.height}cm (${decoded.fotelLegs.count} szt)`} />}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
            <div className="mt-4 flex flex-wrap gap-2">
              <ActionBtn icon={Eye} label="Podgląd etykiet" loadKey="fotel-labels-preview" onClick={async () => preview(await generateFotelLabelsPDF(decoded), "Etykiety Fotela", `fotel_etykiety_${orderNumber}.pdf`)} />
              <ActionBtn icon={Tag} label="Pobierz etykiety" loadKey="fotel-labels-dl" onClick={async () => downloadAndSave(await generateFotelLabelsPDF(decoded), `fotel_etykiety_${orderNumber}.pdf`, "fotel_labels")} />
              <ActionBtn icon={Eye} label="Przewodnik Produkcja fotela" loadKey="fotel-decode-preview" onClick={async () => preview(await generateFotelProductionGuidePDF(decoded), "Przewodnik Produkcja fotela", `przewodnik_produkcja_fotel_${orderNumber}.pdf`)} />
              <ActionBtn icon={Download} label="Pobierz Przew. Produkcja fotela" loadKey="fotel-decode-dl" onClick={async () => downloadAndSave(await generateFotelProductionGuidePDF(decoded), `przewodnik_produkcja_fotel_${orderNumber}.pdf`, "production_fotel")} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bulk actions */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-lg">📦 Akcje zbiorcze</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3">
          <ActionBtn icon={FileText} label="Pobierz Przew. Magazyn" loadKey="all-guides" onClick={async () => {
            const guideBlob = await generateWarehouseGuidePDF(decoded);
            downloadBlob(guideBlob, `przewodnik_magazyn_${orderNumber}.pdf`);
            toast.success("✅ Pobrano przewodnik magazyn");
          }} />
          <ActionBtn icon={Tag} label="Pobierz wszystkie etykiety" loadKey="all-labels" onClick={async () => {
            const blobs: { name: string; blob: Blob }[] = [];
            blobs.push({ name: "sofa_etykiety.pdf", blob: await generateSofaLabelsPDF(decoded) });
            if (hasPufa) blobs.push({ name: "pufa_etykiety.pdf", blob: await generatePufaLabelsPDF(decoded) });
            if (hasFotel) blobs.push({ name: "fotel_etykiety.pdf", blob: await generateFotelLabelsPDF(decoded) });
            const zip = new JSZip();
            blobs.forEach(b => zip.file(b.name, b.blob));
            const zipBlob = await zip.generateAsync({ type: "blob" });
            downloadBlob(zipBlob, `etykiety_${orderNumber}.zip`);
            toast.success("✅ Pobrano wszystkie etykiety");
          }} />
          <ActionBtn icon={Package} label="Pobierz wszystko (ZIP)" loadKey="all-zip" onClick={async () => {
            const zip = new JSZip();
            zip.file("przewodnik_magazyn.pdf", await generateWarehouseGuidePDF(decoded));
            zip.file("sofa_etykiety.pdf", await generateSofaLabelsPDF(decoded));
            zip.file("przewodnik_produkcja_sofa.pdf", await generateProductionGuidePDF(decoded, variantImageUrl || undefined));
            if (hasPufa) {
              zip.file("pufa_etykiety.pdf", await generatePufaLabelsPDF(decoded));
              zip.file("przewodnik_produkcja_pufa.pdf", await generatePufaProductionGuidePDF(decoded));
            }
            if (hasFotel) {
              zip.file("fotel_etykiety.pdf", await generateFotelLabelsPDF(decoded));
              zip.file("przewodnik_produkcja_fotel.pdf", await generateFotelProductionGuidePDF(decoded));
            }
            const zipBlob = await zip.generateAsync({ type: "blob" });
            downloadBlob(zipBlob, `zamowienie_${orderNumber}.zip`);
            toast.success("✅ Pobrano kompletny pakiet");
          }} />
          <div className="flex-1" />
          <Button variant="outline" onClick={() => navigate("/")} className="gap-1.5">
            <ArrowLeft className="h-4 w-4" /> Nowe zamówienie
          </Button>
        </CardContent>
      </Card>

      {variantImageUrl && (
        <Dialog open={imagePopupOpen} onOpenChange={setImagePopupOpen}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Zdjęcie wariantu - {orderNumber}</DialogTitle>
            </DialogHeader>
            <div className="mt-4">
              <img
                src={variantImageUrl}
                alt="Wariant sofy"
                className="w-full h-auto rounded"
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex gap-2">
    <span className="font-medium text-muted-foreground min-w-[140px]">{label}:</span>
    <span>{value}</span>
  </div>
);

export default OrderDetailsPage;
