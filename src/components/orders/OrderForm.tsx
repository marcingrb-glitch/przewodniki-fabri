import { useState } from "react";
import { format } from "date-fns";
import { CalendarIcon, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const OrderForm = () => {
  const [orderNumber, setOrderNumber] = useState("");
  const [orderDate, setOrderDate] = useState<Date>(new Date());
  const [sku, setSku] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Etap 2 - dekodowanie SKU
    console.log("Submit:", { orderNumber, orderDate, sku });
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
              placeholder="np. S1-T3D-SD2NA-B8C-OP62A-SK15-AT1-N5A-PF"
              rows={3}
              required
            />
          </div>

          <Button
            type="submit"
            size="lg"
            className="w-full text-base"
            disabled={!isValid}
          >
            <Search className="mr-2 h-5 w-5" />
            Dekoduj i Generuj
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default OrderForm;
