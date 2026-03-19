import { useState, useEffect } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { parseSKUGeneric, fetchSkuAliases } from "@/utils/skuParserGeneric";
import { decodeSKU } from "@/utils/skuDecoderGeneric";
import type { DecodedSKU } from "@/types";

export interface UseSkuPreviewDecoderResult {
  decoded: DecodedSKU | null;
  isLoading: boolean;
  error: string | null;
  skuInput: string;
  setSkuInput: (sku: string) => void;
}

export function useSkuPreviewDecoder(defaultSku: string): UseSkuPreviewDecoderResult {
  const [skuInput, setSkuInput] = useState(defaultSku);
  const [decoded, setDecoded] = useState<DecodedSKU | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debouncedSku = useDebounce(skuInput, 500);

  // Reset when defaultSku changes (series change)
  useEffect(() => {
    setSkuInput(defaultSku);
  }, [defaultSku]);

  useEffect(() => {
    if (!debouncedSku.trim()) {
      setDecoded(null);
      setError(null);
      return;
    }

    let cancelled = false;
    async function decode() {
      setIsLoading(true);
      setError(null);
      try {
        // Extract series code from SKU (first segment)
        const seriesCode = debouncedSku.split("-")[0] || "S1";
        const aliases = await fetchSkuAliases(seriesCode);
        const parsed = await parseSKUGeneric(debouncedSku, aliases);
        const result = await decodeSKU(parsed);
        if (!cancelled) {
          setDecoded(result);
          setError(null);
        }
      } catch (e: any) {
        if (!cancelled) {
          setError(e?.message || "Błąd dekodowania SKU");
          setDecoded(null);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    decode();
    return () => { cancelled = true; };
  }, [debouncedSku]);

  return { decoded, isLoading, error, skuInput, setSkuInput };
}
