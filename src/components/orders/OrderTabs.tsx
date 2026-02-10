import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShoppingBag, PenLine } from "lucide-react";
import ShopifyOrderForm from "./ShopifyOrderForm";
import OrderForm from "./OrderForm";

const OrderTabs = () => {
  return (
    <Tabs defaultValue="shopify" className="w-full">
      <TabsList className="grid w-full grid-cols-2 mb-6">
        <TabsTrigger value="shopify" className="flex items-center gap-2">
          <ShoppingBag className="h-4 w-4" />
          Zamówienia Shopify
        </TabsTrigger>
        <TabsTrigger value="manual" className="flex items-center gap-2">
          <PenLine className="h-4 w-4" />
          Zamówienia ręczne
        </TabsTrigger>
      </TabsList>

      <TabsContent value="shopify">
        <ShopifyOrderForm />
      </TabsContent>

      <TabsContent value="manual">
        <OrderForm />
      </TabsContent>
    </Tabs>
  );
};

export default OrderTabs;
