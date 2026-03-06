import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { CalendarIcon, Search, Loader2, HelpCircle, Info, ImageIcon, X, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { parseSKU } from "@/utils/skuParser";
import { validateSKU } from "@/utils/skuValidator";
import { decodeSKU, fetchSideExceptions } from "@/utils/skuDecoder";
import { validateFinishesFromDB } from "@/utils/finishValidator";
import { saveOrder, checkOrderNumberExists } from "@/utils/supabaseQueries";
import { uploadVariantImage } from "@/utils/variantImageUpload";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
const OrderForm = () => {
  const [orderNumber, setOrderNumber] = useState("");
  const [shopifyOrderName, setShopifyOrderName] = useState("");
  const [orderDate, setOrderDate] = useState<Date>(new Date());
  const [sku, setSku] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const {
    user,
    isAdmin
  } = useAuth();
  const [visibleToWorkers, setVisibleToWorkers] = useState(true);
  const [variantImage, setVariantImage] = useState<File | null>(null);
  const [variantImagePreview, setVariantImagePreview] = useState<string | null>(null);
  const [shortcode, setShortcode] = useState("");
  const [autoImageUrl, setAutoImageUrl] = useState<string | null>(null);
  const [autoImageLoading, setAutoImageLoading] = useState(false);
  const [fabricChange, setFabricChange] = useState(false);
  const [fabricName, setFabricName] = useState("");
  const [fabricColor, setFabricColor] = useState("");
  const fetchShopifyImage = async () => {
    const code = shortcode.trim().toUpperCase();
    if (!code) {
      toast.error("Podaj shortcode Mimeeq");
      return;
    }
    setAutoImageLoading(true);
    try {
      const {
        data: {
          session
        }
      } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Not authenticated");
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-variant-image`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          shortcode: code
        })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({
          error: "Błąd pobierania"
        }));
        throw new Error(err.error || "Błąd pobierania zdjęcia");
      }
      const data = await res.json();
      if (data.image_url) {
        setAutoImageUrl(data.image_url);
        // Only set preview if no manual upload
        if (!variantImage) {
          setVariantImagePreview(data.image_url);
        }
        toast.success("Pobrano zdjęcie z Shopify");
      } else {
        toast.warning("Nie znaleziono zdjęcia dla tego shortcode");
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Błąd pobierania zdjęcia");
    } finally {
      setAutoImageLoading(false);
    }
  };
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Dozwolone formaty: JPG, PNG, WebP");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Plik jest za duży. Maksymalnie 5MB.");
      return;
    }
    setVariantImage(file);
    const reader = new FileReader();
    reader.onloadend = () => setVariantImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };
  const clearImage = () => {
    setVariantImage(null);
    setVariantImagePreview(null);
  };
  const validateForm = async (): Promise<boolean> => {
    const newErrors: Record<string, string> = {};

    // Order number
    const trimmedOrder = orderNumber.trim();
    if (!trimmedOrder) {
      newErrors.orderNumber = "Numer zamówienia jest wymagany";
    } else {
      try {
        const exists = await checkOrderNumberExists(trimmedOrder);
        if (exists) newErrors.orderNumber = "Ten numer zamówienia już istnieje";
      } catch {/* non-blocking */}
    }

    // Date
    if (!orderDate) {
      newErrors.orderDate = "Data zamówienia jest wymagana";
    } else if (orderDate > new Date()) {
      newErrors.orderDate = "Data nie może być z przyszłości";
    }

    // SKU
    const trimmedSku = sku.trim();
    if (!trimmedSku) {
      newErrors.sku = "SKU produktu jest wymagany";
    } else if (trimmedSku.length < 10) {
      newErrors.sku = "SKU musi mieć min. 10 znaków";
    }
    // Fabric change validation
    if (fabricChange && (!fabricName.trim() || !fabricColor.trim())) {
      newErrors.fabric = "Wypełnij nazwę tkaniny i kolor";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formValid = await validateForm();
      if (!formValid) {
        setLoading(false);
        return;
      }

      // 1. Basic validation
      const validation = validateSKU(sku);
      if (!validation.valid) {
        validation.errors.forEach(err => toast.error(`❌ ${err}`));
        setLoading(false);
        return;
      }
      if (validation.warnings.length > 0) {
        validation.warnings.forEach(w => toast.warning(`⚠️ ${w}`));
      }

      // 2. Parse (with DB-sourced side exceptions)
      const seriesCode = sku.trim().toUpperCase().split("-")[0] || "";
      const sideExceptions = await fetchSideExceptions(seriesCode);
      const parsed = parseSKU(sku, sideExceptions);

      // 3. Validate finishes against DB
      try {
        const finishResult = await validateFinishesFromDB(parsed);
        if (finishResult.errors.length > 0) {
          finishResult.errors.forEach(e => {
            if (e.finish) {
              toast.error(`❌ ${e.component} ${e.code} ma wykończenie ${e.finish}, ale dozwolone są: ${e.allowed.join(', ')}`);
            } else {
              toast.error(`❌ ${e.component} ${e.code} wymaga wykończenia. Możliwe: ${e.allowed.join(', ')}`);
            }
          });
          setLoading(false);
          return;
        }
        finishResult.warnings.forEach(w => toast.warning(`⚠️ ${w.component} ${w.code} ma wykończenie ${w.finish}, ale dozwolone są: ${w.allowed.join(', ')}`));
        if (finishResult.defaults.seat && !parsed.seat.finish) parsed.seat.finish = finishResult.defaults.seat;
        if (finishResult.defaults.side && !parsed.side.finish) parsed.side.finish = finishResult.defaults.side;
        if (finishResult.defaults.backrest && !parsed.backrest.finish) parsed.backrest.finish = finishResult.defaults.backrest;
      } catch {/* non-blocking */}

      // 4. Decode
      const decoded = await decodeSKU(parsed);
      decoded.orderNumber = orderNumber;
      decoded.orderDate = format(orderDate, "dd.MM.yyyy");
      let finalSku = sku.trim().toUpperCase();
      decoded.rawSKU = finalSku;

      // 4b. Apply fabric override
      if (fabricChange && fabricName.trim() && fabricColor.trim()) {
        const overrideName = fabricName.trim().toUpperCase().replace(/\s+/g, "_");
        const overrideColor = fabricColor.trim().toUpperCase().replace(/\s+/g, "_");
        finalSku = finalSku.replace(/-[A-Z]\d+[A-Z0-9]*-/, `-${overrideName}_${overrideColor}-`);
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

      // 5. Save to DB
      const saved = await saveOrder({
        order_number: orderNumber,
        order_date: format(orderDate, "yyyy-MM-dd"),
        sku: finalSku,
        series_code: parsed.series,
        decoded_data: decoded,
        created_by: user?.id,
        visible_to_workers: isAdmin ? visibleToWorkers : false,
        variant_image_url: !variantImage && autoImageUrl ? autoImageUrl : undefined,
        mimeeq_shortcode: shortcode.trim().toUpperCase() || undefined,
        shopify_order_name: shopifyOrderName.trim() || undefined
      });

      // 6. Upload variant image if provided (manual upload takes priority)
      if (variantImage && saved?.id) {
        try {
          await uploadVariantImage(saved.id, orderNumber, variantImage);
        } catch {
          toast.warning("⚠️ Zdjęcie wariantu nie zostało przesłane");
        }
      }
      toast.success("Zamówienie zdekodowane pomyślnie", {
        description: `#${orderNumber} - ${format(orderDate, "dd.MM.yyyy")}`
      });
      queryClient.invalidateQueries({
        queryKey: ["recent-orders"]
      });
      queryClient.invalidateQueries({
        queryKey: ["order", saved?.id]
      });

      // 7. Navigate to details
      navigate(`/order/${saved?.id}`, {
        state: {
          decoded
        }
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Nieznany błąd";
      toast.error("Nie można zapisać zamówienia", {
        description: message
      });
    } finally {
      setLoading(false);
    }
  };
  const isValid = orderNumber.trim() !== "" && sku.trim() !== "";
  const clearError = (field: string) => {
    if (errors[field]) {
      setErrors(prev => {
        const next = {
          ...prev
        };
        delete next[field];
        return next;
      });
    }
  };
  return <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="text-2xl">📝 Nowe zamówienie</CardTitle>
        <CardDescription>
          Wprowadź dane zamówienia i kod SKU produktu do dekodowania
          <span className="ml-2 text-xs text-muted-foreground">
            <kbd className="px-1.5 py-0.5 rounded border bg-muted text-[10px]">Ctrl+N</kbd> skrót
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="orderNumber">Numer zamówienia</Label>
              <Input id="orderNumber" value={orderNumber} onChange={e => {
              setOrderNumber(e.target.value);
              clearError("orderNumber");
            }} placeholder="np. 30654114" required disabled={loading} className={errors.orderNumber ? "border-destructive" : ""} />
              {errors.orderNumber && <p className="text-xs text-destructive">{errors.orderNumber}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="shopifyOrderName">Numer Shopify (opcjonalne)</Label>
              <Input id="shopifyOrderName" value={shopifyOrderName} onChange={e => setShopifyOrderName(e.target.value)} placeholder="np. #1251" disabled={loading} />
            </div>

            <div className="space-y-2">
              <Label>Data zamówienia</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !orderDate && "text-muted-foreground", errors.orderDate && "border-destructive")} disabled={loading}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {orderDate ? format(orderDate, "dd.MM.yyyy") : "Wybierz datę"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={orderDate} onSelect={date => {
                  if (date) {
                    setOrderDate(date);
                    clearError("orderDate");
                  }
                }} disabled={date => date > new Date()} initialFocus className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
              {errors.orderDate && <p className="text-xs text-destructive">{errors.orderDate}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="sku">SKU produktu</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-xs text-xs">
                    <p className="font-semibold mb-1">Format SKU:</p>
                    <p>S1-T3D-SD02N-B1A-OP62A-SK15-AT1-N1A-P1-J1-W1-PF</p>
                    <p className="mt-1 text-muted-foreground">Każda część jest oddzielona myślnikiem. Kolejność: seria, tkanina, siedzisko, boczek, oparcie, skrzynia, automat, nóżki, poduszka, jaśki, wałek, dodatki.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Textarea id="sku" value={sku} onChange={e => {
            setSku(e.target.value);
            clearError("sku");
          }} placeholder="np. S1-T3D-SD2NA-B8C-OP62A-SK15-AT1-N5A-P1-J1-W1-PF" rows={3} required disabled={loading} className={errors.sku ? "border-destructive" : ""} />
            {errors.sku && <p className="text-xs text-destructive">{errors.sku}</p>}
          </div>

          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="fabric-change-manual"
                checked={fabricChange}
                onCheckedChange={(checked) => setFabricChange(checked === true)}
                disabled={loading}
              />
              <Label htmlFor="fabric-change-manual" className="cursor-pointer">Zmiana tkaniny (opcjonalne)</Label>
            </div>
            {fabricChange && (
              <div className="grid grid-cols-2 gap-3 pl-6">
                <div className="space-y-1">
                  <Label htmlFor="fabric-name-manual">Nazwa tkaniny *</Label>
                  <Input
                    id="fabric-name-manual"
                    placeholder="np. Seattle"
                    value={fabricName}
                    onChange={(e) => setFabricName(e.target.value)}
                    disabled={loading}
                    className={errors.fabric ? "border-destructive" : ""}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="fabric-color-manual">Kolor *</Label>
                  <Input
                    id="fabric-color-manual"
                    placeholder="np. Green"
                    value={fabricColor}
                    onChange={(e) => setFabricColor(e.target.value)}
                    disabled={loading}
                    className={errors.fabric ? "border-destructive" : ""}
                  />
                </div>
              </div>
            )}
            {errors.fabric && <p className="text-xs text-destructive pl-6">{errors.fabric}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="shortcode">Shortcode Mimeeq (opcjonalne)</Label>
            <p className="text-xs text-muted-foreground">Shortcode z koszyka klienta w Mimeeq</p>
            <div className="flex gap-2">
              <Input id="shortcode" value={shortcode} onChange={e => setShortcode(e.target.value.toUpperCase())} placeholder="np. FHGTD58" disabled={loading || autoImageLoading} className="flex-1" />
              <Button type="button" variant="outline" onClick={fetchShopifyImage} disabled={loading || autoImageLoading || !shortcode.trim()}>
                {autoImageLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                Pobierz zdjęcie
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="variant-image">Zdjęcie wariantu sofy (opcjonalne)</Label>
            <Input id="variant-image" type="file" accept="image/jpeg,image/jpg,image/png,image/webp" onChange={handleImageUpload} disabled={loading} />
            {variantImagePreview && <div className="relative mt-2 inline-block">
                <img src={variantImagePreview} alt="Podgląd wariantu" className="max-w-xs max-h-40 rounded border object-cover" />
                <button type="button" onClick={() => {
              clearImage();
              if (!variantImage && autoImageUrl) setVariantImagePreview(null);
            }} className="absolute -top-2 -right-2 rounded-full bg-destructive text-destructive-foreground p-0.5">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>}
          </div>

          {isAdmin && <div className="flex items-start gap-3 rounded-lg border border-primary/20 bg-primary/5 p-4">
              <Checkbox id="visibleToWorkers" checked={visibleToWorkers} onCheckedChange={checked => setVisibleToWorkers(checked as boolean)} disabled={loading} />
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Label htmlFor="visibleToWorkers" className="text-sm font-medium leading-none cursor-pointer">
                    Widoczne dla pracowników
                  </Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent side="right" className="max-w-xs text-xs">
                        <p>Jeśli zaznaczone, wszyscy pracownicy będą mogli zobaczyć to zamówienie.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <p className="text-xs text-muted-foreground">Pracownicy zobaczą to zamówienie w historii</p>
              </div>
            </div>}

          <Button type="submit" size="lg" className="w-full text-base" disabled={!isValid || loading}>
            {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Search className="mr-2 h-5 w-5" />}
            {loading ? "Dekodowanie..." : "Dekoduj i Generuj"}
          </Button>
        </form>
      </CardContent>
    </Card>;
};
export default OrderForm;