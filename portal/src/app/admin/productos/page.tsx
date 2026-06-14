import Image from "next/image";

import { AdminSidebar } from "@/components/admin-sidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getPortalProducts } from "@/lib/portal-data";
import { formatCategoryLabel } from "@/lib/utils";

export default async function AdminProductsPage() {
  const products = await getPortalProducts();

  return (
    <div className="mx-auto flex min-h-screen max-w-[1600px]">
      <AdminSidebar active="/admin/productos" />
      <main className="min-w-0 flex-1 px-4 py-6 md:px-6">
        <div className="space-y-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="label-kicker">Panel de administracion</p>
              <h1 className="mt-2 text-4xl font-bold tracking-[-0.05em] text-graphite">Productos y catalogo</h1>
            </div>
            <Button>Nuevo producto</Button>
          </div>

          <div className="overflow-hidden rounded-[1.8rem] border border-line bg-white shadow-[0_18px_40px_rgba(20,57,171,0.08)]">
            <div className="grid grid-cols-[1.1fr_0.8fr_0.55fr_0.55fr] gap-4 border-b border-line px-5 py-4 text-xs font-semibold uppercase tracking-[0.12em] text-muted">
              <span>Producto</span>
              <span>Categoria</span>
              <span>Minimo</span>
              <span>Publicacion</span>
            </div>
            <div className="divide-y divide-line">
              {products.slice(0, 10).map((product) => (
                <div key={product.id} className="grid grid-cols-[1.1fr_0.8fr_0.55fr_0.55fr] gap-4 px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="relative size-14 overflow-hidden rounded-2xl border border-line bg-surface-soft">
                      {product.cover ? (
                        <Image src={product.cover} alt={product.name} fill sizes="56px" className="object-cover" />
                      ) : null}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-graphite">{product.name}</p>
                      <p className="text-sm text-muted">{product.code}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {product.categorySlugs.slice(0, 2).map((category) => (
                      <Badge key={`${product.id}-${category}`} variant="graphite">
                        {formatCategoryLabel(category)}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex items-center text-sm font-semibold text-graphite">{product.minOrderQty}</div>
                  <div className="flex items-center">
                    <span className="inline-flex items-center gap-2 rounded-full bg-[#eefaf4] px-3 py-1 text-xs font-semibold text-success">
                      <span className="status-dot bg-success" />
                      Publicado
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
