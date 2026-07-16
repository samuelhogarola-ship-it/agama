import Image from "next/image";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { AgamaColor } from "@/lib/configurator-types";

export function ColorCard({
  color,
  isPrimarySelected,
  isCompareSelected,
  onSelect,
  onDragStart,
  onDragEnd,
}: {
  color: AgamaColor;
  isPrimarySelected: boolean;
  isCompareSelected: boolean;
  onSelect: (code: string) => void;
  onDragStart?: (color: AgamaColor) => void;
  onDragEnd?: () => void;
}) {
  const isSelected = isPrimarySelected || isCompareSelected;

  return (
    <button
      type="button"
      draggable
      onClick={() => onSelect(color.code)}
      onDragStart={(event) => {
        event.dataTransfer.effectAllowed = "copy";
        event.dataTransfer.setData("text/agama-color-code", color.code);
        event.dataTransfer.setData("text/plain", color.code);
        onDragStart?.(color);
      }}
      onDragEnd={() => onDragEnd?.()}
      className={cn(
        "relative w-full rounded-[1rem] border bg-white p-3 text-center transition",
        isSelected
          ? "border-[#e52a8d] shadow-[0_12px_24px_rgba(229,42,141,0.12)]"
          : "border-line hover:border-brand/45 hover:shadow-[0_12px_22px_rgba(20,57,171,0.08)]",
      )}
    >
      {isSelected ? (
        <div className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-[#e52a8d] text-xs font-bold text-white">
          ✓
        </div>
      ) : null}
      <div>
        <div className="relative mx-auto size-13 overflow-hidden rounded-full border border-line bg-surface-soft">
          {color.hex ? (
            <div className="h-full w-full" style={{ backgroundColor: color.hex }} />
          ) : color.swatchAssetUrl ? (
            <Image
              src={color.swatchAssetUrl}
              alt={`Muestra real de ${color.code}`}
              fill
              sizes="52px"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">
              Pend.
            </div>
          )}
        </div>

        <p className="mt-3 text-sm font-bold text-graphite">{color.code}</p>
        <p className="mt-1 line-clamp-2 text-sm text-muted">{color.name}</p>
        {(isPrimarySelected || isCompareSelected) && (
          <div className="mt-2 flex items-center justify-center gap-1">
            {isPrimarySelected ? <Badge variant="brand">A</Badge> : null}
            {isCompareSelected ? <Badge variant="cyan">B</Badge> : null}
          </div>
        )}
      </div>
    </button>
  );
}
