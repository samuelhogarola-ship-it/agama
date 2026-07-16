"use client";

import Image from "next/image";

import { CanvasProductRenderer } from "@/components/configurator/renderers/canvas-product-renderer";
import { cn } from "@/lib/utils";
import type { RenderModel } from "@/lib/configurator-types";

export function ProductPreview({
  model,
  className,
}: {
  model: RenderModel;
  className?: string;
}) {
  if (model.product.id === "bucket" && model.previewImageUrl) {
    return (
      <div className={cn("mx-auto aspect-[5/4] w-full max-w-[540px]", className)}>
        <div className="relative h-full w-full">
          <Image
            key={model.previewImageUrl}
            src={model.previewImageUrl}
            alt={`${model.product.name} ${model.selectedColor?.code ?? "base"}`}
            fill
            sizes="(max-width: 768px) 360px, 540px"
            className="object-contain"
            priority
            unoptimized
          />
        </div>
      </div>
    );
  }

  return <CanvasProductRenderer model={model} />;
}
