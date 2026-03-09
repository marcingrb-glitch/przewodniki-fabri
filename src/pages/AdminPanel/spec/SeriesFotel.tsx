import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function SeriesFotel() {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle className="text-lg">Fotel — dziedziczenie z sofy</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p>Fotel korzysta z tych samych komponentów co sofa, z wyjątkiem nóżek:</p>
          <ul className="list-disc ml-6 space-y-1">
            <li>Siedzisko — takie samo jak w sofie (odpowiedni kod SD)</li>
            <li>Oparcie — takie samo jak w sofie</li>
            <li>Boczki — takie same jak w sofie</li>
            <li>Automat — taki sam jak w sofie</li>
            <li>Skrzynia — taka sama jak w sofie</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-lg">Nóżki fotela</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex gap-3 flex-wrap">
            <Badge variant="outline">Zawsze z segmentu N w SKU</Badge>
            <Badge variant="outline">Wysokość: 15 cm</Badge>
            <Badge variant="outline">Ilość: 4 szt</Badge>
            <Badge variant="outline">Montaż: Dziewczyny od nóżek</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
