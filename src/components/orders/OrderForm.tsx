import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { CalendarIcon, Search, Loader2, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import { parseSKU } from "@/utils/skuParser";
import { validateSKU } from "@/utils/skuValidator";
import { decodeSKU } from "@/utils/skuDecoder";
import { validateFinishesFromDB } from "@/utils/finishValidator";
import { saveOrder, checkOrderNumberExists } from "@/utils/supabaseQueries";
import { useQueryClient } from "@tanstack/react-query";

const OrderForm = () => {
  const [orderNumber, setOrderNumber] = useState("");
  const [orderDate, setOrderDate] = useState<Date>(new Date());
  const [sku, setSku] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const validateForm = async (): Promise<boolean> => {
    const newErrors: Record<string, string> = {};

    // Order number
    const trimmedOrder = orderNumber.trim();
    if (!trimmedOrder) {
      newErrors.orderNumber = "Numer zamówienia jest wymagany";
    } else if (trimmedOrder.length < 3) {
      newErrors.orderNumber = "Numer zamówienia musi mieć min. 3 znaki";
    } else if (!/^[a-zA-Z0-9]+$/.test(trimmedOrder)) {
      newErrors.orderNumber = "Tylko litery i cyfry";
    } else {
      try {
        const exists = await checkOrderNumberExists(trimmedOrder);
        if (exists) newErrors.orderNumber = "Ten numer zamówienia już istnieje";
      } catch { /* non-blocking */ }
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
        validation.errors.forEach((err) => toast.error(`❌ ${err}`));
        setLoading(false);
        return;
      }
      if (validation.warnings.length > 0) {
        validation.warnings.forEach((w) => toast.warning(`⚠️ ${w}`));
      }

      // 2. Parse
      const parsed = parseSKU(sku);

      // 3. Validate finishes against DB
      try {
        const finishResult = await validateFinishesFromDB(parsed);
        if (finishResult.errors.length > 0) {
          finishResult.errors.forEach((e) => {
            if (e.finish) {
              toast.error(`❌ ${e.component} ${e.code} ma wykończenie ${e.finish}, ale dozwolone są: ${e.allowed.join(', ')}`);
            } else {
              toast.error(`❌ ${e.component} ${e.code} wymaga wykończenia. Możliwe: ${e.allowed.join(', ')}`);
            }
          });
          setLoading(false);
          return;
        }
        finishResult.warnings.forEach((w) =>
          toast.warning(`⚠️ ${w.component} ${w.code} ma wykończenie ${w.finish}, ale dozwolone są: ${w.allowed.join(', ')}`)
        );
        if (finishResult.defaults.seat && !parsed.seat.finish) parsed.seat.finish = finishResult.defaults.seat;
        if (finishResult.defaults.side && !parsed.side.finish) parsed.side.finish = finishResult.defaults.side;
        if (finishResult.defaults.backrest && !parsed.backrest.finish) parsed.backrest.finish = finishResult.defaults.backrest;
      } catch { /* non-blocking */ }

      // 4. Decode
      const decoded = decodeSKU(parsed);
      decoded.orderNumber = orderNumber;
      decoded.orderDate = format(orderDate, "dd.MM.yyyy");
      decoded.rawSKU = sku.trim().toUpperCase();

      // 5. Save to DB
      const saved = await saveOrder({
        order_number: orderNumber,
        order_date: format(orderDate, "yyyy-MM-dd"),
        sku: sku.trim().toUpperCase(),
        series_code: parsed.series,
        decoded_data: decoded,
      });

      toast.success("Zamówienie zdekodowane pomyślnie", {
        description: `#${orderNumber} - ${format(orderDate, "dd.MM.yyyy")}`,
      });
      queryClient.invalidateQueries({ queryKey: ["recent-orders"] });

      // 6. Navigate to details
      navigate(`/order/${saved?.id}`, { state: { decoded } });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Nieznany błąd";
      toast.error("Nie można zapisać zamówienia", {
        description: message,
      });
    } finally {
      setLoading(false);
    }
  };

  const isValid = orderNumber.trim() !== "" && sku.trim() !== "";

  const clearError = (field: string) => {
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  return (
    <Card className="shadow-md">
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
              <Input
                id="orderNumber"
                value={orderNumber}
                onChange={(e) => { setOrderNumber(e.target.value); clearError("orderNumber"); }}
                placeholder="np. 30654114"
                required
                disabled={loading}
                className={errors.orderNumber ? "border-destructive" : ""}
              />
              {errors.orderNumber && (
                <p className="text-xs text-destructive">{errors.orderNumber}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Data zamówienia</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !orderDate && "text-muted-foreground",
                      errors.orderDate && "border-destructive"
                    )}
                    disabled={loading}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {orderDate ? format(orderDate, "dd.MM.yyyy") : "Wybierz datę"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={orderDate}
                    onSelect={(date) => { if (date) { setOrderDate(date); clearError("orderDate"); } }}
                    disabled={(date) => date > new Date()}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
              {errors.orderDate && (
                <p className="text-xs text-destructive">{errors.orderDate}</p>
              )}
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
            <Textarea
              id="sku"
              value={sku}
              onChange={(e) => { setSku(e.target.value); clearError("sku"); }}
              placeholder="np. S1-T3D-SD2NA-B8C-OP62A-SK15-AT1-N5A-P1-J1-W1-PF"
              rows={3}
              required
              disabled={loading}
              className={errors.sku ? "border-destructive" : ""}
            />
            {errors.sku && (
              <p className="text-xs text-destructive">{errors.sku}</p>
            )}
          </div>

          <Button
            type="submit"
            size="lg"
            className="w-full text-base"
            disabled={!isValid || loading}
          >
            {loading ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <Search className="mr-2 h-5 w-5" />
            )}
            {loading ? "Dekodowanie..." : "Dekoduj i Generuj"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default OrderForm;
