import { ClipboardList } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const RecentOrders = () => {
  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <ClipboardList className="h-5 w-5" />
          Ostatnie zamówienia
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-center text-sm text-muted-foreground py-8">
          Brak zamówień
        </p>
      </CardContent>
    </Card>
  );
};

export default RecentOrders;
