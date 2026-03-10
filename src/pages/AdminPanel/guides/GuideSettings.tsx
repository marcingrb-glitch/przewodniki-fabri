import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, Settings } from "lucide-react";
import { toast } from "sonner";
import { useDebounce } from "@/hooks/useDebounce";

export interface GuideSettingsData {
  id: string;
  font_size_header: number;
  font_size_table: number;
  table_row_height: number;
}

const DEFAULTS: Omit<GuideSettingsData, "id"> = {
  font_size_header: 11,
  font_size_table: 9,
  table_row_height: 8,
};

export function useGuideSettings() {
  return useQuery<GuideSettingsData>({
    queryKey: ["guide-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("guide_settings")
        .select("*")
        .limit(1)
        .single();
      if (error) throw error;
      return data as unknown as GuideSettingsData;
    },
  });
}

export default function GuideSettings() {
  const queryClient = useQueryClient();
  const { data: settings, isLoading } = useGuideSettings();
  const [open, setOpen] = useState(false);
  const [localSizes, setLocalSizes] = useState(DEFAULTS);

  useEffect(() => {
    if (settings) {
      setLocalSizes({
        font_size_header: settings.font_size_header,
        font_size_table: settings.font_size_table,
        table_row_height: settings.table_row_height,
      });
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: async (updates: Partial<GuideSettingsData>) => {
      if (!settings) return;
      const { error } = await supabase
        .from("guide_settings")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", settings.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guide-settings"] });
      toast.success("Zapisano ustawienia przewodnika");
    },
    onError: () => toast.error("Błąd zapisu"),
  });

  const debouncedSizes = useDebounce(localSizes, 800);

  useEffect(() => {
    if (!settings) return;
    const changed = Object.entries(debouncedSizes).some(
      ([k, v]) => (settings as any)[k] !== v
    );
    if (changed) {
      saveMutation.mutate(debouncedSizes);
    }
  }, [debouncedSizes]);

  const updateSize = (key: string, value: string) => {
    const num = parseFloat(value) || 0;
    setLocalSizes((prev) => ({ ...prev, [key]: num }));
  };

  if (isLoading) return null;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 mb-4">
          <Settings className="h-4 w-4" />
          Ustawienia globalne przewodników
          <ChevronDown
            className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`}
          />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="border rounded-lg p-4 mb-4 space-y-4 bg-muted/30">
        <div className="grid grid-cols-3 gap-4 max-w-lg">
          {[
            { key: "font_size_header", label: "Czcionka nagłówka (pt)", min: 6, max: 20, step: 0.5 },
            { key: "font_size_table", label: "Czcionka tabeli (pt)", min: 5, max: 16, step: 0.5 },
            { key: "table_row_height", label: "Wys. wiersza tabeli (mm)", min: 4, max: 20, step: 0.5 },
          ].map(({ key, label, min, max, step }) => (
            <div key={key} className="space-y-1">
              <Label className="text-[11px] text-muted-foreground">{label}</Label>
              <Input
                type="number"
                value={localSizes[key as keyof typeof localSizes]}
                onChange={(e) => updateSize(key, e.target.value)}
                className="h-8 text-sm"
                min={min}
                max={max}
                step={step}
              />
            </div>
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
