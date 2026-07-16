import { PendingColorState } from "@/components/configurator/pending-color-state";
import { ProductGlyph } from "@/components/configurator/product-glyph";
import { ProductPreview } from "@/components/configurator/product-preview";
import { cn } from "@/lib/utils";
import type { RenderModel } from "@/lib/configurator-types";

function getActiveColor(model: RenderModel) {
  return model.selectedColor;
}

export function ProductCanvas({
  model,
  isDragActive = false,
  draggedSwatchAssetUrl = null,
  splash,
  onColorDrop,
  onCanvasDragEnter,
  onCanvasDragLeave,
}: {
  model: RenderModel;
  isDragActive?: boolean;
  draggedSwatchAssetUrl?: string | null;
  splash?: { key: number; x: number; y: number; swatchAssetUrl: string | null } | null;
  onColorDrop?: (code: string, event: React.DragEvent<HTMLDivElement>) => void;
  onCanvasDragEnter?: () => void;
  onCanvasDragLeave?: () => void;
}) {
  const activeColor = getActiveColor(model);

  return (
    <section className="studio-panel overflow-hidden rounded-[1.2rem] p-4">
      <div className="flex justify-end">
        <div className="flex overflow-hidden rounded-[0.9rem] border border-line bg-white shadow-sm">
          <button type="button" className="flex h-12 w-14 items-center justify-center border-r border-line text-brand">
            ⬡
          </button>
          <button type="button" className="flex h-12 w-14 items-center justify-center text-muted">
            ⬚
          </button>
        </div>
      </div>

      <div
        className={cn(
          "relative rounded-[1rem] bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.6),_rgba(235,242,252,0.95)_55%,_rgba(225,236,250,1)_100%)] p-4 transition",
          isDragActive && "ring-2 ring-brand/30 shadow-[inset_0_0_0_1px_rgba(20,57,171,0.08)]",
        )}
        onDragEnter={() => onCanvasDragEnter?.()}
        onDragOver={(event) => {
          event.preventDefault();
          event.dataTransfer.dropEffect = "copy";
          onCanvasDragEnter?.();
        }}
        onDrop={(event) => {
          const colorCode = event.dataTransfer.getData("text/agama-color-code") || event.dataTransfer.getData("text/plain");
          if (!colorCode) return;
          event.preventDefault();
          onColorDrop?.(colorCode, event);
        }}
        onDragLeave={() => onCanvasDragLeave?.()}
      >
        {isDragActive ? (
          <div className="pointer-events-none absolute inset-x-6 top-5 rounded-full border border-dashed border-brand/30 bg-white/70 px-4 py-2 text-center text-sm font-medium text-brand backdrop-blur">
            Suelta el color sobre el producto
          </div>
        ) : null}
        {splash ? (
          <div key={splash.key} className="pointer-events-none absolute inset-0 overflow-hidden rounded-[1rem]">
            <div
              className="splash-ring absolute h-56 w-56 rounded-full border-8 border-white/75"
              style={{ left: `${splash.x}px`, top: `${splash.y}px` }}
            />
            <div
              className="splash-ring absolute h-36 w-36 rounded-full border-4 border-brand/25"
              style={{ left: `${splash.x}px`, top: `${splash.y}px`, animationDelay: "80ms" }}
            />
            <div
              className="splash-core absolute h-24 w-24 overflow-hidden rounded-full border border-white/80 shadow-[0_12px_30px_rgba(20,57,171,0.18)]"
              style={{
                left: `${splash.x}px`,
                top: `${splash.y}px`,
                backgroundImage: splash.swatchAssetUrl ? `url(${splash.swatchAssetUrl})` : undefined,
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundColor: splash.swatchAssetUrl ? undefined : "#eff4ff",
              }}
            />
          </div>
        ) : null}
        {isDragActive && draggedSwatchAssetUrl ? (
          <div
            className="pointer-events-none absolute right-5 top-5 h-12 w-12 rounded-full border-2 border-white bg-white shadow-[0_12px_28px_rgba(20,57,171,0.2)]"
            style={{
              backgroundImage: `url(${draggedSwatchAssetUrl})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
        ) : null}
        <ProductPreview model={model} />
      </div>

      <div className="mx-auto mt-4 max-w-[540px] rounded-[1rem] border border-line bg-white p-4 shadow-[0_12px_30px_rgba(20,57,171,0.06)]">
        <div className="grid items-center gap-4 md:grid-cols-[1.2fr_0.8fr_1fr]">
          <div className="flex items-center gap-3 border-line md:border-r md:pr-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-soft">
              <ProductGlyph productId={model.product.id} className="h-9 w-9" />
            </div>
            <div>
              <p className="text-lg font-semibold text-graphite">{model.product.name}</p>
            </div>
          </div>
          <div className="border-line md:border-r md:px-4">
            <p className="text-xl font-bold text-graphite">{activeColor?.code ?? "Sin color"}</p>
            <p className="text-sm text-muted">Codigo</p>
          </div>
          <div className="flex items-center gap-3 md:pl-4">
            <div
              className="h-8 w-8 rounded-full border border-line"
              style={
                activeColor?.hex
                  ? { backgroundColor: activeColor.hex }
                  : activeColor?.swatchAssetUrl
                  ? { backgroundImage: `url(${activeColor.swatchAssetUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
                  : undefined
              }
            />
            <div>
              <p className="text-lg font-semibold text-graphite">{activeColor?.name ?? "Sin seleccionar"}</p>
              <p className="text-sm text-muted">Nombre</p>
            </div>
          </div>
        </div>
      </div>

      {model.showPendingState ? (
        <div className="mt-4">
          <PendingColorState color={activeColor} line={activeColor?.line ?? null} />
        </div>
      ) : null}

      {model.showRenderPending ? (
        <div className="mt-4 rounded-[1rem] border border-dashed border-line bg-white p-4 text-sm text-muted">
          Render pendiente. Se muestra la cubeta base hasta que exista su imagen fija por color.
        </div>
      ) : null}
    </section>
  );
}
