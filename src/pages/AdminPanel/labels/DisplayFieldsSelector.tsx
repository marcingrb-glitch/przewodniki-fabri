import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronDown } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface FieldDef {
  value: string;
  label: string;
  source: string; // DB table or source description
}

// Available fields per component — with DB source info
export const COMPONENT_FIELDS: Record<string, FieldDef[]> = {
  seat: [
    { value: "seat.code", label: "Kod siedziska", source: "seats_sofa" },
    { value: "seat.type", label: "Typ", source: "seats_sofa.type" },
    { value: "seat.frame", label: "Stelaż", source: "seats_sofa.frame" },
    { value: "seat.foamsList", label: "Pianki", source: "product_foams" },
    { value: "seat.front", label: "Front", source: "seats_sofa.front" },
    { value: "seat.finish", label: "Wykończenie (kod)", source: "z SKU → finishes" },
    { value: "seat.finishName", label: "Wykończenie (nazwa)", source: "z SKU → finishes" },
    { value: "seat.midStrip", label: "Środkowy pasek", source: "seats_sofa.center_strip" },
    { value: "seat.springType", label: "Sprężyna", source: "seats_sofa.spring_type" },
    { value: "automat.code", label: "Kod automatu", source: "automats (wspólne)" },
    { value: "automat.name", label: "Nazwa", source: "automats (wspólne)" },
    { value: "automat.type", label: "Typ", source: "automats (wspólne)" },
  ],
  side: [
    { value: "side.code", label: "Kod boczka", source: "sides" },
    { value: "side.name", label: "Nazwa", source: "sides.name" },
    { value: "side.frame", label: "Stelaż", source: "sides.frame" },
    { value: "side.finish", label: "Wykończenie (kod)", source: "z SKU → finishes" },
    { value: "side.finishName", label: "Wykończenie (nazwa)", source: "z SKU → finishes" },
  ],
  backrest: [
    { value: "backrest.code", label: "Kod oparcia", source: "backrests" },
    { value: "backrest.height", label: "Wysokość", source: "backrests.height_cm" },
    { value: "backrest.frame", label: "Stelaż", source: "backrests.frame" },
    { value: "backrest.foamsList", label: "Pianki", source: "product_foams" },
    { value: "backrest.top", label: "Góra", source: "backrests.top" },
    { value: "backrest.finish", label: "Wykończenie (kod)", source: "z SKU → finishes" },
    { value: "backrest.finishName", label: "Wykończenie (nazwa)", source: "z SKU → finishes" },
    { value: "backrest.springType", label: "Sprężyna", source: "backrests.spring_type" },
  ],
  chest: [
    { value: "chest.code", label: "Kod skrzyni", source: "chests (wspólne)" },
    { value: "chest.name", label: "Nazwa", source: "chests (wspólne)" },
    { value: "chest.legHeight", label: "Wys. nóżki", source: "chests.leg_height_cm" },
    { value: "chest.legCount", label: "Ilość nóżek", source: "chests.leg_count" },
    { value: "automat.code", label: "Kod automatu", source: "automats (wspólne)" },
    { value: "automat.name", label: "Nazwa", source: "automats (wspólne)" },
  ],
  automat: [
    { value: "automat.code", label: "Kod automatu", source: "automats (wspólne)" },
    { value: "automat.name", label: "Nazwa", source: "automats (wspólne)" },
    { value: "automat.type", label: "Typ", source: "automats.type (wspólne)" },
  ],
  leg_chest: [
    { value: "legHeights.sofa_chest.leg", label: "Typ nogi (skrzynia)", source: "chests + series_config" },
    { value: "legHeights.sofa_chest.height", label: "Wysokość nogi (skrzynia)", source: "chests.leg_height_cm" },
    { value: "legHeights.sofa_chest.count", label: "Ilość nóg (skrzynia)", source: "chests.leg_count" },
  ],
  leg_seat: [
    { value: "legHeights.sofa_seat.leg", label: "Typ nogi (siedzisko)", source: "series_automats" },
    { value: "legHeights.sofa_seat.height", label: "Wysokość nogi (siedzisko)", source: "series_automats.seat_leg_height_cm" },
    { value: "legHeights.sofa_seat.count", label: "Ilość nóg (siedzisko)", source: "series_automats.seat_leg_count" },
  ],
  leg: [
    { value: "pufaLegs.code", label: "Noga (pufa)", source: "series_config.pufa_leg_type" },
    { value: "pufaLegs.height", label: "Wysokość nogi (pufa)", source: "series_config.pufa_leg_height_cm" },
    { value: "pufaLegs.count", label: "Ilość nóg (pufa)", source: "series_config.pufa_leg_count" },
    { value: "fotelLegs.code", label: "Noga (fotel)", source: "series_config.seat_leg_type" },
    { value: "fotelLegs.height", label: "Wysokość nogi (fotel)", source: "series_config.seat_leg_height_cm" },
    { value: "fotelLegs.count", label: "Ilość nóg (fotel)", source: "obliczona" },
  ],
  pufa_seat: [
    { value: "pufaSeat.frontBack", label: "Przód/Tył", source: "seats_pufa.front_back" },
    { value: "pufaSeat.sides", label: "Boki", source: "seats_pufa.sides" },
    { value: "pufaSeat.foam", label: "Pianka", source: "seats_pufa.base_foam" },
    { value: "pufaSeat.box", label: "Skrzynka", source: "seats_pufa.box_height" },
  ],
  pillow: [
    { value: "pillow.code", label: "Kod poduszki", source: "pillows (wspólne)" },
    { value: "pillow.name", label: "Nazwa", source: "pillows (wspólne)" },
    { value: "pillow.finish", label: "Wykończenie (kod)", source: "z SKU → finishes" },
    { value: "pillow.finishName", label: "Wykończenie (nazwa)", source: "z SKU → finishes" },
  ],
  legs: [
    { value: "legs.code", label: "Kod nogi", source: "legs (wspólne)" },
    { value: "legs.name", label: "Nazwa", source: "legs (wspólne)" },
    { value: "legs.material", label: "Materiał", source: "legs.material (wspólne)" },
    { value: "legs.color", label: "Kolor (kod)", source: "legs.colors (wspólne)" },
    { value: "legs.colorName", label: "Kolor (nazwa)", source: "legs.colors (wspólne)" },
  ],
  custom: [],
};

