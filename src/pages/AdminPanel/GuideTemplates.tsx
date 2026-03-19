import { useState, useMemo } from "react";
import WarehouseGuidePdfPreview from "./guides/WarehouseGuidePdfPreview";
import { useSkuPreviewDecoder } from "@/hooks/useSkuPreviewDecoder";
import { DEFAULT_EXAMPLE_SKUS, FALLBACK_EXAMPLE_SKU } from "./labels/defaultExampleSkus";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";

export default function GuideTemplates() {
  const defaultSku = FALLBACK_EXAMPLE_SKU;
  const { decoded, isLoading: isDecoding, error: decodeError, skuInput, setSkuInput } = useSkuPreviewDecoder(defaultSku);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">📦 Przewodnik Magazyn</h1>

      <Alert>
        <AlertDescription>
          Layout przewodnika jest stały (hardcoded). Zmiany layoutu — brief do Claude + deploy.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Podgląd (sofa + pufa + fotel)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2 items-center">
            <Label className="text-xs whitespace-nowrap">SKU:</Label>
            <Input
              value={skuInput}
              onChange={(e) => setSkuInput(e.target.value)}
              className="h-8 text-xs font-mono"
              placeholder="Wpisz SKU do podglądu..."
            />
            {isDecoding && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          </div>
          {decodeError && (
            <p className="text-xs text-destructive">{decodeError}</p>
          )}
          <WarehouseGuidePdfPreview decoded={decoded} width={550} />
        </CardContent>
      </Card>
    </div>
  );
}
