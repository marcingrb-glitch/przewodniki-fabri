import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ClipboardList } from "lucide-react";
import {
  Card, CardContent, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getRecentOrders } from "@/utils/supabaseQueries";

const RecentOrders = () => {
  const navigate = useNavigate();
  const { data: orders, isLoading } = useQuery({
    queryKey: ["recent-orders"],
    queryFn: () => getRecentOrders(5),
  });

  const truncate = (s: string, max: number) =>
    s.length > max ? s.slice(0, max) + "..." : s;

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <ClipboardList className="h-5 w-5" />
          Ostatnie zamówienia
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full rounded-md" />
            ))}
          </div>
        ) : !orders || orders.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-8">
            Brak zamówień
          </p>
        ) : (
          <div className="space-y-2">
            {orders.map((order) => (
              <button
                key={order.id}
                onClick={() => navigate(`/order/${order.id}`, {
                  state: { decoded: order.decoded_data },
                })}
                className="w-full rounded-md border p-3 text-left transition-colors hover:bg-accent"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm">
                    #{order.order_number}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {order.order_date
                      ? format(new Date(order.order_date), "dd.MM.yyyy")
                      : ""}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {truncate(order.sku, 40)}
                </p>
              </button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RecentOrders;
