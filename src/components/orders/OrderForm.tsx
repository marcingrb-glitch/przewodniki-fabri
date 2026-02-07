import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { CalendarIcon, Search, Loader2 } from "lucide-react";
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
import { toast } from "sonner";
import { parseSKU } from "@/utils/skuParser";
import { validateSKU } from "@/utils/skuValidator";
import { decodeSKU } from "@/utils/skuDecoder";
import { saveOrder } from "@/utils/supabaseQueries";
import { useQueryClient } from "@tanstack/react-query";

const OrderForm = () => {
  const [orderNumber, setOrderNumber] = useState("");
  const [orderDate, setOrderDate] = useState<Date>(new Date());
  const [sku, setSku] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Validate
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

      // 3. Decode
      const decoded = decodeSKU(parsed);
      decoded.orderNumber = orderNumber;
      decoded.orderDate = format(orderDate, "dd.MM.yyyy");
      decoded.rawSKU = sku.trim().toUpperCase();

      // 4. Save to DB
      const saved = await saveOrder({
        order_number: orderNumber,
        order_date: format(orderDate, "yyyy-MM-dd"),
        sku: sku.trim().toUpperCase(),
        series_code: parsed.series,
        decoded_data: decoded,
      });

      toast.success("✅ Zamówienie zdekodowane pomyślnie");
      queryClient.invalidateQueries({ queryKey: ["recent-orders"] });

      // 5. Navigate to details
      navigate(`/order/${saved?.id}`, { state: { decoded } });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Nieznany błąd";
      toast.error(`❌ Błąd: ${message}`);
    } finally {
      setLoading(false);
    }
  };

  const isValid = orderNumber.trim() !== "" && sku.trim() !== "";

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="text-2xl">📝 Nowe zamówienie</CardTitle>
        <CardDescription>
          Wprowadź dane zamówienia i kod SKU produktu do dekodowania
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
                onChange={(e) => setOrderNumber(e.target.value)}
                placeholder="np. 30654114"
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label>Data zamówienia</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !orderDate && "text-muted-foreground"
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
                    onSelect={(date) => date && setOrderDate(date)}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sku">SKU produktu</Label>
            <Textarea
              id="sku"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              placeholder="np. S1-T3D-SD2NA-B8C-OP62A-SK15-AT1-N5A-P1-J1-W1-PF"
              rows={3}
              required
              disabled={loading}
            />
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
