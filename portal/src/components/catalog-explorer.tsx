"use client";

import { startTransition, useDeferredValue, useMemo, useState } from "react";
import Link from "next/link";
import { Search, SlidersHorizontal, Sparkles } from "lucide-react";

import { ProductCard } from "@/components/product-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { PortalCategory, PortalProduct, ProductCategorySlug } from "@/lib/types";
import { cn } from "@/lib/utils";

export function CatalogExplorer({
  products,
  categories,
  selectedCategory = "all",
}: {
  products: PortalProduct[];
  categories: Array<PortalCategory & { count: number }>;
  selectedCategory?: string;
}) {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState(selectedCategory);
  const [feedback, setFeedback] = useState<string | null>(null);
  const deferredQuery = useDeferredValue(query);

  const filteredProducts = useMemo(() => {
    const normalized = deferredQuery.toLowerCase().trim();
    return products.filter((product) => {
      const categoryMatch =
        activeCategory === "all" ||
        product.categorySlugs.includes(activeCategory as ProductCategorySlug);
      if (!categoryMatch) return false;
      if (!normalized) return true;

      return `${product.name} ${product.code} ${product.description} ${product.categorySlugs.join(" ")}`
        .toLowerCase()
        .includes(normalized);
    });
  }, [activeCategory, deferredQuery, products]);

  async function createOrder(product: PortalProduct) {
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
        setFeedback("No pudimos crear la solicitud en este momento.");
        return;
      }

      const order = (await response.json()) as { id: string };
      setFeedback(`Pedido borrador ${order.id} creado para ${product.code}.`);
    });
  }

  return (
    <section className="page-frame section-gap">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 rounded-[1.8rem] border border-line bg-white p-5 shadow-[0_18px_40px_rgba(20,57,171,0.08)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="label-kicker">
                <Sparkles className="size-4" />
                Catalogo conectado a Supabase
              </p>
              <h1 className="mt-2 section-heading font-bold text-graphite">Productos reales, listos para pedir</h1>
            </div>
            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <div className="relative min-w-[280px] flex-1">
                <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted" />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  className="pl-11"
                  placeholder="Buscar por nombre, codigo o aplicacion"
                />
              </div>
              <Button variant="secondary">
                <SlidersHorizontal className="size-4" />
                Filtros
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveCategory("all")}
              className={cn(
                "rounded-full border px-4 py-2 text-sm font-semibold transition",
                activeCategory === "all"
                  ? "border-brand bg-brand text-white"
                  : "border-line bg-surface-soft text-muted hover:border-brand hover:text-brand",
              )}
            >
              Todos
            </button>
            {categories.map((category) => (
              <button
                key={category.slug}
                onClick={() => setActiveCategory(category.slug)}
                className={cn(
                  "rounded-full border px-4 py-2 text-sm font-semibold transition",
                  activeCategory === category.slug
                    ? "border-brand bg-brand text-white"
                    : "border-line bg-surface-soft text-muted hover:border-brand hover:text-brand",
                )}
              >
                {category.shortName}
              </button>
            ))}
          </div>

          {feedback ? <Badge variant="success">{feedback}</Badge> : null}
        </div>

        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-semibold text-muted">
            {filteredProducts.length} resultados para una compra o cotizacion mas rapida
          </p>
          <Button variant="ghost" asChild>
            <Link href="/mensajes">Abrir soporte comercial</Link>
          </Button>
        </div>

        <div className="grid-auto-products">
          {filteredProducts.map((product, index) => (
            <div key={product.id} className="relative">
              <ProductCard product={product} priority={index < 2} />
              <button
                onClick={() => createOrder(product)}
                className="absolute right-4 top-4 rounded-full border border-white/70 bg-white/90 px-3 py-1 text-xs font-semibold text-brand shadow-sm transition hover:bg-brand hover:text-white"
              >
                Borrador rapido
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
