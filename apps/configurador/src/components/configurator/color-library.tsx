"use client";

import { Search } from "lucide-react";

import { ColorCard } from "@/components/configurator/color-card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { AgamaColor, AgamaColorFamily } from "@/lib/configurator-types";

export function ColorLibrary({
  query,
  onQueryChange,
  families,
  activeFamily,
  onFamilyChange,
  colors,
  primaryColorCode,
  compareColorCode,
  onSelectColor,
  onDragColorStart,
  onDragColorEnd,
}: {
  query: string;
  onQueryChange: (value: string) => void;
  families: AgamaColorFamily[];
  activeFamily: AgamaColorFamily | "all";
  onFamilyChange: (family: AgamaColorFamily | "all") => void;
  colors: AgamaColor[];
  primaryColorCode: string | null;
  compareColorCode: string | null;
  onSelectColor: (code: string) => void;
  onDragColorStart?: (color: AgamaColor) => void;
  onDragColorEnd?: () => void;
}) {
  return (
    <section className="studio-panel rounded-[1.2rem] p-5">
      <div>
        <h2 className="text-[1.05rem] font-bold tracking-[-0.03em] text-graphite">Biblioteca de colores</h2>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted" />
        <Input
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          className="pl-11"
          placeholder="Buscar por codigo o nombre"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onFamilyChange("all")}
          className={cn(
            "rounded-full border px-3 py-2 text-xs font-medium transition",
            activeFamily === "all"
              ? "border-[#e52a8d] bg-[#e52a8d] text-white"
              : "border-line bg-white text-muted hover:border-brand hover:text-brand",
          )}
        >
          Todos
        </button>
        {families.map((family) => (
          <button
            key={family}
            type="button"
            onClick={() => onFamilyChange(family)}
            className={cn(
              "rounded-full border px-3 py-2 text-xs font-medium transition",
              activeFamily === family
                ? "border-[#e52a8d] bg-[#e52a8d] text-white"
                : "border-line bg-white text-muted hover:border-brand hover:text-brand",
            )}
          >
            {family}
          </button>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-line pt-3">
        <p className="text-sm text-muted">{colors.length} colores encontrados</p>
        <div className="rounded-xl border border-line bg-white px-3 py-2 text-sm text-muted">Mas recientes</div>
      </div>

      <div className="mt-3 grid max-h-[470px] grid-cols-3 gap-3 overflow-y-auto pr-1">
        {colors.map((color) => (
          <ColorCard
            key={color.code}
            color={color}
            isPrimarySelected={primaryColorCode === color.code}
            isCompareSelected={compareColorCode === color.code}
            onSelect={onSelectColor}
            onDragStart={onDragColorStart}
            onDragEnd={onDragColorEnd}
          />
        ))}
      </div>

      <button
        type="button"
        className="mt-4 flex w-full items-center justify-between rounded-[1rem] border border-line bg-white px-4 py-4 text-left"
      >
        <span className="text-base font-medium text-graphite">Filtros avanzados</span>
        <span className="text-xl text-muted">›</span>
      </button>
    </section>
  );
}
