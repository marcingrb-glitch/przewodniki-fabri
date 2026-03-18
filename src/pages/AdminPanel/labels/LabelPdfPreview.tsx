import { useState, useEffect, useRef, useCallback } from "react";
import { createDoc, addLabel, type LabelSettings } from "@/utils/pdfHelpers";
import { useDebounce } from "@/hooks/useDebounce";
import * as pdfjsLib from "pdfjs-dist";

// Configure pdf.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.mjs",
  import.meta.url
).toString();

interface LabelPdfPreviewProps {
  lines: string[];
  settings: LabelSettings;
  width?: number;
  height?: number;
}

export default function LabelPdfPreview({
  lines,
  settings,
  width = 400,
  height = 120,
}: LabelPdfPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rendering, setRendering] = useState(false);

  const debouncedLines = useDebounce(lines, 300);
  const debouncedSettings = useDebounce(settings, 300);

  useEffect(() => {
    let cancelled = false;

    async function render() {
      if (debouncedLines.length === 0 || !canvasRef.current) return;
      setRendering(true);
      try {
        const doc = await createDoc("landscape", [100, 30]);
        addLabel(doc, debouncedLines, true, debouncedSettings);
        const arrayBuffer = doc.output("arraybuffer");

        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const page = await pdf.getPage(1);

        const canvas = canvasRef.current;
        if (!canvas || cancelled) return;

        // Scale to fit the desired width
        const viewport = page.getViewport({ scale: 1 });
        const scale = width / viewport.width;
        const scaledViewport = page.getViewport({ scale });

        canvas.width = scaledViewport.width;
        canvas.height = scaledViewport.height;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        await page.render({ canvasContext: ctx, viewport: scaledViewport }).promise;
        if (!cancelled) setRendering(false);
      } catch (e) {
        console.error("LabelPdfPreview render error:", e);
        if (!cancelled) setRendering(false);
      }
    }

    render();
    return () => { cancelled = true; };
  }, [debouncedLines, debouncedSettings, width]);

  return (
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
  );
}
