import OrderTabs from "@/components/orders/OrderTabs";
import RecentOrders from "@/components/orders/RecentOrders";

const NewOrderPage = () => {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <OrderTabs />
      </div>
      <div>
        <RecentOrders />
      </div>
    </div>
  );
};

export default NewOrderPage;
