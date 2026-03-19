import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Props {
  seriesProductId: string;
  seriesProperties: Record<string, any>;
}

export default function SeriesFotel({ seriesProductId, seriesProperties }: Props) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Fotel — komponenty</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p>
            Fotel korzysta z tych samych komponentów co sofa, ale <strong>bez automatu, skrzyni i osobnego oparcia</strong>:
          </p>
          <ul className="list-disc ml-6 space-y-1">
            <li><strong>Siedzisko z zintegrowanym oparciem</strong> — takie samo jak w sofie (kod SD). Oparcie jest częścią siedziska i jest identyczne we wszystkich fotelach.</li>
            <li><strong>Boczki</strong> — takie same jak w sofie</li>
            <li><strong>Nóżki</strong> — z segmentu N w SKU (patrz poniżej)</li>
          </ul>
          <p className="text-muted-foreground mt-2">
            Fotel nie ma: automatu rozkładania, skrzyni na pościel, ani osobnego oparcia.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Nóżki fotela</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex gap-3 flex-wrap">
            <Badge variant="outline">Zawsze z segmentu N w SKU</Badge>
            <Badge variant="outline">Wysokość: {seriesProperties?.fotel_leg_height_cm ?? 15} cm</Badge>
            <Badge variant="outline">Ilość: {seriesProperties?.fotel_leg_count ?? 4} szt</Badge>
            <Badge variant="outline">Kompletacja: Dziewczyny od nóżek (kompletacja do worka)</Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Edycja danych nóżek: Wspólne → Nóżki → tabela "Kto co kompletuje"
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
