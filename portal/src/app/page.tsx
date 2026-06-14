import Link from "next/link";
import { ArrowRight, Blocks, MessageCircleHeart, ShieldCheck } from "lucide-react";

import { CategoryRail } from "@/components/category-rail";
import { CustomerShell } from "@/components/customer-shell";
import { HeroSection } from "@/components/hero-section";
import { ProductCard } from "@/components/product-card";
import { Button } from "@/components/ui/button";
import { getCategoryCounts, getFeaturedProducts, getPortalProducts, getSpotlightProducts } from "@/lib/portal-data";

export default async function HomePage() {
  const [heroProducts, categories, featuredProducts, spotlights, products] = await Promise.all([
    getFeaturedProducts(),
    getCategoryCounts(),
    getFeaturedProducts(),
    getSpotlightProducts(),
    getPortalProducts(),
  ]);

  return (
    <CustomerShell active="/">
      <HeroSection heroProducts={heroProducts.slice(0, 3)} />
      <CategoryRail categories={categories} />

      <section className="page-frame section-gap">
        <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[1.8rem] border border-line bg-white p-6 shadow-[0_18px_40px_rgba(20,57,171,0.08)]">
            <p className="label-kicker">
              <Blocks className="size-4" />
              Destacados del portal
            </p>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} mode="featured" />
              ))}
            </div>
          </div>

          <div className="space-y-4">
            {spotlights.slice(0, 3).map(({ category, product }) => (
              <article
                key={category.slug}
                className="overflow-hidden rounded-[1.8rem] border border-line bg-white shadow-[0_18px_40px_rgba(20,57,171,0.08)]"
              >
                <div className="grid gap-0 md:grid-cols-[0.95fr_1.05fr]">
                  <div
                    className="noise-dots flex min-h-[180px] flex-col justify-end p-5"
                    style={{
                      backgroundColor: "var(--surface-soft)",
                    }}
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                      {category.name}
                    </p>
                    <h2 className="mt-2 text-3xl font-bold leading-none tracking-[-0.05em] text-brand">
                      {product.code}
                    </h2>
                  </div>
                  <div className="flex flex-col justify-between p-5">
                    <div>
                      <h3 className="text-xl font-bold text-graphite">{product.name}</h3>
                      <p className="mt-2 text-sm leading-6 text-muted">{category.description}</p>
                    </div>
                    <Button variant="secondary" className="mt-4 w-fit" asChild>
                      <Link href={`/productos/${product.slug}`}>
                        Ver producto
                        <ArrowRight className="size-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="page-frame section-gap">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              icon: ShieldCheck,
              title: "Portal B2B primero",
              copy: "La experiencia privilegia cotizacion, repeticion de pedido y soporte tecnico antes que un checkout saturado.",
            },
            {
              icon: MessageCircleHeart,
              title: "Bonny en contexto",
              copy: "El asistente solo aparece en Mensajes para guiar consultas, no como widget flotante invasivo.",
            },
            {
              icon: Blocks,
              title: "Datos vivos del catalogo",
              copy: `${products.length} productos reales conectados al proyecto Supabase con imagenes y fichas tecnicas.`,
            },
          ].map((item) => (
            <article
              key={item.title}
              className="rounded-[1.8rem] border border-line bg-white p-6 shadow-[0_18px_40px_rgba(20,57,171,0.08)]"
            >
              <div className="w-fit rounded-2xl bg-brand-soft p-3 text-brand">
                <item.icon className="size-5" />
              </div>
              <h2 className="mt-5 text-2xl font-bold tracking-[-0.04em] text-graphite">{item.title}</h2>
              <p className="mt-3 text-sm leading-7 text-muted">{item.copy}</p>
            </article>
          ))}
        </div>
      </section>
    </CustomerShell>
  );
}
