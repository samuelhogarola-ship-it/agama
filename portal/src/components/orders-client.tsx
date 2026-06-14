"use client";

import { startTransition, useState } from "react";
import Link from "next/link";
import { ArrowRight, PackageCheck, RotateCcw } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { PortalOrder } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";

const STATUS_VARIANTS = {
  Recibido: "brand",
  "En revisión": "warning",
  "En preparación": "hot",
  Enviado: "cyan",
  Completado: "success",
  Cancelado: "danger",
} as const;

export function OrdersClient({ initialOrders }: { initialOrders: PortalOrder[] }) {
  const [orders, setOrders] = useState(initialOrders);
  const [feedback, setFeedback] = useState<string | null>(null);

  async function repeatOrder(orderId: string) {
    startTransition(async () => {
      const response = await fetch(`/api/orders/${orderId}/repeat`, { method: "POST" });
      if (!response.ok) {
        setFeedback("No pudimos repetir este pedido.");
        return;
      }

      const order = (await response.json()) as PortalOrder;
      setOrders((current) => [order, ...current]);
      setFeedback(`Se creo el borrador ${order.id} a partir de ${orderId}.`);
    });
  }

  return (
    <section className="page-frame section-gap">
      <div className="space-y-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="label-kicker">
              <PackageCheck className="size-4" />
              Historial completo
            </p>
            <h1 className="mt-2 section-heading font-bold text-graphite">Mis pedidos</h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-muted">
              Repite compras, confirma estados y abre soporte sobre cualquier entrega sin salir del
              portal.
            </p>
          </div>
          {feedback ? <Badge variant="success">{feedback}</Badge> : null}
        </div>

        <div className="space-y-4">
          {orders.map((order) => (
            <article
              key={order.id}
              className="rounded-[1.7rem] border border-line bg-white p-5 shadow-[0_16px_36px_rgba(20,57,171,0.08)]"
            >
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-xl font-bold text-graphite">{order.id}</h2>
                    <Badge variant={STATUS_VARIANTS[order.status]}>{order.status}</Badge>
                    <Badge variant="graphite">{formatDate(order.date)}</Badge>
                  </div>
                  <p className="text-sm text-muted">{order.note}</p>
                  <div className="flex flex-wrap gap-2">
                    {order.items.map((item) => (
                      <span key={`${order.id}-${item.productCode}`} className="rounded-full bg-surface-soft px-3 py-1.5 text-xs font-medium text-muted">
                        {item.productCode} · {item.quantity} {item.unit}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3 xl:min-w-[430px]">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">Canal</p>
                    <p className="mt-2 font-semibold text-graphite">{order.channel}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">Importe</p>
                    <p className="mt-2 font-semibold text-graphite">{formatCurrency(order.amount)}</p>
                  </div>
                  <div className="flex flex-wrap gap-2 sm:justify-end">
                    <Button variant="secondary" size="sm" onClick={() => repeatOrder(order.id)}>
                      <RotateCcw className="size-4" />
                      Repetir
                    </Button>
                    <Button size="sm" asChild>
                      <Link href={`/pedidos/${order.id}`}>
                        Ver detalle
                        <ArrowRight className="size-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
