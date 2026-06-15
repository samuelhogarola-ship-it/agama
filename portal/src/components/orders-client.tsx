"use client";

import { startTransition, useState } from "react";
import Link from "next/link";
import { ArrowRight, PackageCheck, RotateCcw, Sparkles, Truck } from "lucide-react";

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
  const activeOrders = orders.filter((order) => ["Recibido", "En revisión", "En preparación", "Enviado"].includes(order.status)).length;

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
        <div className="editorial-panel p-5 md:p-6">
          <div className="relative z-10 flex flex-col gap-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div className="max-w-3xl">
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

            <div className="grid gap-3 md:grid-cols-3">
              <div className="glass-band rounded-[1.4rem] px-4 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
                  Pedidos visibles
                </p>
                <p className="mt-2 text-2xl font-bold tracking-[-0.04em] text-graphite">{orders.length}</p>
              </div>
              <div className="glass-band rounded-[1.4rem] px-4 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
                  Activos
                </p>
                <p className="mt-2 text-2xl font-bold tracking-[-0.04em] text-graphite">{activeOrders}</p>
              </div>
              <div className="glass-band rounded-[1.4rem] px-4 py-4">
                <div className="flex items-center gap-2 text-brand">
                  <Truck className="size-4" />
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em]">Ruta sugerida</p>
                </div>
                <p className="mt-2 text-sm leading-6 text-muted">
                  Repite pedidos frecuentes y abre detalle cuando necesites validar entrega o nota comercial.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {orders.map((order) => (
            <article
              key={order.id}
              className="rounded-[1.7rem] border border-line bg-white p-5 shadow-[0_16px_36px_rgba(20,57,171,0.08)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_22px_48px_rgba(20,57,171,0.1)]"
            >
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-xl font-bold text-graphite">{order.id}</h2>
                    <Badge variant={STATUS_VARIANTS[order.status]}>{order.status}</Badge>
                    <Badge variant="graphite">{formatDate(order.date)}</Badge>
                    {order.status === "En preparación" || order.status === "Enviado" ? (
                      <Badge variant="cyan">Seguimiento activo</Badge>
                    ) : null}
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
                  <div className="sm:col-span-3 rounded-[1.15rem] border border-line bg-[linear-gradient(180deg,#fff,#f7f9fe)] px-4 py-3">
                    <div className="flex items-start gap-2">
                      <Sparkles className="mt-0.5 size-4 text-brand" />
                      <p className="text-sm leading-6 text-muted">
                        Usa <span className="font-semibold text-graphite">Repetir</span> para crear un nuevo borrador con la referencia ya armada.
                      </p>
                    </div>
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
