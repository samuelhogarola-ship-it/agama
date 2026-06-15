import { AdminOrdersClient } from "@/components/admin-orders-client";
import { AdminSidebar } from "@/components/admin-sidebar";
import { listPortalOrders } from "@/lib/portal-repository";

export default async function AdminOrdersPage() {
  const orders = await listPortalOrders();

  return (
    <div className="mx-auto flex min-h-screen max-w-[1600px]">
      <AdminSidebar active="/admin/pedidos" />
      <main className="min-w-0 flex-1 px-4 py-6 md:px-6">
        <div className="space-y-5">
          <div>
            <p className="label-kicker">Panel de administracion</p>
            <h1 className="mt-2 text-4xl font-bold tracking-[-0.05em] text-graphite">Pedidos y clientes</h1>
          </div>
          <AdminOrdersClient initialOrders={orders} />
        </div>
      </main>
    </div>
  );
}
