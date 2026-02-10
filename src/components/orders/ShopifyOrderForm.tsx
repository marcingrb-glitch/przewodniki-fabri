import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Download, Package, AlertCircle, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ShopifyLineItemsSelector from "./ShopifyLineItemsSelector";
import { fetchShopifyOrder } from "@/utils/fetchShopifyOrder";
import type { ShopifyLineItem } from "@/types/shopifyOrder";

const ShopifyOrderForm = () => {
  const { toast } = useToast();

  const [shopifyOrderNumber, setShopifyOrderNumber] = useState("");
  const [baseOrderNumber, setBaseOrderNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [orderName, setOrderName] = useState<string | null>(null);
  const [lineItems, setLineItems] = useState<ShopifyLineItem[]>([]);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [orderFetched, setOrderFetched] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

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
      toast({
        title: "Błąd",
        description: "Zaznacz co najmniej jedną pozycję",
        variant: "destructive",
      });
      return;
    }

    if (!baseOrderNumber.trim()) {
      toast({
        title: "Błąd",
        description: "Podaj numer wewnętrzny (Base)",
        variant: "destructive",
      });
      return;
    }

    const itemsWithSku = selectedItems.filter((item) => item.sku);
    if (itemsWithSku.length === 0) {
      toast({
        title: "Błąd",
        description: "Żadna z zaznaczonych pozycji nie ma SKU",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    try {
      // TODO: Tu podłączyć istniejący dekoder SKU i generator PDF
      // Dla każdej pozycji z itemsWithSku:
      // 1. Dekoduj SKU
      // 2. Zdjęcie: item.image_url (Shopify) → fallback item.shortcode (Mimeeq) → brak
      // 3. Generuj PDF
      // 4. Zapisz do Supabase

      setLineItems((prev) =>
        prev.map((item) => {
          if (!item.selected || !item.sku) return item;
          return { ...item, decoded: true };
        })
      );

      toast({
        title: "Sukces",
        description: `Wygenerowano przewodnik dla ${itemsWithSku.length} pozycji`,
      });
    } catch (error: any) {
      toast({
        title: "Błąd generowania",
        description: error.message || "Wystąpił błąd",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleReset = () => {
    setShopifyOrderNumber("");
    setBaseOrderNumber("");
    setOrderName(null);
    setLineItems([]);
    setFetchError(null);
    setOrderFetched(false);
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
