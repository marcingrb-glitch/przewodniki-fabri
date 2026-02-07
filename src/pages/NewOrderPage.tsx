import OrderForm from "@/components/orders/OrderForm";
import RecentOrders from "@/components/orders/RecentOrders";

const NewOrderPage = () => {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <OrderForm />
      </div>
      <div>
        <RecentOrders />
      </div>
    </div>
  );
};

export default NewOrderPage;
