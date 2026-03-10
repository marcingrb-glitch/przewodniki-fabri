import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ArrowUp, ArrowDown, Settings } from "lucide-react";
import { toast } from "sonner";
import useDebounce from "@/hooks/useDebounce";

export interface LabelSettingsData {
  id: string;
  left_zone_fields: string[];
  header_template: string;
  left_zone_width: number;
  series_code_size: number;
  series_name_size: number;
  series_collection_size: number;
  content_max_size: number;
  content_min_size: number;
}

const DEFAULTS: Omit<LabelSettingsData, "id"> = {
  left_zone_fields: ["series.code", "series.name", "series.collection"],
  header_template: "{TYPE} | Zam: {ORDER}",
  left_zone_width: 16,
  series_code_size: 18,
  series_name_size: 9,
  series_collection_size: 7,
  content_max_size: 14,
  content_min_size: 7,
};

const AVAILABLE_LEFT_FIELDS = [
  { value: "series.code", label: "Kod serii", example: "S1" },
  { value: "series.name", label: "Nazwa serii", example: "Sofa Mar" },
  { value: "series.collection", label: "Kolekcja", example: "Vienne" },
  { value: "product_type", label: "Typ produktu", example: "SOFA" },
  { value: "order_number", label: "Numer zamówienia", example: "12345" },
];

export function useLabelSettings() {
  return useQuery<LabelSettingsData>({
    queryKey: ["label-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("label_settings")
        .select("*")
        .limit(1)
        .single();
      if (error) throw error;
      return {
        ...data,
        left_zone_fields: (data.left_zone_fields as string[]) || DEFAULTS.left_zone_fields,
      } as LabelSettingsData;
    },
  });
}

