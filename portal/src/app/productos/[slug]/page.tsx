import Image from "next/image";
import { notFound } from "next/navigation";
import { FileText, Layers3 } from "lucide-react";

import { CustomerShell } from "@/components/customer-shell";
import { ProductActionPanel } from "@/components/product-action-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getProductBySlug } from "@/lib/portal-data";
import { formatCategoryLabel, formatCurrency } from "@/lib/utils";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const gallery = [product.cover, ...product.gallery].filter(Boolean) as string[];

  return (
    <CustomerShell active="/catalogo">
      <section className="page-frame section-gap">
        <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-4">
            <div className="overflow-hidden rounded-[1.8rem] border border-line bg-white shadow-[0_18px_40px_rgba(20,57,171,0.08)]">
              {product.cover ? (
                <div className="relative aspect-[1.02/0.82]">
                  <Image src={product.cover} alt={product.name} fill sizes="(max-width: 1280px) 100vw, 50vw" className="object-cover" />
                </div>
              ) : (
                <div className="flex aspect-[1.02/0.82] items-end bg-[linear-gradient(135deg,#f5f7ff,#edf2ff)] p-8">
                  <span className="text-6xl font-bold tracking-[-0.08em] text-brand">{product.code}</span>
                </div>
              )}
            </div>

            {gallery.length > 1 ? (
              <div className="grid grid-cols-3 gap-4 md:grid-cols-4">
                {gallery.slice(0, 4).map((image, index) => (
                  <div key={`${image}-${index}`} className="relative aspect-square overflow-hidden rounded-[1.3rem] border border-line bg-white">
                    <Image src={image} alt={`${product.name} vista ${index + 1}`} fill sizes="200px" className="object-cover" />
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          <div className="space-y-5">
            <div className="rounded-[1.8rem] border border-line bg-white p-6 shadow-[0_18px_40px_rgba(20,57,171,0.08)]">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="brand">{formatCategoryLabel(product.family)}</Badge>
                <Badge variant="graphite">{product.minOrderQty}</Badge>
              </div>
              <p className="mt-5 text-sm font-semibold uppercase tracking-[0.12em] text-muted">{product.code}</p>
              <h1 className="mt-2 text-4xl font-bold leading-none tracking-[-0.05em] text-graphite">{product.name}</h1>
              <p className="mt-4 text-lg text-muted">{product.description}</p>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <InfoCard label="Precio referencia" value={formatCurrency(product.price)} />
                <InfoCard label="Cantidad minima" value={product.minOrderQty} />
                <InfoCard
                  label="Categoria activa"
                  value={product.categorySlugs.map(formatCategoryLabel).join(", ")}
                />
                <InfoCard label="Color / linea" value={product.color ?? product.type} />
              </div>

              <div className="mt-6">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">Aplicaciones recomendadas</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {product.applications.map((application) => (
                    <span key={application} className="rounded-full bg-surface-soft px-3 py-1.5 text-sm font-medium text-muted">
                      {application}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <ProductActionPanel product={product} />

            <div className="rounded-[1.8rem] border border-line bg-white p-6 shadow-[0_18px_40px_rgba(20,57,171,0.08)]">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-brand-soft p-3 text-brand">
                  <Layers3 className="size-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-brand">Descripcion ampliada</p>
                  <p className="text-sm text-muted">Apoyo comercial y tecnico</p>
                </div>
              </div>
              <p className="mt-4 text-sm leading-7 text-muted">{product.longDescription}</p>
              {product.techSheetUrl ? (
                <Button variant="secondary" className="mt-5" asChild>
                  <a href={product.techSheetUrl} target="_blank" rel="noreferrer">
                    <FileText className="size-4" />
                    Abrir ficha tecnica
                  </a>
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      </section>
    </CustomerShell>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.35rem] border border-line bg-surface-soft p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">{label}</p>
      <p className="mt-2 text-sm font-semibold text-graphite">{value}</p>
    </div>
  );
}
