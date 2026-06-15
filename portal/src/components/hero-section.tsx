import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CircleCheckBig, MessageSquareHeart, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { PortalProduct } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

export function HeroSection({ heroProducts }: { heroProducts: PortalProduct[] }) {
  const [pink, blue, pale] = heroProducts;
  const heroCodes = [pink, blue, pale].filter(Boolean).map((product) => product.code);

  return (
    <section className="page-frame section-gap pt-8 md:pt-10">
      <div className="hero-grid overflow-hidden rounded-[2rem] border border-line bg-white px-6 py-7 shadow-[0_28px_70px_rgba(17,46,122,0.1)] md:px-8 md:py-9">
        <div className="relative flex flex-col justify-between gap-8 overflow-hidden rounded-[1.8rem] bg-white p-2">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand/40 to-transparent" />
          <div className="space-y-5">
            <div className="eyebrow-line" />
            <div className="space-y-3">
              <p className="label-kicker">
                <Sparkles className="size-4" />
                AGAMA commerce portal
              </p>
              <h1 className="headline-display max-w-[7ch] font-bold text-brand">
                NOS MOVEMOS
                <span className="headline-accent block">AL COLOR.</span>
              </h1>
              <p className="max-w-xl text-base leading-7 text-muted md:text-lg">
                Catalogo B2B-first con compra asistida, cotizacion rapida y soporte tecnico en
                contexto. El impacto visual toma el lenguaje de campana y lo convierte en una
                experiencia limpia para pedir mejor.
              </p>
              <div className="flex flex-wrap gap-2">
                {heroCodes.map((code) => (
                  <span
                    key={code}
                    className="rounded-full border border-line bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-brand"
                  >
                    {code}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button size="lg" asChild>
                <Link href="/catalogo">
                  Comprar productos
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button variant="secondary" size="lg" asChild>
                <Link href="/mensajes">
                  Solicitar cotizacion
                  <MessageSquareHeart className="size-4" />
                </Link>
              </Button>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {[
              "Activos reales desde Supabase",
              "PWA lista para instalar en movil",
              "Bonny visible solo en Mensajes",
            ].map((copy) => (
              <div
                key={copy}
                className="flex items-center gap-3 rounded-[1.25rem] border border-line bg-[linear-gradient(180deg,#fff,#f7f9fe)] px-4 py-3 text-sm font-semibold text-graphite"
              >
                <CircleCheckBig className="size-4 text-brand" />
                <span>{copy}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative min-h-[420px] overflow-hidden rounded-[1.8rem] border border-line bg-[radial-gradient(circle_at_top_right,_rgba(234,20,140,0.18),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(24,188,255,0.20),_transparent_32%),linear-gradient(180deg,#f8fbff_0%,#eef4ff_100%)] p-6">
          <div className="hero-burst left-[6%] top-[12%] size-44 bg-hot/25" />
          <div className="hero-burst right-[10%] top-[34%] size-52 bg-cyan/20" />
          <div className="hero-burst bottom-[8%] left-[26%] size-40 bg-brand/14" />
          <div className="orb-ring left-[15%] top-[8%] h-72 w-72" />
          <div className="orb-ring bottom-[5%] right-[5%] h-60 w-60" />

          <div className="relative h-full min-h-[368px]">
            {pink && (
              <div className="hero-orb float-slow left-[4%] top-[7%] h-56 w-56 md:h-64 md:w-64">
                <Image
                  src={pink.cover!}
                  alt={pink.name}
                  fill
                  sizes="256px"
                  priority
                  className="object-cover"
                />
              </div>
            )}
            {blue && (
              <div className="hero-orb float-soft right-[6%] top-[20%] h-60 w-60 md:h-72 md:w-72">
                <Image
                  src={blue.cover!}
                  alt={blue.name}
                  fill
                  sizes="288px"
                  priority
                  className="object-cover"
                />
              </div>
            )}
            {pale && (
              <div className="hero-orb float-slow bottom-[2%] left-[24%] h-44 w-44 md:h-52 md:w-52">
                <Image
                  src={pale.cover!}
                  alt={pale.name}
                  fill
                  sizes="208px"
                  priority
                  className="object-cover"
                />
              </div>
            )}

            <div className="absolute bottom-0 right-0 w-full max-w-sm rounded-[1.6rem] border border-white/70 bg-white/90 p-5 backdrop-blur">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-brand">
                    Color listo para pedir
                  </p>
                  <p className="mt-1 text-sm text-muted">Dos referencias vivas para arrancar compra o cotizacion.</p>
                </div>
                <div className="rounded-full bg-brand px-3 py-1 text-xs font-semibold text-white">
                  B2B
                </div>
              </div>
              <div className="mt-4 grid gap-3">
                {[pink, blue].filter(Boolean).map((product) => (
                  <div
                    key={product.slug}
                    className="flex items-center gap-3 rounded-[1.2rem] border border-line bg-[linear-gradient(180deg,#fff,#f7f9fe)] px-3 py-3"
                  >
                    <div
                      className="size-10 rounded-2xl border border-line"
                      style={{ background: product.accent }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-graphite">{product.name}</p>
                      <p className="text-sm text-muted">{formatCurrency(product.price)}</p>
                    </div>
                    <ArrowRight className="size-4 text-brand" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
