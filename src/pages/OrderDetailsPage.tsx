import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const OrderDetailsPage = () => {
  const { id } = useParams();

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="text-2xl">📄 Szczegóły zamówienia</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">
          Zamówienie #{id} — szczegóły będą dostępne w Etapie 2.
        </p>
      </CardContent>
    </Card>
  );
};

export default OrderDetailsPage;