interface DisplayFieldsSelectorProps {
  component: string;
  selectedFields: string[];
  onChange: (fields: string[]) => void;
}

export default function DisplayFieldsSelector({
  component,
  selectedFields,
  onChange,
}: DisplayFieldsSelectorProps) {
  const availableFields = COMPONENT_FIELDS[component] || [];

  const toggleField = (fieldValue: string) => {
    const next = selectedFields.includes(fieldValue)
      ? selectedFields.filter((f) => f !== fieldValue)
      : [...selectedFields, fieldValue];
    onChange(next);
  };

  if (availableFields.length === 0) {
    return <span className="text-muted-foreground text-xs italic">brak pól</span>;
  }

  // Group by source prefix for visual clarity
  const groups: { source: string; fields: FieldDef[] }[] = [];
  let currentSource = "";
  for (const field of availableFields) {
    const src = field.source.split(".")[0];
    if (src !== currentSource) {
      currentSource = src;
      groups.push({ source: field.source, fields: [field] });
    } else {
      groups[groups.length - 1].fields.push(field);
    }
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-auto min-h-8 py-1 px-2 text-xs font-normal justify-between w-full">
          <span className="flex flex-wrap gap-1">
            {selectedFields.length === 0 ? (
              <span className="text-muted-foreground italic">wybierz pola...</span>
            ) : (
              selectedFields.map((f) => {
                const field = availableFields.find((af) => af.value === f);
                return (
                  <Badge key={f} variant="secondary" className="text-xs font-normal">
                    {field?.label || f}
                  </Badge>
                );
              })
            )}
          </span>
          <ChevronDown className="h-3 w-3 ml-1 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[340px] p-2 max-h-[400px] overflow-y-auto" align="start">
        <div className="space-y-0.5">
          {groups.map((group, gi) => (
            <div key={gi}>
              {gi > 0 && <Separator className="my-1.5" />}
              {groups.length > 1 && (
                <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide px-2 pt-1 pb-0.5">
                  {group.source.split(".")[0]}
                </p>
              )}
              {group.fields.map((field) => (
                <label
                  key={field.value}
                  className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-accent cursor-pointer text-sm"
                >
                  <Checkbox
                    checked={selectedFields.includes(field.value)}
                    onCheckedChange={() => toggleField(field.value)}
                  />
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="truncate">{field.label}</span>
                    <span className="text-[10px] text-muted-foreground truncate">{field.source}</span>
                  </div>
                  <span className="text-muted-foreground text-[10px] ml-auto font-mono shrink-0">{field.value}</span>
                </label>
              ))}
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
