import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const COMPONENTS_BY_TYPE: Record<string, { value: string; label: string }[]> = {
  sofa: [
    { value: "seat", label: "Siedzisko" },
    { value: "side", label: "Boczek" },
    { value: "backrest", label: "Oparcie" },
    { value: "chest", label: "Skrzynia" },
    { value: "automat", label: "Automat" },
    { value: "leg_chest", label: "Noga skrzynia" },
    { value: "leg_seat", label: "Noga siedzisko" },
    { value: "pillow", label: "Poduszka" },
    { value: "legs", label: "Nóżki (globalne)" },
    { value: "custom", label: "Inne" },
  ],
  pufa: [
    { value: "seat", label: "Siedzisko" },
    { value: "pufa_seat", label: "Siedzisko pufa (dane)" },
    { value: "chest", label: "Skrzynka" },
    { value: "leg", label: "Noga" },
    { value: "custom", label: "Inne" },
  ],
  naroznik: [
    { value: "seat", label: "Siedzisko" },
    { value: "side", label: "Boczek" },
    { value: "backrest", label: "Oparcie" },
    { value: "chaise", label: "Szezlong" },
    { value: "chaise_seat", label: "Szezlong - siedzisko" },
    { value: "chaise_backrest", label: "Szezlong - oparcie" },
    { value: "chest", label: "Skrzynia" },
    { value: "automat", label: "Automat" },
    { value: "leg_chest", label: "Noga skrzynia" },
    { value: "leg_seat", label: "Noga siedzisko" },
    { value: "leg_chaise", label: "Noga szezlong" },
    { value: "pillow", label: "Poduszka" },
    { value: "legs", label: "Nóżki (globalne)" },
    { value: "custom", label: "Inne" },
  ],
  fotel: [
    { value: "seat", label: "Siedzisko" },
    { value: "side", label: "Boczek" },
    { value: "backrest", label: "Oparcie" },
    { value: "leg", label: "Noga" },
    { value: "legs", label: "Nóżki (globalne)" },
    { value: "custom", label: "Inne" },
  ],
};

// Fallback for all product types
const ALL_COMPONENTS = [
  { value: "seat", label: "Siedzisko" },
  { value: "side", label: "Boczek" },
  { value: "backrest", label: "Oparcie" },
  { value: "chest", label: "Skrzynia" },
  { value: "automat", label: "Automat" },
  { value: "leg_chest", label: "Noga skrzynia" },
  { value: "leg_seat", label: "Noga siedzisko" },
  { value: "leg", label: "Noga" },
  { value: "chaise", label: "Szezlong" },
  { value: "chaise_seat", label: "Szezlong - siedzisko" },
  { value: "chaise_backrest", label: "Szezlong - oparcie" },
  { value: "leg_chaise", label: "Noga szezlong" },
  { value: "pufa_seat", label: "Siedzisko pufa" },
  { value: "pillow", label: "Poduszka" },
  { value: "legs", label: "Nóżki (globalne)" },
  { value: "custom", label: "Inne" },
];

interface ComponentSelectorProps {
  value: string;
  productType: string;
  onChange: (value: string) => void;
}

export default function ComponentSelector({ value, productType, onChange }: ComponentSelectorProps) {
  const options = COMPONENTS_BY_TYPE[productType] || ALL_COMPONENTS;

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-8 text-xs w-[130px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((opt) => (
          <SelectItem key={opt.value} value={opt.value} className="text-xs">
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
