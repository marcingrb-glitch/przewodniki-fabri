import { useEffect, useRef, useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, X } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { downloadBlob } from "@/utils/pdfHelpers";
import * as pdfjsLib from "pdfjs-dist";

// Worker setup — new URL() + import.meta.url działa najlepiej z Vite
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

interface PDFPreviewProps {
  pdfBlob: Blob | null;
  title: string;
  fileName: string;
  onClose: () => void;
}

const PDFPreview = ({ pdfBlob, title, fileName, onClose }: PDFPreviewProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!pdfBlob || !containerRef.current) return;
    const container = containerRef.current;
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);
      // Wyczyść tylko canvasy (zachowaj React-owe dzieci jak Skeleton/error)
      container.querySelectorAll("canvas").forEach((c) => c.remove());

      try {
        console.log("[PDFPreview] starting render, workerSrc:", pdfjsLib.GlobalWorkerOptions.workerSrc);
        const buf = await pdfBlob.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
        console.log("[PDFPreview] pdf loaded, pages:", pdf.numPages);
        if (cancelled) return;

        const containerW = (container.clientWidth || 700) - 16;

        for (let i = 1; i <= pdf.numPages; i++) {
          if (cancelled) return;
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: 1 });
          const scale = Math.min(2, containerW / viewport.width);
          const scaled = page.getViewport({ scale });

          const canvas = document.createElement("canvas");
          canvas.width = scaled.width;
          canvas.height = scaled.height;
          canvas.style.display = "block";
          canvas.style.margin = "0 auto 12px";
          canvas.style.boxShadow = "0 1px 3px rgba(0,0,0,.1)";
          canvas.style.background = "white";

          const ctx = canvas.getContext("2d");
          if (!ctx) continue;

          await page.render({ canvasContext: ctx, viewport: scaled }).promise;
          if (cancelled) return;
          container.appendChild(canvas);
          console.log("[PDFPreview] rendered page", i);
        }
      } catch (e) {
        console.error("[PDFPreview] render error:", e);
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [pdfBlob]);

  if (!pdfBlob) return null;

  return (
    <Dialog open onOpenChange={(open) => {
      if (!open) onClose();
    }}>
      <DialogContent className="max-w-4xl h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>Podgląd wygenerowanego dokumentu PDF</DialogDescription>
        </DialogHeader>
        <div
          ref={containerRef}
          className="flex-1 min-h-0 overflow-auto bg-muted/40 rounded p-2"
        >
          {loading && <Skeleton className="w-full h-64" />}
          {error && <p className="text-sm text-destructive p-4">Błąd renderu: {error}</p>}
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            <X className="mr-1.5 h-4 w-4" /> Zamknij
          </Button>
          <Button onClick={() => downloadBlob(pdfBlob, fileName)}>
            <Download className="mr-1.5 h-4 w-4" /> Pobierz PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PDFPreview;
