import { ProductGlyph } from "@/components/configurator/product-glyph";
import { cn } from "@/lib/utils";
import type { AgamaConfiguratorProduct, AgamaConfiguratorProductId } from "@/lib/configurator-types";

export function ProductSelector({
  products,
  selectedProductId,
  onSelectProduct,
}: {
  products: AgamaConfiguratorProduct[];
  selectedProductId: AgamaConfiguratorProductId;
  onSelectProduct: (productId: AgamaConfiguratorProductId) => void;
}) {
  return (
    <section className="studio-panel rounded-[1.2rem] p-5">
      <div>
        <h2 className="text-[1.05rem] font-bold tracking-[-0.03em] text-graphite">Seleccionar producto</h2>
        <p className="mt-2 text-sm leading-6 text-muted">Elige el producto que deseas configurar.</p>
      </div>

      <div className="mt-4 space-y-4">
        {products.map((product) => (
          <button
            key={product.id}
            type="button"
            onClick={() => onSelectProduct(product.id)}
            className={cn(
              "w-full rounded-[1rem] border p-4 text-left transition",
              selectedProductId === product.id
                ? "border-[#2458e8] bg-white shadow-[0_16px_30px_rgba(36,88,232,0.12)]"
                : "border-line bg-white hover:border-brand/35",
            )}
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <ProductGlyph productId={product.id} className="h-16 w-16" />
                <div>
                  <p className="text-[1.05rem] font-semibold text-graphite">{product.name}</p>
                </div>
              </div>
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold",
                  selectedProductId === product.id ? "bg-[#2458e8] text-white" : "border border-line text-transparent",
                )}
              >
                ✓
              </div>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
