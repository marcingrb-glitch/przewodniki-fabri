import { useState, useEffect, useRef } from "react";
import { createDoc, addLabel, toBlob, type LabelSettings } from "@/utils/pdfHelpers";
import { useDebounce } from "@/hooks/useDebounce";

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
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const prevUrlRef = useRef<string | null>(null);

  const debouncedLines = useDebounce(lines, 300);
  const debouncedSettings = useDebounce(settings, 300);

  useEffect(() => {
    let cancelled = false;

    async function render() {
      if (debouncedLines.length === 0) return;
      try {
        const doc = await createDoc("landscape", [100, 30]);
        addLabel(doc, debouncedLines, true, debouncedSettings);
        const blob = toBlob(doc);
        const url = URL.createObjectURL(blob);
        if (!cancelled) {
          if (prevUrlRef.current) URL.revokeObjectURL(prevUrlRef.current);
          prevUrlRef.current = url;
          setPdfUrl(url);
        } else {
          URL.revokeObjectURL(url);
        }
      } catch (e) {
        console.error("LabelPdfPreview render error:", e);
      }
    }

    render();
    return () => {
      cancelled = true;
    };
  }, [debouncedLines, debouncedSettings]);

  useEffect(() => {
    return () => {
      if (prevUrlRef.current) URL.revokeObjectURL(prevUrlRef.current);
    };
  }, []);

  if (!pdfUrl) {
    return (
      <div
        className="border rounded bg-muted/30 flex items-center justify-center"
        style={{ width, height }}
      >
        <span className="text-xs text-muted-foreground">Generowanie podglądu...</span>
      </div>
    );
  }

  return (
    <iframe
      src={pdfUrl}
      style={{
        width,
        height,
        border: "1px solid hsl(var(--border))",
        borderRadius: "var(--radius)",
      }}
      title="Podgląd etykiety"
    />
  );
}
