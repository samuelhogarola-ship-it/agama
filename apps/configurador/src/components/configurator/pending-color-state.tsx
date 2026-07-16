import Image from "next/image";

import { Badge } from "@/components/ui/badge";
import type { RenderColorSlot } from "@/lib/configurator-types";

export function PendingColorState({
  color,
  line,
}: {
  color: RenderColorSlot | null;
  line: string | null;
}) {
  if (!color) return null;

  return (
    <div className="rounded-[1rem] border border-dashed border-line bg-white p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="warning">Pendiente de validacion</Badge>
        {line ? <Badge variant="graphite">{line}</Badge> : null}
      </div>
      <p className="mt-3 text-sm leading-6 text-muted">
        {color.code} aun no tiene un HEX confirmado, asi que el producto permanece neutro en esta
        fase.
      </p>

      {color.swatchAssetUrl ? (
        <div className="mt-4 flex items-center gap-4 rounded-[1.2rem] border border-line bg-surface-soft p-3">
          <Image
            src={color.swatchAssetUrl}
            alt={`Referencia real de ${color.code}`}
            width={64}
            height={64}
            sizes="64px"
            className="rounded-[1rem] border border-line object-cover"
          />
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-brand">
              Muestra real localizada
            </p>
            <p className="mt-1 truncate text-sm font-semibold text-graphite">{color.name}</p>
            <p className="text-sm text-muted">Se muestra como referencia, no como tinte validado.</p>
          </div>
        </div>
      ) : (
        <p className="mt-4 text-sm text-muted">No hay muestra visual localizable para este color.</p>
      )}
    </div>
  );
}
