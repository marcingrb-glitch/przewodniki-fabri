import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { parseSKUGeneric, fetchSkuAliases } from "@/utils/skuParserGeneric";
import { decodeSKU } from "@/utils/skuDecoderGeneric";
import { resolveDecodedField } from "@/utils/pdfGenerators/decodingFieldResolver";
import { COMPONENT_FIELDS } from "@/pages/AdminPanel/labels/DisplayFieldsSelector";
import { DEFAULT_EXAMPLE_SKUS, FALLBACK_EXAMPLE_SKU } from "@/pages/AdminPanel/labels/defaultExampleSkus";
import type { DecodedSKU } from "@/types";

interface SeriesRow {
  id: string;
  code: string;
  name: string;
  properties: Record<string, unknown> | null;
}

const HEADER_VARIABLES: { key: string; description: string; resolver: (s: SeriesRow) => string }[] = [
  { key: "{sheet_name}", description: "Nazwa arkusza — z label_templates_v2.sheet_name", resolver: () => "SIEDZISKO · OPARCIE · …" },
  { key: "{series.code}", description: "Kod serii", resolver: (s) => s.code },
  { key: "{series.name}", description: "Pełna nazwa serii", resolver: (s) => s.name },
  { key: "{series.collection}", description: "Kolekcja (properties.collection)", resolver: (s) => (s.properties?.collection as string) || "—" },
  { key: "{orientation}", description: "Orientacja narożnika (L/P) — tylko dla chaise", resolver: () => "L / P" },
  { key: "{width}", description: "Szerokość w cm (np. '190 cm') — z parsowania SKU. Działa też w section.title", resolver: () => "np. 190 cm" },
];

// Grupowanie komponentów — lepiej widoczne w UI
const COMPONENT_GROUPS: { title: string; keys: string[] }[] = [
  { title: "Sofa (main)", keys: ["seat", "backrest", "side", "chest", "automat"] },
  { title: "Narożnik / szezlong", keys: ["chaise", "chaise_seat", "chaise_backrest", "leg_chaise"] },
  { title: "Nogi", keys: ["leg_seat", "leg_chest", "leg", "legs"] },
  { title: "Pufa / fotel / dodatki", keys: ["pufa_seat", "pillow"] },
];

export default function HeaderVariables() {
  const [series, setSeries] = useState<SeriesRow[]>([]);
  const [decodedBySeries, setDecodedBySeries] = useState<Record<string, DecodedSKU | null>>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("products")
        .select("id, code, name, properties")
        .eq("category", "series")
        .order("code");
      const list = (data || []) as SeriesRow[];
      setSeries(list);

      // Dekoduj przykładowe SKU per seria
      const decoded: Record<string, DecodedSKU | null> = {};
      for (const s of list) {
        const sku = DEFAULT_EXAMPLE_SKUS[s.code] || FALLBACK_EXAMPLE_SKU;
        try {
          const aliases = await fetchSkuAliases(s.code);
          const parsed = await parseSKUGeneric(sku, aliases);
          decoded[s.code] = await decodeSKU(parsed);
        } catch {
          decoded[s.code] = null;
        }
      }
      setDecodedBySeries(decoded);
      setLoading(false);
    })();
  }, []);

  const filteredGroups = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return COMPONENT_GROUPS;
    return COMPONENT_GROUPS
      .map((g) => ({
        ...g,
        keys: g.keys.filter((k) => {
          const fields = COMPONENT_FIELDS[k] || [];
          return (
            k.toLowerCase().includes(q) ||
            fields.some((f) => f.value.toLowerCase().includes(q) || f.label.toLowerCase().includes(q))
          );
        }),
      }))
      .filter((g) => g.keys.length > 0);
  }, [filter]);

  const resolve = (seriesCode: string, field: string): string => {
    const decoded = decodedBySeries[seriesCode];
    if (!decoded) return "—";
    try {
      const val = resolveDecodedField(field, decoded);
      return val || "—";
    } catch {
      return "—";
    }
  };

  return (
    <div className="space-y-4 p-4">
      {/* Header vars */}
      <Card>
        <CardHeader>
          <CardTitle>📝 Zmienne w nagłówku etykiety (header_template)</CardTitle>
          <CardDescription>
            Dostępne w kolumnie <code className="text-xs bg-muted px-1 rounded">header_template</code> tabeli{" "}
            <code className="text-xs bg-muted px-1 rounded">label_templates_v2</code>.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[180px]">Zmienna</TableHead>
                  <TableHead className="w-[280px]">Opis</TableHead>
                  {series.map((s) => (
                    <TableHead key={s.id}>{s.code}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {HEADER_VARIABLES.map((v) => (
                  <TableRow key={v.key}>
                    <TableCell className="font-mono text-xs">{v.key}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{v.description}</TableCell>
                    {series.map((s) => (
                      <TableCell key={s.id} className="text-xs">{v.resolver(s)}</TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Display fields */}
      <Card>
        <CardHeader>
          <CardTitle>🧩 Zmienne display_fields (sekcje etykiet)</CardTitle>
          <CardDescription>
            Używane w JSONB <code className="text-xs bg-muted px-1 rounded">sections[].display_fields</code>.
            Wartości pochodzą z dekodowania przykładowego SKU per seria (edytowalne w{" "}
            <code className="text-xs bg-muted px-1 rounded">defaultExampleSkus.ts</code>).
          </CardDescription>
          <div className="mt-3">
            <Label className="text-xs">Filtr</Label>
            <Input
              placeholder="np. seat.frame, foams, lockBolts…"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="max-w-md"
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            filteredGroups.map((group) => (
              <div key={group.title} className="space-y-2">
                <h3 className="text-sm font-semibold">{group.title}</h3>
                {group.keys.map((compKey) => {
                  const fields = COMPONENT_FIELDS[compKey] || [];
                  if (fields.length === 0) return null;
                  return (
                    <div key={compKey} className="border rounded">
                      <div className="px-3 py-1.5 bg-muted/50 text-xs font-mono font-semibold">
                        component: {compKey}
                      </div>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[220px] text-xs">Zmienna</TableHead>
                            <TableHead className="w-[180px] text-xs">Opis</TableHead>
                            <TableHead className="w-[240px] text-xs">Źródło (DB)</TableHead>
                            {series.map((s) => (
                              <TableHead key={s.id} className="text-xs">{s.code}</TableHead>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {fields.map((f) => (
                            <TableRow key={f.value}>
                              <TableCell className="font-mono text-xs">{f.value}</TableCell>
                              <TableCell className="text-xs">{f.label}</TableCell>
                              <TableCell className="text-[11px] text-muted-foreground">{f.source}</TableCell>
                              {series.map((s) => (
                                <TableCell key={s.id} className="text-xs max-w-[260px] truncate" title={resolve(s.code, f.value)}>
                                  {resolve(s.code, f.value)}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Przykłady */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Przykłady szablonów header_template</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div>
            <span className="font-mono text-xs bg-muted px-1 rounded">{"{sheet_name} SOFA {series.collection} [{series.code}]"}</span>
            <span className="text-muted-foreground"> → </span>
            {series.map((s) => (
              <span key={s.id} className="mr-3 text-xs">
                <b>{s.code}:</b> SIEDZISKO SOFA {(s.properties?.collection as string) || "?"} [{s.code}]
              </span>
            ))}
          </div>
          <div>
            <span className="font-mono text-xs bg-muted px-1 rounded">{"{sheet_name}  {series.code}·{series.name} ({orientation})"}</span>
            <span className="text-muted-foreground"> → </span>
            <span className="text-xs">OPARCIE sofy  N2·Narożnik Elma (L)</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
