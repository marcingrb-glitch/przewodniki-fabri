import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Download, Package, AlertCircle, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { toast as sonnerToast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import ShopifyLineItemsSelector from "./ShopifyLineItemsSelector";
import { fetchShopifyOrder } from "@/utils/fetchShopifyOrder";
import { parseSKU } from "@/utils/skuParser";
import { validateSKU } from "@/utils/skuValidator";
import { decodeSKU } from "@/utils/skuDecoder";
import { validateFinishesFromDB } from "@/utils/finishValidator";
import { saveOrder } from "@/utils/supabaseQueries";
import type { ShopifyLineItem } from "@/types/shopifyOrder";

const ShopifyOrderForm = () => {
  const { toast } = useToast();

  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, isAdmin } = useAuth();

  const [shopifyOrderNumber, setShopifyOrderNumber] = useState("");
  const [baseOrderNumber, setBaseOrderNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [orderName, setOrderName] = useState<string | null>(null);
  const [lineItems, setLineItems] = useState<ShopifyLineItem[]>([]);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [orderFetched, setOrderFetched] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [fabricChange, setFabricChange] = useState(false);
  const [fabricName, setFabricName] = useState("");
  const [fabricColor, setFabricColor] = useState("");
  const handleFetchOrder = async () => {
    if (!shopifyOrderNumber.trim()) {
      toast({
        title: "Błąd",
        description: "Podaj numer zamówienia Shopify",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setFetchError(null);
    setOrderFetched(false);
    setLineItems([]);
    setOrderName(null);

    const result = await fetchShopifyOrder(shopifyOrderNumber);

    if (result.success) {
      setOrderName(result.orderName);
      setLineItems(result.lineItems);
      setOrderFetched(true);

      if (result.lineItems.length === 0) {
        setFetchError("Zamówienie nie zawiera żadnych pozycji");
      } else {
        toast({
          title: "Pobrano zamówienie",
          description: `${result.orderName}: ${result.lineItems.length} pozycji`,
        });
      }
    } else {
      setFetchError(result.error || "Nie udało się pobrać zamówienia");
      toast({
        title: "Błąd",
        description: result.error,
        variant: "destructive",
      });
    }

    setIsLoading(false);
  };

  const handleToggleItem = (lineItemId: number) => {
    setLineItems((prev) =>
      prev.map((item) =>
        item.line_item_id === lineItemId ? { ...item, selected: !item.selected } : item
      )
    );
  };

  const handleToggleAll = (selected: boolean) => {
    setLineItems((prev) => prev.map((item) => ({ ...item, selected })));
  };

  const handleGenerate = async () => {
    const selectedItems = lineItems.filter((item) => item.selected);

    if (selectedItems.length === 0) {
      toast({ title: "Błąd", description: "Zaznacz co najmniej jedną pozycję", variant: "destructive" });
      return;
    }

    if (!baseOrderNumber.trim()) {
      toast({ title: "Błąd", description: "Podaj numer wewnętrzny (Base)", variant: "destructive" });
      return;
    }

    if (fabricChange && (!fabricName.trim() || !fabricColor.trim())) {
      toast({ title: "Błąd", description: "Wypełnij nazwę tkaniny i kolor", variant: "destructive" });
      return;
    }

    const itemsWithSku = selectedItems.filter((item) => item.sku);
    if (itemsWithSku.length === 0) {
      toast({ title: "Błąd", description: "Żadna z zaznaczonych pozycji nie ma SKU", variant: "destructive" });
      return;
    }

    setIsGenerating(true);
    const results: { item: ShopifyLineItem; orderId?: string; error?: string }[] = [];

    for (const item of itemsWithSku) {
      const itemOrderNumber = itemsWithSku.length === 1
        ? baseOrderNumber.trim()
        : `${baseOrderNumber.trim()}-${item.line_item_id}`;

      try {
        // Normalize SKU: trim, uppercase, collapse whitespace
        const normalizedSku = item.sku.trim().replace(/\s+/g, "-").toUpperCase();
        console.log("[ShopifyFlow] Original SKU:", JSON.stringify(item.sku), "Normalized:", JSON.stringify(normalizedSku));

        // 1. Validate SKU
        const validation = validateSKU(normalizedSku);
        console.log("[ShopifyFlow] Validation result:", validation);
        if (!validation.valid) {
          const errMsg = validation.errors.join("; ");
          results.push({ item, error: errMsg });
          setLineItems((prev) =>
            prev.map((li) => li.line_item_id === item.line_item_id ? { ...li, decoded: false, decode_error: errMsg } : li)
          );
          continue;
        }
        if (validation.warnings.length > 0) {
          validation.warnings.forEach((w) => sonnerToast.warning(`⚠️ ${item.title}: ${w}`));
        }

        // 2. Parse
        const parsed = parseSKU(normalizedSku);
        console.log("[ShopifyFlow] Parsed SKU:", parsed);

        // 3. Validate finishes against DB
        try {
          const finishResult = await validateFinishesFromDB(parsed);
          if (finishResult.errors.length > 0) {
            const errMsg = finishResult.errors.map((e) =>
              e.finish
                ? `${e.component} ${e.code}: wykończenie ${e.finish} niedozwolone (${e.allowed.join(", ")})`
                : `${e.component} ${e.code}: brak wymaganego wykończenia (${e.allowed.join(", ")})`
            ).join("; ");
            results.push({ item, error: errMsg });
            setLineItems((prev) =>
              prev.map((li) => li.line_item_id === item.line_item_id ? { ...li, decoded: false, decode_error: errMsg } : li)
            );
            continue;
          }
          if (finishResult.defaults.seat && !parsed.seat.finish) parsed.seat.finish = finishResult.defaults.seat;
          if (finishResult.defaults.side && !parsed.side.finish) parsed.side.finish = finishResult.defaults.side;
          if (finishResult.defaults.backrest && !parsed.backrest.finish) parsed.backrest.finish = finishResult.defaults.backrest;
        } catch { /* non-blocking */ }

        // 4. Decode
        const decoded = decodeSKU(parsed);
        decoded.orderNumber = itemOrderNumber;
        decoded.orderDate = format(new Date(), "dd.MM.yyyy");
        decoded.rawSKU = normalizedSku;

        // 4b. Apply fabric override
        let finalSku = normalizedSku;
        if (fabricChange && fabricName.trim() && fabricColor.trim()) {
          const overrideName = fabricName.trim().toUpperCase().replace(/\s+/g, "_");
          const overrideColor = fabricColor.trim().toUpperCase().replace(/\s+/g, "_");
          // Replace fabric segment in SKU (T... segment between first and second dash after series)
          finalSku = normalizedSku.replace(/-[A-Z]\d+[A-Z0-9]*-/, `-${overrideName}_${overrideColor}-`);
          decoded.fabric = {
            ...decoded.fabric,
            code: overrideName,
            name: fabricName.trim(),
            color: overrideColor,
            colorName: fabricColor.trim(),
          };
          decoded.fabricOverride = { name: fabricName.trim(), color: fabricColor.trim() };
          decoded.rawSKU = finalSku;
        }

        // 5. Determine image: Shopify image_url → Mimeeq shortcode fallback
        const variantImageUrl = item.image_url || undefined;
        const mimeeqShortcode = item.shortcode || undefined;

        // 6. Save to DB
        const saved = await saveOrder({
          order_number: itemOrderNumber,
          order_date: format(new Date(), "yyyy-MM-dd"),
          sku: finalSku,
          series_code: parsed.series,
          decoded_data: decoded,
          created_by: user?.id,
          visible_to_workers: false,
          variant_image_url: variantImageUrl,
          mimeeq_shortcode: mimeeqShortcode,
          shopify_order_name: orderName || undefined,
        });

        results.push({ item, orderId: saved?.id });
        setLineItems((prev) =>
          prev.map((li) => li.line_item_id === item.line_item_id ? { ...li, decoded: true, decode_error: undefined } : li)
        );
      } catch (error: any) {
        const errMsg = error.message || "Nieznany błąd";
        results.push({ item, error: errMsg });
        setLineItems((prev) =>
          prev.map((li) => li.line_item_id === item.line_item_id ? { ...li, decoded: false, decode_error: errMsg } : li)
        );
      }
    }

    const successCount = results.filter((r) => r.orderId).length;
    const errorCount = results.filter((r) => r.error).length;

    if (successCount > 0) {
      queryClient.invalidateQueries({ queryKey: ["recent-orders"] });
      sonnerToast.success(`Zapisano ${successCount} zamówień${orderName ? ` (${orderName})` : ""}`, {
        description: errorCount > 0 ? `${errorCount} pozycji z błędami` : undefined,
      });

      // Navigate to first successful order
      const firstSuccess = results.find((r) => r.orderId);
      if (firstSuccess?.orderId) {
        navigate(`/order/${firstSuccess.orderId}`);
      }
    } else {
      sonnerToast.error("Nie udało się zdekodować żadnej pozycji");
    }

    setIsGenerating(false);
  };

  const handleReset = () => {
    setShopifyOrderNumber("");
    setBaseOrderNumber("");
    setOrderName(null);
    setLineItems([]);
    setFetchError(null);
    setOrderFetched(false);
    setFabricChange(false);
    setFabricName("");
    setFabricColor("");
  };

  const selectedWithSku = lineItems.filter((item) => item.selected && item.sku).length;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Package className="h-5 w-5" />
            Zamówienie Shopify
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="shopify-order">Numer zamówienia Shopify</Label>
              <div className="flex gap-2">
                <Input
                  id="shopify-order"
                  placeholder="np. 1001 lub #1001"
                  value={shopifyOrderNumber}
                  onChange={(e) => setShopifyOrderNumber(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleFetchOrder()}
                  disabled={isLoading}
                />
                <Button onClick={handleFetchOrder} disabled={isLoading} className="shrink-0">
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Pobieranie...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4" />
                      Pobierz
                    </>
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="base-order">Numer wewnętrzny (Base)</Label>
              <Input
                id="base-order"
                placeholder="np. ZAM-2024-001"
                value={baseOrderNumber}
                onChange={(e) => setBaseOrderNumber(e.target.value)}
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="fabric-change"
                  checked={fabricChange}
                  onCheckedChange={(checked) => setFabricChange(checked === true)}
                />
                <Label htmlFor="fabric-change" className="cursor-pointer">Zmiana tkaniny</Label>
              </div>
              {fabricChange && (
                <div className="grid grid-cols-2 gap-3 pl-6">
                  <div className="space-y-1">
                    <Label htmlFor="fabric-name">Nazwa tkaniny *</Label>
                    <Input
                      id="fabric-name"
                      placeholder="np. Seattle"
                      value={fabricName}
                      onChange={(e) => setFabricName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="fabric-color">Kolor *</Label>
                    <Input
                      id="fabric-color"
                      placeholder="np. Green"
                      value={fabricColor}
                      onChange={(e) => setFabricColor(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {orderFetched && orderName && (
            <Alert className="mt-4">
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                Pobrano zamówienie {orderName} — {lineItems.length} pozycji
              </AlertDescription>
            </Alert>
          )}

          {fetchError && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{fetchError}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {orderFetched && lineItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Pozycje zamówienia</CardTitle>
          </CardHeader>
          <CardContent>
            <ShopifyLineItemsSelector
              lineItems={lineItems}
              onToggleItem={handleToggleItem}
              onToggleAll={handleToggleAll}
            />

            <div className="mt-4 pt-4 border-t">
              <p className="text-sm text-muted-foreground mb-3">
                {selectedWithSku > 0
                  ? `${selectedWithSku} pozycji z SKU gotowych do dekodowania`
                  : "Brak zaznaczonych pozycji z SKU"}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleReset}>
                  Wyczyść
                </Button>
                <Button onClick={handleGenerate} disabled={isGenerating || selectedWithSku === 0}>
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Generowanie...
                    </>
                  ) : (
                    "Generuj przewodnik →"
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ShopifyOrderForm;
