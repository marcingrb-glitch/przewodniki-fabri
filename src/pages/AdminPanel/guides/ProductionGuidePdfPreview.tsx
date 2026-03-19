import { useState, useEffect, useRef } from "react";
import { generateProductionGuidePDF, generatePufaProductionGuidePDF, generateFotelProductionGuidePDF } from "@/utils/pdfGenerators/productionGuide";
import { useDebounce } from "@/hooks/useDebounce";
import type { DecodedSKU } from "@/types";
import * as pdfjsLib from "pdfjs-dist";
import pdfjsWorker from "pdfjs-dist/build/pdf.worker.mjs?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

interface ProductionGuidePdfPreviewProps {
  decoded: DecodedSKU | null;
  productType: "sofa" | "pufa" | "fotel";
  width?: number;
}

export default function ProductionGuidePdfPreview({
  decoded,
  productType,
  width = 500,
}: ProductionGuidePdfPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rendering, setRendering] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debouncedDecoded = useDebounce(decoded, 300);

  useEffect(() => {
    let cancelled = false;

    async function render() {
      if (!debouncedDecoded || !canvasRef.current) return;
      setRendering(true);
      setError(null);
      try {
        let blob: Blob;
        switch (productType) {
          case "pufa":
            blob = await generatePufaProductionGuidePDF(debouncedDecoded);
            break;
          case "fotel":
            blob = await generateFotelProductionGuidePDF(debouncedDecoded);
            break;
          default:
            blob = await generateProductionGuidePDF(debouncedDecoded);
            break;
        }

        const arrayBuffer = await blob.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const page = await pdf.getPage(1);

        const canvas = canvasRef.current;
        if (!canvas || cancelled) return;

        const viewport = page.getViewport({ scale: 1 });
        const scale = width / viewport.width;
        const scaledViewport = page.getViewport({ scale });

        canvas.width = scaledViewport.width;
        canvas.height = scaledViewport.height;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        await page.render({ canvasContext: ctx, viewport: scaledViewport }).promise;
        if (!cancelled) {
          setRendering(false);
          setError(null);
        }
      } catch (e: any) {
        console.error("ProductionGuidePdfPreview render error:", e);
        if (!cancelled) {
          setRendering(false);
          setError(e?.message || "Błąd renderowania podglądu");
        }
      }
    }

    render();
    return () => { cancelled = true; };
  }, [debouncedDecoded, productType, width]);

  if (!decoded) {
    return (
      <div
        className="flex items-center justify-center border rounded-md bg-muted/30 text-sm text-muted-foreground"
        style={{ width, minHeight: 200 }}
      >
        Wprowadź SKU aby zobaczyć podgląd
      </div>
    );
  }

  return (
    <div className="relative">
      {rendering && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/60 z-10 rounded-md">
          <span className="text-sm text-muted-foreground animate-pulse">Renderowanie...</span>
        </div>
      )}
      {error && (
        <p className="text-xs text-destructive mb-2">{error}</p>
      )}
      <canvas
        ref={canvasRef}
        style={{
          width,
          height: "auto",
          border: "1px solid hsl(var(--border))",
          borderRadius: "var(--radius)",
          display: "block",
        }}
      />
    </div>
  );
}
