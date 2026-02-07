import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const OrderHistoryPage = () => {
  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="text-2xl">📋 Historia zamówień</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">
          Historia zamówień będzie dostępna w Etapie 2.
        </p>
      </CardContent>
    </Card>
  );
};

export default OrderHistoryPage;
