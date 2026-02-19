import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import type { ShopifyLineItem } from "@/types/shopifyOrder";

interface ShopifyLineItemsSelectorProps {
  lineItems: ShopifyLineItem[];
  onToggleItem: (lineItemId: number) => void;
  onToggleAll: (selected: boolean) => void;
}

const ShopifyLineItemsSelector = ({
  lineItems,
  onToggleItem,
  onToggleAll,
}: ShopifyLineItemsSelectorProps) => {
  const allSelected = lineItems.every((item) => item.selected);
  const selectedCount = lineItems.filter((item) => item.selected).length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between pb-2 border-b">
        <div className="flex items-center gap-2">
          <Checkbox
            checked={allSelected}
            onCheckedChange={(checked) => onToggleAll(!!checked)}
            id="select-all"
          />
          <label htmlFor="select-all" className="text-sm font-medium cursor-pointer">
            {allSelected ? "Odznacz wszystkie" : "Zaznacz wszystkie"}
          </label>
        </div>
        <span className="text-sm text-muted-foreground">
          {selectedCount} z {lineItems.length} zaznaczonych
        </span>
      </div>

      {lineItems.map((item) => {
        const hasProperties = Object.keys(item.properties).length > 0;

        return (
          <div
            key={item.line_item_id}
            className={`rounded-lg border p-3 transition-colors ${
              item.selected ? "bg-accent/30 border-primary/30" : "bg-background"
            }`}
          >
            <div
              className="flex items-start gap-3 cursor-pointer"
              onClick={() => onToggleItem(item.line_item_id)}
            >
              <Checkbox
                checked={item.selected}
                onCheckedChange={() => onToggleItem(item.line_item_id)}
                onClick={(e) => e.stopPropagation()}
              />

              <div className="w-12 h-12 rounded overflow-hidden flex-shrink-0">
                {item.image_url ? (
                  <img
                    src={item.image_url}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center text-xs text-muted-foreground">
                    Brak
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium text-sm truncate">{item.title}</p>
                  {item.quantity > 1 && (
                    <Badge variant="secondary" className="text-xs">
                      x{item.quantity}
                    </Badge>
                  )}
                  {item.is_mmq_product && (
                    <Badge className="text-xs bg-primary/10 text-primary border-primary/20">
                      Mimeeq
                    </Badge>
                  )}
                </div>

                {item.variant_title && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {item.variant_title}
                  </p>
                )}

                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  {item.sku ? (
                    <div className="flex items-center gap-1">
                      <Badge variant="outline" className="text-xs font-mono">
                        {item.sku}
                      </Badge>
                      {item.sku_source === "mimeeq" && (
                        <Badge className="text-xs bg-blue-100 text-blue-700 border-blue-200">
                          z Mimeeq
                        </Badge>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground italic">Brak SKU</span>
                  )}

                  {item.shortcode && (
                    <Badge variant="outline" className="text-xs">
                      SC: {item.shortcode}
                    </Badge>
                  )}
                </div>
              </div>

              <div className="flex flex-col items-end gap-1">
                {item.decoded && (
                  <Badge variant="secondary" className="text-xs">
                    Zdekodowany
                  </Badge>
                )}
                {item.decode_error && (
                  <Badge variant="destructive" className="text-xs">
                    Nierozpoznany
                  </Badge>
                )}
              </div>
            </div>

            {hasProperties && (
              <Collapsible>
                <CollapsibleTrigger
                  className="flex items-center gap-1 text-xs text-muted-foreground mt-2 ml-7 hover:text-foreground transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ChevronDown className="h-3 w-3" />
                  Szczegóły konfiguracji ({Object.keys(item.properties).length})
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="mt-2 ml-7 p-2 bg-muted/50 rounded text-xs">
                    <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
                      {Object.entries(item.properties).map(([key, value]) => (
                        <div key={key} className="contents">
                          <span className="font-medium text-muted-foreground">{key}:</span>
                          <span>{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ShopifyLineItemsSelector;
