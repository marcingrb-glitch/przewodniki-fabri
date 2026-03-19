import { useState } from "react";
import ProductionGuidePdfPreview from "./guides/ProductionGuidePdfPreview";
import { useSkuPreviewDecoder } from "@/hooks/useSkuPreviewDecoder";
import { FALLBACK_EXAMPLE_SKU } from "./labels/defaultExampleSkus";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";

export default function DecodingTemplates() {
  const [activeTab, setActiveTab] = useState("sofa");
  const { decoded, isLoading: isDecoding, error: decodeError, skuInput, setSkuInput } = useSkuPreviewDecoder(FALLBACK_EXAMPLE_SKU);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">🔧 Przewodnik Produkcja</h1>

      <Alert>
        <AlertDescription>
          Layout przewodnika jest stały (hardcoded). Zmiany layoutu — brief do Claude + deploy.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Podgląd</CardTitle>
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

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="sofa">SOFA</TabsTrigger>
              <TabsTrigger value="pufa">PUFA</TabsTrigger>
              <TabsTrigger value="fotel">FOTEL</TabsTrigger>
            </TabsList>

            <TabsContent value="sofa">
              <ProductionGuidePdfPreview decoded={decoded} productType="sofa" width={550} />
            </TabsContent>
            <TabsContent value="pufa">
              <ProductionGuidePdfPreview decoded={decoded} productType="pufa" width={550} />
            </TabsContent>
            <TabsContent value="fotel">
              <ProductionGuidePdfPreview decoded={decoded} productType="fotel" width={550} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
