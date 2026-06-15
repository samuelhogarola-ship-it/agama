import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MessageSquareText } from "lucide-react";

import { CustomerShell } from "@/components/customer-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getPortalOrderById } from "@/lib/portal-repository";
import { formatCurrency, formatDate } from "@/lib/utils";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await getPortalOrderById(id);

  if (!order) {
    notFound();
  }

  return (
    <CustomerShell active="/pedidos">
      <section className="page-frame section-gap">
        <div className="mb-5">
          <Button variant="ghost" asChild>
            <Link href="/pedidos">
              <ArrowLeft className="size-4" />
              Volver a pedidos
            </Link>
          </Button>
        </div>
        <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
          <article className="rounded-[1.8rem] border border-line bg-white p-6 shadow-[0_18px_40px_rgba(20,57,171,0.08)]">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-4xl font-bold tracking-[-0.05em] text-graphite">{order.id}</h1>
              <Badge variant="brand">{order.status}</Badge>
              <Badge variant="graphite">{formatDate(order.date)}</Badge>
            </div>
            <p className="mt-4 text-sm leading-7 text-muted">{order.note}</p>

            <div className="mt-6 space-y-3">
              {order.items.map((item) => (
                <div key={`${order.id}-${item.productCode}`} className="rounded-[1.35rem] border border-line bg-surface-soft p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-graphite">{item.productName}</p>
                      <p className="text-sm text-muted">{item.productCode}</p>
                    </div>
                    <p className="text-sm font-semibold text-graphite">
                      {item.quantity} {item.unit}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-[1.8rem] border border-line bg-white p-6 shadow-[0_18px_40px_rgba(20,57,171,0.08)]">
            <p className="label-kicker">Resumen comercial</p>
            <div className="mt-5 space-y-4 text-sm">
              <SummaryRow label="Cliente" value={order.customerName} />
              <SummaryRow label="Canal" value={order.channel} />
              <SummaryRow label="Fecha" value={formatDate(order.date)} />
              <SummaryRow label="Importe" value={formatCurrency(order.amount)} />
            </div>

            <Button className="mt-6 w-full justify-center" asChild>
              <Link href="/mensajes">
                <MessageSquareText className="size-4" />
                Contactar sobre este pedido
              </Link>
            </Button>
          </article>
        </div>
      </section>
    </CustomerShell>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-[1.2rem] bg-surface-soft px-4 py-3">
      <span className="text-muted">{label}</span>
      <span className="font-semibold text-graphite">{value}</span>
    </div>
  );
}
