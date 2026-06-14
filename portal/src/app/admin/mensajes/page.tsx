import { AdminMessagesClient } from "@/components/admin-messages-client";
import { AdminSidebar } from "@/components/admin-sidebar";
import { listConversations } from "@/lib/mock-store";

export default function AdminMessagesPage() {
  return (
    <div className="mx-auto flex min-h-screen max-w-[1600px]">
      <AdminSidebar active="/admin/mensajes" />
      <main className="min-w-0 flex-1 px-4 py-6 md:px-6">
        <div className="space-y-5">
          <div>
            <p className="label-kicker">Panel de administracion</p>
            <h1 className="mt-2 text-4xl font-bold tracking-[-0.05em] text-graphite">Mensajes y Bonny</h1>
          </div>
          <AdminMessagesClient initialConversations={listConversations()} />
        </div>
      </main>
    </div>
  );
}
