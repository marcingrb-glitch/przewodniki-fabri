import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, RefreshCw, Download } from "lucide-react";
import { parseSKUGeneric, fetchSkuAliases } from "@/utils/skuParserGeneric";
import { decodeSKU } from "@/utils/skuDecoderGeneric";
import {
  generateSofaLabelsV2PDF,
  generatePufaLabelsV2PDF,
} from "@/utils/pdfGenerators/labelsV2";
import { downloadBlob } from "@/utils/pdfHelpers";
import * as pdfjsLib from "pdfjs-dist";

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

// Presety — wygodne SKU do testowania (edytuj wedle potrzeb)
const PRESETS: { label: string; sku: string; orderNumber: string; kind: "sofa" | "pufa" }[] = [
  { label: "S1 sofa + pufa", sku: "S1-T3D-SD02NA-B8C-OP62A-SK15-AT1-N5A-P1-J1-W1-PF", orderNumber: "1234", kind: "sofa" },
  { label: "S1 narożnik L", sku: "S1-T3D-SD02NA-B8C-OP62A-SK15-AT1-N5A-P1-J1-W1-CH-L", orderNumber: "2001", kind: "sofa" },
  { label: "S2 Elma", sku: "S2-T3D-SD02N-B8C-OP62A-SK15-AT1-N4-P1-J1-W1", orderNumber: "3001", kind: "sofa" },
  { label: "Pufa PF", sku: "PF-S1-T3D-SD02N-N5A", orderNumber: "4001", kind: "pufa" },
];

export default function LabelsLab() {
  const [params, setParams] = useSearchParams();
  const [sku, setSku] = useState(params.get("sku") || PRESETS[0].sku);
  const [orderNumber, setOrderNumber] = useState(params.get("order") || PRESETS[0].orderNumber);
  const [kind, setKind] = useState<"sofa" | "pufa">((params.get("kind") as "sofa" | "pufa") || "sofa");

  const [blob, setBlob] = useState<Blob | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);
  const [autoRerun, setAutoRerun] = useState(true);

  const canvasContainer = useRef<HTMLDivElement>(null);

  // Generowanie PDF
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const seriesCode = sku.trim().toUpperCase().split("-")[0] || "";
        const aliases = await fetchSkuAliases(seriesCode);
        const parsed = await parseSKUGeneric(sku, aliases);
        const decoded = await decodeSKU(parsed);
        decoded.orderNumber = orderNumber;
        decoded.rawSKU = sku;
        const result = kind === "pufa"
          ? await generatePufaLabelsV2PDF(decoded)
          : await generateSofaLabelsV2PDF(decoded);
        if (cancelled) return;
        setBlob(result.large || result.small || null);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [sku, orderNumber, kind, nonce]);

  // Canvas render
  useEffect(() => {
    if (!blob || !canvasContainer.current) return;
    const container = canvasContainer.current;
    let cancelled = false;

    (async () => {
      container.querySelectorAll("canvas").forEach((c) => c.remove());
      try {
        const buf = await blob.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
        if (cancelled) return;
        const containerW = (container.clientWidth || 900) - 16;
        for (let i = 1; i <= pdf.numPages; i++) {
          if (cancelled) return;
          const page = await pdf.getPage(i);
          const vp1 = page.getViewport({ scale: 1 });
          const scale = Math.min(3, containerW / vp1.width);
          const vp = page.getViewport({ scale });
          const canvas = document.createElement("canvas");
          canvas.width = vp.width;
          canvas.height = vp.height;
          canvas.style.cssText = "display:block;margin:0 auto 16px;box-shadow:0 2px 8px rgba(0,0,0,.15);background:white;";
          const ctx = canvas.getContext("2d");
          if (!ctx) continue;
          await page.render({ canvasContext: ctx, viewport: vp }).promise;
          if (cancelled) return;
          container.appendChild(canvas);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [blob]);

  // Auto-rerun po HMR — przy każdym zapisie modułu labelsV2 Vite zrobi full accept
  // a ten komponent się przemontuje; nonce rośnie → useEffect odpali.
  useEffect(() => {
    if (!autoRerun) return;
    if (!import.meta.hot) return;
    const bump = () => setNonce((n) => n + 1);
    import.meta.hot.on("vite:afterUpdate", bump);
    return () => {
      import.meta.hot?.off("vite:afterUpdate", bump);
    };
  }, [autoRerun]);

  const applyPreset = (p: typeof PRESETS[number]) => {
    setSku(p.sku);
    setOrderNumber(p.orderNumber);
    setKind(p.kind);
    const next = new URLSearchParams();
    next.set("sku", p.sku);
    next.set("order", p.orderNumber);
    next.set("kind", p.kind);
    setParams(next);
  };

  const syncParams = () => {
    const next = new URLSearchParams();
    next.set("sku", sku);
    next.set("order", orderNumber);
    next.set("kind", kind);
    setParams(next);
  };

  return (
    <div className="space-y-4 p-4 max-w-5xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">🧪 Labels Lab — szybki podgląd etykiet V2</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-12 gap-3">
            <div className="col-span-7">
              <Label className="text-xs">SKU</Label>
              <Input value={sku} onChange={(e) => setSku(e.target.value)} onBlur={syncParams} className="font-mono text-xs" />
            </div>
            <div className="col-span-2">
              <Label className="text-xs">Numer zam.</Label>
              <Input value={orderNumber} onChange={(e) => setOrderNumber(e.target.value)} onBlur={syncParams} />
            </div>
            <div className="col-span-2">
              <Label className="text-xs">Typ</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={kind}
                onChange={(e) => { setKind(e.target.value as "sofa" | "pufa"); syncParams(); }}
              >
                <option value="sofa">sofa / narożnik</option>
                <option value="pufa">pufa</option>
              </select>
            </div>
            <div className="col-span-1 flex items-end">
              <Button onClick={() => setNonce((n) => n + 1)} className="w-full gap-1">
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <Button key={p.label} size="sm" variant="outline" onClick={() => applyPreset(p)}>
                {p.label}
              </Button>
            ))}
            <label className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground">
              <input
                type="checkbox"
                checked={autoRerun}
                onChange={(e) => setAutoRerun(e.target.checked)}
              />
              auto-regen przy save (HMR)
            </label>
            {blob && (
              <Button size="sm" variant="ghost" onClick={() => downloadBlob(blob, `labels-lab_${orderNumber}.pdf`)}>
                <Download className="h-4 w-4 mr-1" /> PDF
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {loading && (
        <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin mr-2" /> Generowanie…
        </div>
      )}
      {error && (
        <Card>
          <CardContent className="py-4 text-sm text-destructive whitespace-pre-wrap">Błąd: {error}</CardContent>
        </Card>
      )}

      <div
        ref={canvasContainer}
        className="bg-muted/40 rounded p-2 min-h-[400px]"
      />
    </div>
  );
}
