import { AdminSidebar } from "@/components/admin-sidebar";
import { Badge } from "@/components/ui/badge";
import { getCustomerProfile, listOrders } from "@/lib/mock-store";

export default function AdminClientsPage() {
  const profile = getCustomerProfile();
  const orders = listOrders();

  return (
    <div className="mx-auto flex min-h-screen max-w-[1600px]">
      <AdminSidebar active="/admin/clientes" />
      <main className="min-w-0 flex-1 px-4 py-6 md:px-6">
        <div className="space-y-5">
          <div>
            <p className="label-kicker">Panel de administracion</p>
            <h1 className="mt-2 text-4xl font-bold tracking-[-0.05em] text-graphite">Clientes</h1>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <article className="rounded-[1.8rem] border border-line bg-white p-6 shadow-[0_18px_40px_rgba(20,57,171,0.08)] lg:col-span-2">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-bold text-graphite">{profile.company}</h2>
                  <p className="text-sm text-muted">{profile.contactName}</p>
                </div>
                <Badge variant="success">Activo</Badge>
              </div>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                {[
                  ["Correo", profile.email],
                  ["Telefono", profile.phone],
                  ["RFC", profile.taxId],
                  ["Preferencia", profile.contactPreference],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-[1.35rem] border border-line bg-surface-soft p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">{label}</p>
                    <p className="mt-2 text-sm font-semibold text-graphite">{value}</p>
                  </div>
                ))}
              </div>
            </article>

            <article className="rounded-[1.8rem] border border-line bg-white p-6 shadow-[0_18px_40px_rgba(20,57,171,0.08)]">
              <p className="text-sm font-semibold text-brand">Actividad reciente</p>
              <div className="mt-5 space-y-3">
                {orders.slice(0, 3).map((order) => (
                  <div key={order.id} className="rounded-[1.25rem] border border-line bg-surface-soft p-4">
                    <p className="text-sm font-semibold text-graphite">{order.id}</p>
                    <p className="mt-1 text-sm text-muted">{order.status}</p>
                  </div>
                ))}
              </div>
            </article>
          </div>
        </div>
      </main>
    </div>
  );
}
