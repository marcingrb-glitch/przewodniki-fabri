import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronDown } from "lucide-react";

// Available fields per component — sourced from DB tables (Wspólne + Specyfikacje)
const COMPONENT_FIELDS: Record<string, { value: string; label: string }[]> = {
  seat: [
    { value: "seat.code", label: "Kod siedziska" },
    { value: "seat.type", label: "Typ (kod)" },
    { value: "seat.typeName", label: "Typ (nazwa)" },
    { value: "seat.frame", label: "Rama" },
    { value: "seat.foam", label: "Pianka" },
    { value: "seat.front", label: "Front" },
    { value: "seat.finish", label: "Wykończenie" },
    { value: "seat.finishName", label: "Wykończenie (nazwa)" },
    { value: "seat.midStrip", label: "Środkowy pasek" },
  ],
  side: [
    { value: "side.code", label: "Kod boczka" },
    { value: "side.name", label: "Nazwa" },
    { value: "side.frame", label: "Rama" },
    { value: "side.finish", label: "Wykończenie (kod)" },
    { value: "side.finishName", label: "Wykończenie (nazwa)" },
  ],
  backrest: [
    { value: "backrest.code", label: "Kod oparcia" },
    { value: "backrest.height", label: "Wysokość" },
    { value: "backrest.frame", label: "Rama" },
    { value: "backrest.foam", label: "Pianka" },
    { value: "backrest.top", label: "Góra" },
    { value: "backrest.finish", label: "Wykończenie (kod)" },
    { value: "backrest.finishName", label: "Wykończenie (nazwa)" },
  ],
  chest: [
    { value: "chest.code", label: "Kod skrzyni" },
    { value: "chest.name", label: "Nazwa" },
    { value: "chest.legHeight", label: "Wys. nóżki" },
    { value: "chest.legCount", label: "Ilość nóżek" },
  ],
  automat: [
    { value: "automat.code", label: "Kod automatu" },
    { value: "automat.name", label: "Nazwa" },
    { value: "automat.type", label: "Typ" },
  ],
  leg_chest: [
    { value: "legHeights.sofa_chest.leg", label: "Typ nogi" },
    { value: "legHeights.sofa_chest.height", label: "Wysokość" },
    { value: "legHeights.sofa_chest.count", label: "Ilość" },
  ],
  leg_seat: [
    { value: "legHeights.sofa_seat.leg", label: "Typ nogi" },
    { value: "legHeights.sofa_seat.height", label: "Wysokość" },
    { value: "legHeights.sofa_seat.count", label: "Ilość" },
  ],
  leg: [
    { value: "pufaLegs.code", label: "Kod nogi" },
    { value: "pufaLegs.height", label: "Wysokość" },
    { value: "pufaLegs.count", label: "Ilość" },
    { value: "fotelLegs.code", label: "Kod nogi (fotel)" },
    { value: "fotelLegs.height", label: "Wysokość (fotel)" },
    { value: "fotelLegs.count", label: "Ilość (fotel)" },
  ],
  pufa_seat: [
    { value: "pufaSeat.frontBack", label: "Przód/Tył" },
    { value: "pufaSeat.sides", label: "Boki" },
    { value: "pufaSeat.foam", label: "Pianka" },
    { value: "pufaSeat.box", label: "Skrzynka" },
  ],
  pillow: [
    { value: "pillow.code", label: "Kod poduszki" },
    { value: "pillow.name", label: "Nazwa" },
    { value: "pillow.finish", label: "Wykończenie" },
    { value: "pillow.finishName", label: "Wykończenie (nazwa)" },
  ],
  legs: [
    { value: "legs.code", label: "Kod nogi" },
    { value: "legs.name", label: "Nazwa" },
    { value: "legs.material", label: "Materiał" },
    { value: "legs.color", label: "Kolor" },
    { value: "legs.colorName", label: "Kolor (nazwa)" },
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
      <PopoverContent className="w-[260px] p-2" align="start">
        <div className="space-y-1">
          {availableFields.map((field) => (
            <label
              key={field.value}
              className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-accent cursor-pointer text-sm"
            >
              <Checkbox
                checked={selectedFields.includes(field.value)}
                onCheckedChange={() => toggleField(field.value)}
              />
              <span>{field.label}</span>
              <span className="text-muted-foreground text-xs ml-auto font-mono">{field.value.split(".").pop()}</span>
            </label>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
