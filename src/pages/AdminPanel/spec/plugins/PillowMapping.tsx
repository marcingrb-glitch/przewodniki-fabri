import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, X } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useState } from "react";

interface PillowMappingProps {
  productId: string;
  seriesProductId: string;
}

interface FinishRule {
  seat_finish: string;
  pillow_finish: string;
}

interface MappingRow {
  id: string;
  target_product_id: string | null;
  pillow_finish_rules: FinishRule[];
  exception_side_code: string | null;
  properties: Record<string, any>;
}

export default function PillowMapping({ productId, seriesProductId }: PillowMappingProps) {
  const queryClient = useQueryClient();
  const queryKey = ["pillow-mapping", productId, seriesProductId];

  const { data: mappings = [] } = useQuery<MappingRow[]>({
    queryKey,
    queryFn: async () => {
      const { data } = await supabase
        .from("product_relations")
        .select("*")
        .eq("series_id", seriesProductId)
        .eq("relation_type", "seat_pillow_map")
        .eq("source_product_id", productId)
        .eq("active", true);
      return (data ?? []).map((r: any) => ({
        id: r.id,
        target_product_id: r.target_product_id,
        pillow_finish_rules: Array.isArray(r.properties?.pillow_finish_rules)
          ? r.properties.pillow_finish_rules
          : Object.entries(r.properties?.pillow_finish_rules ?? {}).map(([k, v]) => ({ seat_finish: k, pillow_finish: v as string })),
        exception_side_code: r.properties?.exception_side_code ?? r.properties?.side_condition ?? null,
        properties: r.properties ?? {},
      }));
    },
  });

  const { data: pillows = [] } = useQuery({
    queryKey: ["global-pillows"],
    queryFn: async () => {
      const { data } = await supabase
        .from("products")
        .select("id, code, name")
        .eq("category", "pillow")
        .eq("is_global", true)
        .eq("active", true)
        .order("code");
      return data ?? [];
    },
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey });

  const addMapping = async () => {
    const { error } = await supabase.from("product_relations").insert({
      series_id: seriesProductId,
      relation_type: "seat_pillow_map",
      source_product_id: productId,
      target_product_id: null,
      properties: { pillow_finish_rules: [] },
    });
    if (error) toast.error("Błąd dodawania mapowania");
    else { toast.success("Dodano mapowanie"); invalidate(); }
  };

  const updateProps = async (mapping: MappingRow, patch: Record<string, any>) => {
    const updatedProps = { ...mapping.properties, ...patch };
    const { error } = await supabase.from("product_relations")
      .update({ properties: updatedProps })
      .eq("id", mapping.id);
    if (error) toast.error("Błąd zapisu");
    else { toast.success("Zapisano"); invalidate(); }
  };

  const updateTarget = async (mappingId: string, targetId: string) => {
    const { error } = await supabase.from("product_relations")
      .update({ target_product_id: targetId })
      .eq("id", mappingId);
    if (error) toast.error("Błąd zapisu");
    else { toast.success("Zapisano"); invalidate(); }
  };

  const deleteMapping = async (id: string) => {
    const { error } = await supabase.from("product_relations").delete().eq("id", id);
    if (error) toast.error("Błąd usuwania");
    else { toast.success("Usunięto mapowanie"); invalidate(); }
  };

  if (mappings.length === 0 && pillows.length === 0) return null;

  return (
    <div className="rounded-md border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold">Poduszka oparciowa</h4>
        <Button variant="outline" size="sm" onClick={addMapping}>
          <Plus className="mr-1 h-3 w-3" /> Dodaj mapowanie
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        Reguły wykończenia: wykończenie siedziska → wykończenie poduszki (np. A → C = gdy siedzisko ma wykończenie A, poduszka dostaje C)
      </p>

      {mappings.length === 0 ? (
        <p className="text-sm text-muted-foreground italic">Brak mapowań poduszek</p>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[280px]">Poduszka</TableHead>
                <TableHead>Reguły wykończenia</TableHead>
                <TableHead className="w-[140px]">Wyjątek (boczek)</TableHead>
                <TableHead className="w-[40px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mappings.map((m) => (
                <TableRow key={m.id}>
                  <TableCell>
                    <Select
                      value={m.target_product_id ?? ""}
                      onValueChange={(val) => updateTarget(m.id, val)}
                    >
                      <SelectTrigger className="h-8 text-xs w-[180px]">
                        <SelectValue placeholder="wybierz" />
                      </SelectTrigger>
                      <SelectContent>
                        {pillows.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.code} — {p.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <FinishRulesEditor
                      rules={m.pillow_finish_rules}
                      onChange={(rules) => updateProps(m, { pillow_finish_rules: rules })}
                    />
                  </TableCell>
                  <TableCell>
                    <ExceptionEditor
                      value={m.exception_side_code}
                      onChange={(val) => updateProps(m, {
                        exception_side_code: val || undefined,
                        side_condition: val || undefined,
                      })}
                    />
                  </TableCell>
                  <TableCell>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Usunąć mapowanie poduszki?</AlertDialogTitle>
                          <AlertDialogDescription>Ta operacja jest nieodwracalna.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Anuluj</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteMapping(m.id)}>Usuń</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

function FinishRulesEditor({ rules, onChange }: { rules: FinishRule[]; onChange: (rules: FinishRule[]) => void }) {
  const [localRules, setLocalRules] = useState<FinishRule[]>(rules);

  // Sync if rules change externally
  if (JSON.stringify(rules) !== JSON.stringify(localRules) && document.activeElement?.tagName !== "INPUT") {
    setLocalRules(rules);
  }

  const commit = (updated: FinishRule[]) => {
    setLocalRules(updated);
    onChange(updated);
  };

  const updateRule = (idx: number, field: keyof FinishRule, value: string) => {
    const updated = localRules.map((r, i) => i === idx ? { ...r, [field]: value.toUpperCase() } : r);
    setLocalRules(updated);
  };

  const commitRule = (idx: number, field: keyof FinishRule, value: string) => {
    const updated = localRules.map((r, i) => i === idx ? { ...r, [field]: value.toUpperCase() } : r);
    commit(updated);
  };

  const removeRule = (idx: number) => commit(localRules.filter((_, i) => i !== idx));

  const addRule = () => commit([...localRules, { seat_finish: "", pillow_finish: "" }]);

  return (
    <div className="flex flex-wrap items-center gap-1">
      {localRules.map((rule, idx) => (
        <div key={idx} className="flex items-center gap-0.5">
          <span className="text-xs text-muted-foreground mr-1">siedz.</span>
          <Input
            className="h-6 w-10 text-xs text-center px-1"
            value={rule.seat_finish}
            onChange={(e) => updateRule(idx, "seat_finish", e.target.value)}
            onBlur={(e) => commitRule(idx, "seat_finish", e.target.value)}
            maxLength={2}
          />
          <span className="text-xs text-muted-foreground">→</span>
          <span className="text-xs text-muted-foreground mr-1">poduszka</span>
          <Input
            className="h-6 w-10 text-xs text-center px-1"
            value={rule.pillow_finish}
            onChange={(e) => updateRule(idx, "pillow_finish", e.target.value)}
            onBlur={(e) => commitRule(idx, "pillow_finish", e.target.value)}
            maxLength={2}
          />
          <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => removeRule(idx)}>
            <X className="h-3 w-3 text-muted-foreground" />
          </Button>
        </div>
      ))}
      <Button variant="ghost" size="icon" className="h-5 w-5" onClick={addRule}>
        <Plus className="h-3 w-3" />
      </Button>
    </div>
  );
}

function ExceptionEditor({ value, onChange }: { value: string | null; onChange: (val: string | null) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? "");

  if (!editing) {
    return (
      <div
        className="cursor-pointer"
        onClick={() => { setDraft(value ?? ""); setEditing(true); }}
      >
        {value ? (
          <Badge variant="outline">{value}</Badge>
        ) : (
          <Badge variant="secondary">domyślny</Badge>
        )}
      </div>
    );
  }

  return (
    <Input
      className="h-7 text-xs w-20"
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => {
        setEditing(false);
        const trimmed = draft.trim() || null;
        if (trimmed !== value) onChange(trimmed);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") (e.target as HTMLInputElement).blur();
        if (e.key === "Escape") { setEditing(false); setDraft(value ?? ""); }
      }}
      autoFocus
      placeholder="puste = domyślny"
    />
  );
}
