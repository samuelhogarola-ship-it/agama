"use client";

import { startTransition, useDeferredValue, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Search, SlidersHorizontal, Sparkles } from "lucide-react";

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
        <div className="editorial-panel p-5 md:p-6">
          <div className="relative z-10 flex flex-col gap-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl">
                <p className="label-kicker">
                  <Sparkles className="size-4" />
                  Catalogo conectado a Supabase
                </p>
                <h1 className="mt-2 section-heading font-bold text-graphite">
                  Productos reales, listos para pedir
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-muted md:text-base">
                  Busca por codigo, familia o aplicacion. Entra a ficha tecnica, arma un borrador
                  rapido o salta a soporte comercial sin salir del flujo.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[420px]">
                {[
                  { label: "Resultados", value: String(filteredProducts.length) },
                  { label: "Categorias", value: String(categories.length) },
                  { label: "Ruta rapida", value: "Pedido o cotizacion" },
                ].map((item) => (
                  <div key={item.label} className="glass-band rounded-[1.35rem] px-4 py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
                      {item.label}
                    </p>
                    <p className="mt-2 text-sm font-bold text-graphite">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="catalog-shell">
              <aside className="glass-band rounded-[1.6rem] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-brand">
                      Explorar
                    </p>
                    <h2 className="mt-2 text-2xl font-bold tracking-[-0.04em] text-graphite">
                      Filtra mejor
                    </h2>
                  </div>
                  <div className="rounded-full bg-brand-soft px-3 py-1 text-xs font-semibold text-brand">
                    UX rapida
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted" />
                    <Input
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      className="pl-11"
                      placeholder="Buscar por nombre, codigo o aplicacion"
                    />
                  </div>
                  <Button variant="secondary" className="w-full justify-center">
                    <SlidersHorizontal className="size-4" />
                    Filtros
                  </Button>
                  <div className="rounded-[1.25rem] border border-line bg-white p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                      Tip rapido
                    </p>
                    <p className="mt-2 text-sm leading-6 text-muted">
                      Si ya conoces el codigo AGAMA, buscalo directo y pasa a borrador en segundos.
                    </p>
                  </div>
                  <div className="rounded-[1.25rem] bg-brand px-4 py-4 text-white">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/75">
                      Atajo comercial
                    </p>
                    <p className="mt-2 text-sm leading-6 text-white/90">
                      Usa soporte si el cliente necesita validar uso, tono o cantidad minima antes
                      de cerrar el pedido.
                    </p>
                  </div>
                </div>
              </aside>

              <div className="rounded-[1.6rem] border border-line bg-white p-4 shadow-[0_18px_40px_rgba(20,57,171,0.08)]">
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

                <div className="mt-5 flex flex-col gap-3 border-t border-line pt-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-muted">
                      {filteredProducts.length} resultados para una compra o cotizacion mas rapida
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      Vista pensada para entrar por codigo y salir por accion.
                    </p>
                  </div>
                  <Button variant="ghost" asChild>
                    <Link href="/mensajes">
                      Abrir soporte comercial
                      <ArrowUpRight className="size-4" />
                    </Link>
                  </Button>
                </div>

                {feedback ? <Badge className="mt-4" variant="success">{feedback}</Badge> : null}
              </div>
            </div>
          </div>
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

        {filteredProducts.length === 0 ? (
          <div className="rounded-[1.8rem] border border-dashed border-line-strong bg-white px-6 py-10 text-center shadow-[0_18px_40px_rgba(20,57,171,0.05)]">
            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-brand">
              Sin coincidencias
            </p>
            <h2 className="mt-3 text-2xl font-bold tracking-[-0.04em] text-graphite">
              No encontramos productos con ese criterio
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-muted">
              Prueba otro codigo, cambia de categoria o abre soporte comercial para una recomendacion
              guiada.
            </p>
            <div className="mt-5 flex justify-center">
              <Button asChild>
                <Link href="/mensajes">Ir a Mensajes</Link>
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
