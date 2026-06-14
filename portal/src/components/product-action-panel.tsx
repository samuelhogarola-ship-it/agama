"use client";

import { startTransition, useState } from "react";
import Link from "next/link";
import { MessageCircleMore, ShoppingCart } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { PortalProduct } from "@/lib/types";
import { formatCategoryLabel } from "@/lib/utils";

export function ProductActionPanel({ product }: { product: PortalProduct }) {
  const [feedback, setFeedback] = useState<string | null>(null);

  async function createDraft() {
    startTransition(async () => {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productSlug: product.slug,
          productName: product.name,
          productCode: product.code,
          quantity: 25,
          unitPrice: product.price,
        }),
      });

      if (!response.ok) {
        setFeedback("No pudimos registrar la solicitud.");
        return;
      }

      const order = (await response.json()) as { id: string };
      setFeedback(`Pedido borrador ${order.id} creado para ${product.code}.`);
    });
  }

  return (
    <div className="soft-panel rounded-[1.8rem] p-5">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="brand">{formatCategoryLabel(product.family)}</Badge>
        <Badge variant={product.isQuoteOnly ? "hot" : "success"}>
          {product.isQuoteOnly ? "Cotizacion asistida" : "Compra directa"}
        </Badge>
      </div>
      <div className="mt-5 space-y-3">
        <Button className="w-full justify-center" onClick={createDraft}>
          <ShoppingCart className="size-4" />
          Crear pedido borrador
        </Button>
        <Button variant="secondary" className="w-full justify-center" asChild>
          <Link href="/mensajes">
            <MessageCircleMore className="size-4" />
            Solicitar informacion
          </Link>
        </Button>
      </div>
      {feedback ? <Badge className="mt-4" variant="success">{feedback}</Badge> : null}
    </div>
  );
}
