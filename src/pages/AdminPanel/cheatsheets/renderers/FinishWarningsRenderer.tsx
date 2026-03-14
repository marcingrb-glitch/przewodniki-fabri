import type { SectionRendererProps } from "../types";

export function FinishWarningsRenderer({ section, data }: SectionRendererProps) {
  const seats = data.getByCategory("seat").filter(s => {
    const af = s.allowed_finishes ?? [];
    return af.length > 1;
  });

  return (
    <div className="space-y-2">
      <p className="warning font-bold underline text-lg">
        {section.notes ?? "Wykończenie poduszek / jaśków / wałków = DZIEDZICZONE od siedziska!"}
      </p>
      {seats.map(s => (
        <p key={s.id} className="warning font-bold underline">
          ⚠️ {s.code} ({(s.properties as any)?.model_name ?? "—"}) — dozwolone: {(s.allowed_finishes ?? []).join(", ")} — uwaga na różne rysunki!
        </p>
      ))}
    </div>
  );
}
