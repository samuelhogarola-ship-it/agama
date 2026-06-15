import Link from "next/link";
import {
  Blend,
  Droplets,
  FlaskConical,
  Grid2x2,
  ScanSearch,
  Sparkles,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { PortalCategory } from "@/lib/types";
import { cn } from "@/lib/utils";

const ICONS = {
  pigmentos: Droplets,
  masterbatch: Blend,
  aditivos: FlaskConical,
  desmoldantes: ScanSearch,
  purgas: Sparkles,
  "productos-especiales": Grid2x2,
} as const;

export function CategoryRail({
  categories,
  selected = "all",
  basePath = "/catalogo",
}: {
  categories: Array<PortalCategory & { count: number }>;
  selected?: string;
  basePath?: string;
}) {
  return (
    <div className="page-frame section-gap pt-0">
      <div className="rounded-[1.8rem] border border-line bg-white p-4 shadow-[0_16px_38px_rgba(20,57,171,0.08)]">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="label-kicker">Categorias principales</p>
            <h2 className="mt-2 section-heading font-bold text-graphite">Compra con menos vueltas</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
              Entra por familia, identifica color, revisa la ficha y salta a pedido o soporte sin
              perder contexto.
            </p>
          </div>
          <Badge variant="graphite" className="hidden sm:inline-flex">
            2-3 clics hacia cualquier accion clave
          </Badge>
        </div>
        <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
          {categories.map((category) => {
            const Icon = ICONS[category.slug];
            const isSelected = selected === category.slug;

            return (
              <Link
                key={category.slug}
                href={`${basePath}?categoria=${category.slug}`}
                className={cn(
                  "group rounded-[1.4rem] border px-4 py-4 transition duration-300",
                  isSelected
                    ? "border-brand bg-brand text-white shadow-[0_18px_32px_rgba(20,57,171,0.2)]"
                    : "border-line bg-[linear-gradient(180deg,#fff,#f7f9fe)] text-graphite hover:-translate-y-0.5 hover:border-brand/35 hover:bg-white",
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div
                    className={cn(
                      "rounded-2xl border p-2.5 transition",
                      isSelected ? "border-white/30 bg-white/10" : "border-line bg-white group-hover:border-brand/25",
                    )}
                  >
                    <Icon className={cn("size-5", isSelected ? "text-white" : "text-brand")} />
                  </div>
                  <span className={cn("text-xs font-semibold", isSelected ? "text-white/80" : "text-muted")}>
                    {category.count}
                  </span>
                </div>
                <p className="mt-4 text-sm font-semibold">{category.shortName}</p>
                <p className={cn("mt-1 text-sm leading-6", isSelected ? "text-white/75" : "text-muted")}>
                  {category.description}
                </p>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
