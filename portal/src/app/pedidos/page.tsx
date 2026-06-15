import { CustomerShell } from "@/components/customer-shell";
import { OrdersClient } from "@/components/orders-client";
import { listPortalOrders } from "@/lib/portal-repository";

export default async function OrdersPage() {
  const orders = await listPortalOrders();

  return (
    <CustomerShell active="/pedidos">
      <OrdersClient initialOrders={orders} />
    </CustomerShell>
  );
}
