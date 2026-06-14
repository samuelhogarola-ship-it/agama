import { CustomerShell } from "@/components/customer-shell";
import { OrdersClient } from "@/components/orders-client";
import { listOrders } from "@/lib/mock-store";

export default function OrdersPage() {
  return (
    <CustomerShell active="/pedidos">
      <OrdersClient initialOrders={listOrders()} />
    </CustomerShell>
  );
}
