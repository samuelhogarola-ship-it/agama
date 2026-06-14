"use client";

import { startTransition, useState } from "react";

import { Badge } from "@/components/ui/badge";
import type { OrderStatus, PortalOrder } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";

const STATUSES: OrderStatus[] = [
  "Recibido",
  "En revisión",
  "En preparación",
  "Enviado",
  "Completado",
  "Cancelado",
];

const VARIANTS = {
  Recibido: "brand",
  "En revisión": "warning",
  "En preparación": "hot",
  Enviado: "cyan",
  Completado: "success",
  Cancelado: "danger",
} as const;

export function AdminOrdersClient({ initialOrders }: { initialOrders: PortalOrder[] }) {
  const [orders, setOrders] = useState(initialOrders);

  async function changeStatus(orderId: string, status: OrderStatus) {
    startTransition(async () => {
      const response = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) return;
      const updated = (await response.json()) as PortalOrder;
      setOrders((current) => current.map((order) => (order.id === updated.id ? updated : order)));
    });
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => (
        <article
          key={order.id}
          className="rounded-[1.6rem] border border-line bg-white p-5 shadow-[0_16px_36px_rgba(20,57,171,0.08)]"
        >
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-xl font-bold text-graphite">{order.id}</h2>
                <Badge variant={VARIANTS[order.status]}>{order.status}</Badge>
                <Badge variant="graphite">{formatDate(order.date)}</Badge>
              </div>
              <p className="text-sm leading-6 text-muted">{order.note}</p>
              <div className="flex flex-wrap gap-2">
                {order.items.map((item) => (
                  <span key={`${order.id}-${item.productCode}`} className="rounded-full bg-surface-soft px-3 py-1.5 text-xs font-medium text-muted">
                    {item.productCode} · {item.quantity} {item.unit}
                  </span>
                ))}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3 xl:min-w-[420px]">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">Cliente</p>
                <p className="mt-2 font-semibold text-graphite">{order.customerName}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">Importe</p>
                <p className="mt-2 font-semibold text-graphite">{formatCurrency(order.amount)}</p>
              </div>
              <label className="text-sm font-semibold text-muted">
                Estado
                <select
                  value={order.status}
                  onChange={(event) => changeStatus(order.id, event.target.value as OrderStatus)}
                  className="mt-2 h-11 w-full rounded-2xl border border-line bg-white px-4 text-sm font-medium text-graphite outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/10"
                >
                  {STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
