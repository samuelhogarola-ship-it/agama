import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, FileText, ShoppingCart } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { PortalProduct } from "@/lib/types";
import { cn, formatCategoryLabel, formatCurrency } from "@/lib/utils";

export function ProductCard({
  product,
  mode = "catalog",
  priority = false,
}: {
  product: PortalProduct;
  mode?: "catalog" | "featured";
  priority?: boolean;
}) {
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-[1.65rem] border border-line bg-white shadow-[0_18px_40px_rgba(20,57,171,0.08)]">
      <Link href={`/productos/${product.slug}`} className="relative block overflow-hidden border-b border-line bg-surface-soft">
        {product.cover ? (
          <div className={cn("relative h-56", mode === "featured" && "h-64")}>
            <Image
              src={product.cover}
              alt={product.name}
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              priority={priority}
              className="object-cover transition duration-500 hover:scale-[1.03]"
            />
          </div>
        ) : (
          <div className="flex h-56 items-end bg-[linear-gradient(135deg,#f4f7ff,#eef2ff)] p-5">
            <span className="max-w-[10ch] text-2xl font-bold leading-none tracking-[-0.05em] text-brand">
              {product.code}
            </span>
          </div>
        )}
      </Link>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={product.isQuoteOnly ? "hot" : "brand"}>
            {formatCategoryLabel(product.family)}
          </Badge>
          <Badge variant="graphite">{product.minOrderQty}</Badge>
        </div>

        <div className="mt-4 space-y-2">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">{product.code}</p>
              <h3 className="mt-1 text-xl font-bold leading-tight text-graphite">{product.name}</h3>
            </div>
            <span
              className="mt-1 block size-3 rounded-full ring-4 ring-white"
              style={{ background: product.accent }}
            />
          </div>
          <p className="text-sm leading-6 text-muted">{product.description}</p>
        </div>

        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold text-muted">Precio de referencia</span>
            <span className="font-bold text-graphite">{formatCurrency(product.price)}</span>
          </div>
          <div className="flex flex-wrap gap-2 text-xs font-medium text-muted">
            {product.applications.slice(0, 3).map((application) => (
              <span key={application} className="rounded-full bg-surface-soft px-3 py-1.5">
                {application}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-auto flex flex-wrap gap-2 pt-5">
          <Button asChild className="flex-1 min-w-[160px]">
            <Link href={`/productos/${product.slug}`}>
              <ShoppingCart className="size-4" />
              Comprar
            </Link>
          </Button>
          {product.techSheetUrl ? (
            <Button variant="secondary" asChild className="flex-1 min-w-[160px]">
              <a href={product.techSheetUrl} target="_blank" rel="noreferrer">
                <FileText className="size-4" />
                Ficha tecnica
              </a>
            </Button>
          ) : (
            <Button variant="secondary" asChild className="flex-1 min-w-[160px]">
              <Link href="/mensajes">
                <ArrowUpRight className="size-4" />
                Cotizar
              </Link>
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}