export default function LabelSettings() {
  const queryClient = useQueryClient();
  const { data: settings, isLoading } = useLabelSettings();
  const [open, setOpen] = useState(false);
  const [localFields, setLocalFields] = useState<string[]>([]);
  const [localHeader, setLocalHeader] = useState("");
  const [localSizes, setLocalSizes] = useState({
    left_zone_width: 16,
    series_code_size: 18,
    series_name_size: 9,
    series_collection_size: 7,
    content_max_size: 14,
    content_min_size: 7,
  });

  useEffect(() => {
    if (settings) {
      setLocalFields(settings.left_zone_fields);
      setLocalHeader(settings.header_template);
      setLocalSizes({
        left_zone_width: settings.left_zone_width,
        series_code_size: settings.series_code_size,
        series_name_size: settings.series_name_size,
        series_collection_size: settings.series_collection_size,
        content_max_size: settings.content_max_size,
        content_min_size: settings.content_min_size,
      });
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: async (updates: Partial<LabelSettingsData>) => {
      if (!settings) return;
      const { error } = await supabase
        .from("label_settings")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", settings.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["label-settings"] });
      toast.success("Zapisano ustawienia");
    },
    onError: () => toast.error("Błąd zapisu"),
  });

  const debouncedHeader = useDebounce(localHeader, 800);
  const debouncedSizes = useDebounce(localSizes, 800);

  useEffect(() => {
    if (settings && debouncedHeader !== settings.header_template) {
      saveMutation.mutate({ header_template: debouncedHeader });
    }
  }, [debouncedHeader]);

  useEffect(() => {
    if (!settings) return;
    const changed = Object.entries(debouncedSizes).some(
      ([k, v]) => settings[k as keyof LabelSettingsData] !== v
    );
    if (changed) {
      saveMutation.mutate(debouncedSizes);
    }
  }, [debouncedSizes]);

  const toggleField = (value: string) => {
    let next: string[];
    if (localFields.includes(value)) {
      next = localFields.filter((f) => f !== value);
    } else {
      next = [...localFields, value];
    }
    setLocalFields(next);
    saveMutation.mutate({ left_zone_fields: next });
  };

  const moveField = (idx: number, dir: -1 | 1) => {
    const next = [...localFields];
    const targetIdx = idx + dir;
    if (targetIdx < 0 || targetIdx >= next.length) return;
    [next[idx], next[targetIdx]] = [next[targetIdx], next[idx]];
    setLocalFields(next);
    saveMutation.mutate({ left_zone_fields: next });
  };

  const updateSize = (key: string, value: string) => {
    const num = parseFloat(value) || 0;
    setLocalSizes((prev) => ({ ...prev, [key]: num }));
  };

  // Preview
  const previewHeader = localHeader
    .replace("{TYPE}", "SOFA")
    .replace("{ORDER}", "12345");

  const previewLeftItems = localFields.map((f) => {
    const def = AVAILABLE_LEFT_FIELDS.find((a) => a.value === f);
    return def?.example || f;
  });

  if (isLoading) return null;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 mb-4">
          <Settings className="h-4 w-4" />
          Ustawienia globalne etykiet
          <ChevronDown
            className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`}
          />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="border rounded-lg p-4 mb-4 space-y-6 bg-muted/30">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left zone fields */}
          <div className="space-y-3">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
              Pola lewej strefy (obrócone)
            </Label>
            <div className="space-y-1">
              {localFields.map((f, idx) => {
                const def = AVAILABLE_LEFT_FIELDS.find((a) => a.value === f);
                return (
                  <div
                    key={f}
                    className="flex items-center gap-2 py-1 px-2 rounded bg-background"
                  >
                    <span className="text-xs text-muted-foreground w-4">{idx + 1}</span>
                    <Checkbox
                      checked
                      onCheckedChange={() => toggleField(f)}
                    />
                    <span className="text-sm flex-1">{def?.label || f}</span>
                    <Badge variant="outline" className="text-[10px]">
                      {def?.example}
                    </Badge>
                    <div className="flex gap-0.5">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        disabled={idx === 0}
                        onClick={() => moveField(idx, -1)}
                      >
                        <ArrowUp className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        disabled={idx === localFields.length - 1}
                        onClick={() => moveField(idx, 1)}
                      >
                        <ArrowDown className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                );
              })}
              {AVAILABLE_LEFT_FIELDS.filter(
                (a) => !localFields.includes(a.value)
              ).map((a) => (
                <div
                  key={a.value}
                  className="flex items-center gap-2 py-1 px-2 rounded opacity-50"
                >
                  <span className="text-xs text-muted-foreground w-4" />
                  <Checkbox
                    checked={false}
                    onCheckedChange={() => toggleField(a.value)}
                  />
                  <span className="text-sm flex-1">{a.label}</span>
                  <Badge variant="outline" className="text-[10px]">
                    {a.example}
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          {/* Header + font sizes */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
                Wzorzec nagłówka
              </Label>
              <Input
                value={localHeader}
                onChange={(e) => setLocalHeader(e.target.value)}
                placeholder="{TYPE} | Zam: {ORDER}"
                className="text-sm"
              />
              <p className="text-[10px] text-muted-foreground">
                Dostępne zmienne: <code className="bg-muted px-1 rounded">{"{TYPE}"}</code>{" "}
                <code className="bg-muted px-1 rounded">{"{ORDER}"}</code>
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { key: "left_zone_width", label: "Szer. lewej strefy (mm)" },
                { key: "series_code_size", label: "Czcionka kodu serii (pt)" },
                { key: "series_name_size", label: "Czcionka nazwy serii (pt)" },
                { key: "series_collection_size", label: "Czcionka kolekcji (pt)" },
                { key: "content_max_size", label: "Max czcionka treści (pt)" },
                { key: "content_min_size", label: "Min czcionka treści (pt)" },
              ].map(({ key, label }) => (
                <div key={key} className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground">{label}</Label>
                  <Input
                    type="number"
                    value={localSizes[key as keyof typeof localSizes]}
                    onChange={(e) => updateSize(key, e.target.value)}
                    className="h-8 text-sm"
                    min={1}
                    max={key === "left_zone_width" ? 40 : 50}
                    step={key === "left_zone_width" ? 1 : 0.5}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Mini preview */}
        <div>
          <Label className="text-xs uppercase tracking-wide text-muted-foreground font-medium mb-2 block">
            Podgląd
          </Label>
          <div
            className="border rounded bg-background inline-flex overflow-hidden"
            style={{ width: 400, height: 120 }}
          >
            <div
              className="bg-muted flex items-center justify-center shrink-0 relative"
              style={{
                width: (localSizes.left_zone_width / 100) * 400,
                height: 120,
              }}
            >
              <div
                className="absolute flex flex-col items-center gap-0.5"
                style={{
                  transform: "rotate(-90deg)",
                  whiteSpace: "nowrap",
                }}
              >
                {previewLeftItems.map((item, i) => (
                  <span
                    key={i}
                    className="font-semibold"
                    style={{
                      fontSize: i === 0
                        ? `${Math.min(localSizes.series_code_size * 0.7, 16)}px`
                        : i === 1
                        ? `${Math.min(localSizes.series_name_size * 0.9, 12)}px`
                        : `${Math.min(localSizes.series_collection_size * 0.9, 10)}px`,
                    }}
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex-1 px-3 py-2 flex flex-col justify-center gap-0.5 min-w-0">
              <p className="text-xs font-bold truncate">{previewHeader}</p>
              <p className="text-[11px] truncate leading-tight text-muted-foreground italic">
                (treść z szablonu etykiety)
              </p>
            </div>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
