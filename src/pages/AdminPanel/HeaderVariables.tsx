import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface SeriesRow {
  id: string;
  code: string;
  name: string;
  properties: Record<string, unknown> | null;
}

const VARIABLES: { key: string; description: string; resolver: (s: SeriesRow) => string }[] = [
  {
    key: "{sheet_name}",
    description: "Nazwa arkusza (SIEDZISKO, OPARCIE, NOGI…) — z kolumny sheet_name",
    resolver: () => "SIEDZISKO · OPARCIE · …",
  },
  {
    key: "{series.code}",
    description: "Kod serii",
    resolver: (s) => s.code,
  },
  {
    key: "{series.name}",
    description: "Pełna nazwa serii",
    resolver: (s) => s.name,
  },
  {
    key: "{series.collection}",
    description: "Kolekcja (properties.collection)",
    resolver: (s) => (s.properties?.collection as string) || "—",
  },
  {
    key: "{orientation}",
    description: "Orientacja narożnika (L/P) — tylko dla chaise",
    resolver: () => "L lub P (zależne od SKU)",
  },
];

export default function HeaderVariables() {
  const [series, setSeries] = useState<SeriesRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("products")
        .select("id, code, name, properties")
        .eq("category", "series")
        .order("code");
      setSeries((data || []) as SeriesRow[]);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="space-y-4 p-4">
      <Card>
        <CardHeader>
          <CardTitle>Zmienne w nagłówku etykiety (header_template)</CardTitle>
          <CardDescription>
            Zmienne dostępne w kolumnie <code className="text-xs bg-muted px-1 rounded">header_template</code>{" "}
            tabeli <code className="text-xs bg-muted px-1 rounded">label_templates_v2</code>.
            Domyślny szablon: <code className="text-xs bg-muted px-1 rounded">{"{sheet_name}"}        {"{series.code}"} · {"{series.name}"}</code>
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
                {VARIABLES.map((v) => (
                  <TableRow key={v.key}>
                    <TableCell className="font-mono text-xs">{v.key}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{v.description}</TableCell>
                    {series.map((s) => (
                      <TableCell key={s.id} className="text-xs">
                        {v.resolver(s)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Przykłady</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div>
            <span className="font-mono text-xs bg-muted px-1 rounded">
              {"{sheet_name} SOFA {series.collection} [{series.code}]"}
            </span>
            <br />
            <span className="text-muted-foreground">→ </span>
            {series.map((s) => (
              <span key={s.id} className="mr-3">
                <b>{s.code}:</b> SIEDZISKO SOFA {(s.properties?.collection as string) || "?"} [{s.code}]
              </span>
            ))}
          </div>
          <div>
            <span className="font-mono text-xs bg-muted px-1 rounded">
              {"{sheet_name}  {series.code}·{series.name} ({orientation})"}
            </span>
            <br />
            <span className="text-muted-foreground">→ OPARCIE sofy  N2·Narożnik Elma (L)</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
