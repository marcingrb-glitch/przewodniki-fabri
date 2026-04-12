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
    { value: "seat.code", label: "Kod siedziska", source: "products (seat)" },
    { value: "seat.type", label: "Typ", source: "products.properties.seat_type" },
    { value: "seat.frame", label: "Stelaż", source: "products.properties.frame (seat)" },
    { value: "seat.foamsList", label: "Pianki", source: "product_specs (foam)" },
    { value: "seat.front", label: "Front", source: "products.properties.front (seat)" },
    { value: "seat.finish", label: "Wykończenie (kod)", source: "z SKU → finishes" },
    { value: "seat.finishName", label: "Wykończenie (nazwa)", source: "z SKU → finishes" },
    { value: "seat.midStrip", label: "Środkowy pasek", source: "products.properties.center_strip (seat)" },
    { value: "seat.springType", label: "Sprężyna", source: "products.properties.spring_type (seat)" },
    { value: "width", label: "Szerokość (cm)", source: "z SKU" },
    { value: "automat.code", label: "Kod automatu", source: "products (automat)" },
    { value: "automat.name", label: "Automat", source: "products (automat)" },
    { value: "automat.type", label: "Typ", source: "products.properties.type (automat)" },
  ],
  side: [
    { value: "side.code", label: "Kod boczka", source: "products (side)" },
    { value: "side.name", label: "Model", source: "products.name (side)" },
    { value: "side.frame", label: "Stelaż", source: "products.properties.frame (side)" },
    { value: "side.finish", label: "Wykończenie (kod)", source: "z SKU → finishes" },
    { value: "side.finishName", label: "Wykończenie (nazwa)", source: "z SKU → finishes" },
  ],
  backrest: [
    { value: "backrest.code", label: "Kod oparcia", source: "products (backrest)" },
    { value: "backrest.height", label: "Wysokość", source: "products.properties.height_cm (backrest)" },
    { value: "backrest.frame", label: "Stelaż", source: "products.properties.frame (backrest)" },
    { value: "backrest.foamsList", label: "Pianki", source: "product_specs (foam)" },
    { value: "backrest.top", label: "Góra", source: "products.properties.top (backrest)" },
    { value: "backrest.finish", label: "Wykończenie (kod)", source: "z SKU → finishes" },
    { value: "backrest.finishName", label: "Wykończenie (nazwa)", source: "z SKU → finishes" },
    { value: "backrest.springType", label: "Sprężyna", source: "products.properties.spring_type (backrest)" },
    { value: "width", label: "Szerokość (cm)", source: "z SKU" },
  ],
  chest: [
    { value: "chest.code", label: "Kod skrzyni", source: "products (chest)" },
    { value: "chest.name", label: "Skrzynia", source: "products (chest)" },
    { value: "chest.legHeight", label: "Wys. nóżki", source: "products.properties.leg_height_cm (chest)" },
    { value: "chest.legCount", label: "Ilość nóżek", source: "products.properties.leg_count (chest)" },
    { value: "automat.code", label: "Kod automatu", source: "products (automat)" },
    { value: "automat.name", label: "Automat", source: "products (automat)" },
  ],
  automat: [
    { value: "automat.code", label: "Kod automatu", source: "products (automat)" },
    { value: "automat.name", label: "Automat", source: "products (automat)" },
    { value: "automat.type", label: "Typ", source: "products.properties.type (automat)" },
  ],
  leg_chest: [
    { value: "legHeights.sofa_chest.leg", label: "Noga", source: "products (chest) + products.properties (series)" },
    { value: "legHeights.sofa_chest.height", label: "H", source: "products.properties.leg_height_cm (chest)" },
    { value: "legHeights.sofa_chest.count", label: "Ilość", source: "products.properties.leg_count (chest)" },
  ],
  leg_seat: [
    { value: "legHeights.sofa_seat.leg", label: "Noga", source: "product_relations (automat_config)" },
    { value: "legHeights.sofa_seat.height", label: "H", source: "product_relations.properties.seat_leg_height_cm" },
    { value: "legHeights.sofa_seat.count", label: "Ilość", source: "product_relations.properties.seat_leg_count" },
  ],
  leg: [
    { value: "pufaLegs.code", label: "Noga", source: "products.properties.pufa_leg_type (series)" },
    { value: "pufaLegs.height", label: "H", source: "products.properties.pufa_leg_height_cm (series)" },
    { value: "pufaLegs.count", label: "Ilość", source: "products.properties.pufa_leg_count (series)" },
    { value: "fotelLegs.code", label: "Noga", source: "products.properties.seat_leg_type (series)" },
    { value: "fotelLegs.height", label: "H", source: "products.properties.seat_leg_height_cm (series)" },
    { value: "fotelLegs.count", label: "Ilość", source: "obliczona" },
  ],
  pufa_seat: [
    { value: "pufaSeat.frontBack", label: "Przód/Tył", source: "products.properties.front_back (seat_pufa)" },
    { value: "pufaSeat.sides", label: "Boki", source: "products.properties.sides (seat_pufa)" },
    { value: "pufaSeat.foam", label: "Pianka", source: "products.properties.base_foam (seat_pufa)" },
    { value: "pufaSeat.box", label: "Skrzynka", source: "products.properties.box_height (seat_pufa)" },
  ],
  pillow: [
    { value: "pillow.code", label: "Kod poduszki", source: "products (pillow)" },
    { value: "pillow.name", label: "Poduszka", source: "products (pillow)" },
    { value: "pillow.finish", label: "Wykończenie (kod)", source: "z SKU → finishes" },
    { value: "pillow.finishName", label: "Wykończenie (nazwa)", source: "z SKU → finishes" },
  ],
  legs: [
    { value: "legs.code", label: "Kod nogi", source: "products (leg)" },
    { value: "legs.name", label: "Noga", source: "products (leg)" },
    { value: "legs.material", label: "Materiał", source: "products.properties.material (leg)" },
    { value: "legs.color", label: "Kolor (kod)", source: "products.colors (leg)" },
    { value: "legs.colorName", label: "Kolor (nazwa)", source: "products.colors (leg)" },
  ],
  chaise_seat: [
    { value: "chaise.frame", label: "Stelaż siedziska", source: "products.properties.frame (chaise)" },
    { value: "chaise.frameModification", label: "Modyfikacja stelaża", source: "products.properties.frame_modification (chaise)" },
    { value: "chaise.springType", label: "Sprężyna", source: "products.properties.spring_type (chaise)" },
    { value: "chaise.seatFoams_summary", label: "Pianki siedziskowe", source: "product_specs (foam, seat)" },
  ],
  chaise_backrest: [
    { value: "chaise.backrestFrame", label: "Stelaż oparcia", source: "products.properties.backrest_frame (chaise)" },
    { value: "chaise.backrestHasSprings", label: "Sprężyna oparcia", source: "products.properties.backrest_has_springs (chaise)" },
    { value: "chaise.backrestFoams_summary", label: "Pianki oparcia", source: "product_specs (foam, backrest)" },
  ],
  leg_chaise: [
    { value: "legHeights.chaise_info", label: "Nóżki szezlonga", source: "= sofa_seat (zawsze takie same)" },
  ],
  chaise: [
    { value: "chaise.code", label: "Kod szezlonga", source: "products (chaise)" },
    { value: "chaise.name", label: "Nazwa", source: "products (chaise)" },
    { value: "chaise.modelName", label: "Model", source: "products.properties.model_name (chaise)" },
    { value: "chaise.frame", label: "Stelaż siedziska", source: "products.properties.frame (chaise)" },
    { value: "chaise.frameModification", label: "Modyfikacja stelaża", source: "products.properties.frame_modification (chaise)" },
    { value: "chaise.backrestFrame", label: "Stelaż oparcia", source: "products.properties.backrest_frame (chaise)" },
    { value: "chaise.springType", label: "Sprężyna", source: "products.properties.spring_type (chaise)" },
    { value: "chaise.seatFoams_summary", label: "Pianki siedziskowe", source: "product_specs (foam, seat)" },
    { value: "chaise.backrestFoams_summary", label: "Pianki oparcia", source: "product_specs (foam, backrest)" },
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
