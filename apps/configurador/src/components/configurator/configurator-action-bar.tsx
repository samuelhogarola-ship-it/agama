import { Download, Link2, Plus, Scale, Share2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { ConfiguratorActiveSlot } from "@/lib/configurator-types";

export function ConfiguratorActionBar({
  compareEnabled,
  activeSlot,
  onToggleCompare,
  onShare,
  shareUrl,
  exportAvailable,
  exportReason,
}: {
  compareEnabled: boolean;
  activeSlot: ConfiguratorActiveSlot;
  onToggleCompare: () => void;
  onShare: () => void;
  shareUrl: string;
  exportAvailable: boolean;
  exportReason: string;
}) {
  return (
    <section className="studio-panel sticky bottom-3 z-20 rounded-[1.2rem] p-3">
      <div className="grid gap-3 xl:grid-cols-[1.3fr_0.9fr_0.9fr_1.6fr]">
        <div className="rounded-[1rem] border border-line bg-white p-4">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-[0.9rem] bg-brand text-white">
              <Scale className="size-7" />
            </div>
            <div>
              <p className="text-[1.05rem] font-semibold text-graphite">Comparar colores</p>
              <p className="mt-1 text-sm text-muted">Selecciona hasta 2 colores</p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onToggleCompare}
          className="rounded-[1rem] border border-dashed border-line bg-white p-4 text-left transition hover:border-brand"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-line text-brand">
              <Plus className="size-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-graphite">{compareEnabled ? `Slot ${activeSlot.toUpperCase()}` : "Agregar color"}</p>
              <p className="text-sm text-muted">{compareEnabled ? "Comparacion activa" : "Comparacion A/B"}</p>
            </div>
          </div>
        </button>

        <Button
          variant="secondary"
          disabled={!exportAvailable}
          title={exportReason}
          className="h-auto justify-start rounded-[1rem] border border-line bg-white px-5 py-4 text-brand hover:text-brand"
        >
          <Download className="size-5" />
          Descargar PNG
        </Button>

        <div className="grid gap-3 sm:grid-cols-[0.9fr_1.4fr]">
          <Button
            variant="secondary"
            onClick={onShare}
            className="h-auto justify-start rounded-[1rem] border border-line bg-white px-5 py-4 text-brand hover:text-brand"
          >
            <Share2 className="size-5" />
            Compartir configuracion
          </Button>

          <div className="flex items-center gap-3 rounded-[1rem] border border-line bg-white px-4 py-4">
            <Link2 className="size-5 shrink-0 text-brand" />
            <p className="min-w-0 truncate text-sm text-muted">{shareUrl}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
