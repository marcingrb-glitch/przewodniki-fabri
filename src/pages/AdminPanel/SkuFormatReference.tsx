import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { SkuVisualizer, SEGMENT_LABELS, EXAMPLE_SKUS } from "./cheatsheets/shared/SkuVisualizer";

const SEGMENT_EXAMPLES: Record<string, Record<string, string>> = {
  sofa: {
    series: "S1, S2",
    fabric: "T3D, T13C",
    seat: "SD2NA, SD01N",
    side: "B8C, B5B",
    backrest: "OP62A, OP68A",
    chest: "SK15, SK23",
    automat: "AT1, AT2",
    leg: "N5A, N4",
    pillow: "P1, P2",
    jasiek: "J1, J2",
    walek: "W1",
    extra: "PF, PFO, FT",
  },
  narożnik: {
    series: "N2",
    width: "130P, 190L",
    fabric: "T13C",
    seat: "SD4B",
    side: "B5B",
    backrest: "OP68A",
    chest: "SK23",
    automat: "AT1",
    pillow: "P1B",
  },
};

export default function SkuFormatReference() {
  const { data: productTypes = [] } = useQuery({
    queryKey: ["sku-format-product-types"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_types")
        .select("id, code, name, sku_prefix")
        .eq("is_standalone", true)
        .order("code");
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: allSegments = [] } = useQuery({
    queryKey: ["sku-format-segments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sku_segments")
        .select("*")
        .order("position");
      if (error) throw error;
      return data ?? [];
    },
  });

  const defaultTab = productTypes.length > 0 ? productTypes[0].code : "";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Format SKU — Referencja</h1>
        <p className="text-muted-foreground mt-1">
          Struktura kodów SKU per typ produktu. Dane z konfiguracji parsera
          (read-only).
        </p>
      </div>

      {productTypes.length === 0 ? (
        <div className="text-center text-muted-foreground py-8">
          Ładowanie...
        </div>
      ) : (
        <Tabs defaultValue={defaultTab}>
          <TabsList>
            {productTypes.map((pt) => (
              <TabsTrigger key={pt.code} value={pt.code}>
                {pt.name}
              </TabsTrigger>
            ))}
          </TabsList>

          {productTypes.map((pt) => {
            const segments = allSegments
              .filter((s) => s.product_type_id === pt.id)
              .sort((a, b) => a.position - b.position);
            const exampleSku = EXAMPLE_SKUS[pt.code] ?? "";
            const segExamples = SEGMENT_EXAMPLES[pt.code] ?? {};

            return (
              <TabsContent
                key={pt.code}
                value={pt.code}
                className="space-y-6"
              >
                {exampleSku && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">
                        Przykładowy SKU
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <SkuVisualizer sku={exampleSku} segments={segments} />
                    </CardContent>
                  </Card>
                )}

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Segmenty</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[60px]">Poz.</TableHead>
                            <TableHead>Segment</TableHead>
                            <TableHead className="w-[80px]">Prefix</TableHead>
                            <TableHead>Regex</TableHead>
                            <TableHead>Przykłady</TableHead>
                            <TableHead className="w-[60px]">Opc.</TableHead>
                            <TableHead className="w-[80px]">
                              Zero-pad
                            </TableHead>
                            <TableHead className="w-[80px]">Finish</TableHead>
                            <TableHead>Notatki</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {segments.map((seg) => (
                            <TableRow
                              key={seg.id}
                              className={
                                seg.is_optional ? "opacity-70 italic" : ""
                              }
                            >
                              <TableCell className="font-mono text-center">
                                {seg.position}
                              </TableCell>
                              <TableCell className="font-medium">
                                {SEGMENT_LABELS[seg.segment_name] ??
                                  seg.segment_name}
                                <span className="text-xs text-muted-foreground ml-1">
                                  ({seg.segment_name})
                                </span>
                              </TableCell>
                              <TableCell className="font-mono">
                                {seg.prefix ?? "—"}
                              </TableCell>
                              <TableCell className="font-mono text-xs break-all">
                                {seg.regex_pattern}
                              </TableCell>
                              <TableCell className="text-sm">
                                {segExamples[seg.segment_name] ?? "—"}
                              </TableCell>
                              <TableCell className="text-center">
                                {seg.is_optional && (
                                  <Badge variant="outline">Tak</Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-center">
                                {seg.zero_padded && (
                                  <Badge variant="secondary">Tak</Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-center">
                                {seg.has_finish_suffix && (
                                  <Badge variant="secondary">Tak</Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {seg.notes ?? ""}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Legenda</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm space-y-1.5 text-muted-foreground">
                    <p>
                      Segmenty oznaczone kursywą są{" "}
                      <strong>opcjonalne</strong> (mogą nie występować w SKU).
                    </p>
                    <p>
                      <strong>Finish:</strong> ostatnia litera segmentu to kod
                      wykończenia (A = Stebnówka, B = Szczypanka, C =
                      Dwuigłówka, D = Zwykły).
                    </p>
                    <p>
                      <strong>Zero-padded:</strong> kod ma wiodące zero (np.
                      SD01N w S1 vs SD1 w S2).
                    </p>
                    <p>
                      <strong>Prefix:</strong> stały prefix segmentu (np. T dla
                      tkaniny, SD dla siedziska). Parser matchuje po prefixie +
                      regex.
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>
            );
          })}
        </Tabs>
      )}
    </div>
  );
}