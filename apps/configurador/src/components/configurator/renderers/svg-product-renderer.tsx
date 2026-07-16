import { BucketPlaceholder } from "@/components/configurator/renderers/placeholders/bucket-placeholder";
import { BottlePlaceholder } from "@/components/configurator/renderers/placeholders/bottle-placeholder";
import { ChairPlaceholder } from "@/components/configurator/renderers/placeholders/chair-placeholder";
import { ContainerPlaceholder } from "@/components/configurator/renderers/placeholders/container-placeholder";
import { CupPlaceholder } from "@/components/configurator/renderers/placeholders/cup-placeholder";
import { LidPlaceholder } from "@/components/configurator/renderers/placeholders/lid-placeholder";
import type { RenderModel } from "@/lib/configurator-types";

function getPalette(tintHex: string | null) {
  if (!tintHex) {
    return {
      fill: "url(#agamaNeutralBody)",
      stroke: "#7d8ea9",
      detail: "url(#agamaNeutralDetail)",
      highlight: "rgba(255,255,255,0.82)",
      shadow: "rgba(22, 36, 67, 0.22)",
    };
  }

  return {
    fill: tintHex,
    stroke: "rgba(29, 36, 53, 0.28)",
    detail: "rgba(255, 255, 255, 0.22)",
    highlight: "rgba(255, 255, 255, 0.62)",
    shadow: "rgba(22, 36, 67, 0.22)",
  };
}

export function SvgProductRenderer({ model }: { model: RenderModel }) {
  const palette = getPalette(model.tintHex);
  const productFill = palette.fill;

  return (
    <div className="mx-auto aspect-[5/4] w-full max-w-[540px]">
      <svg
        viewBox="0 0 420 340"
        className="h-full w-full"
        role="img"
        aria-label={`${model.product.name} placeholder temporal de AGAMA`}
      >
        <defs>
          <linearGradient id="canvasBg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="60%" stopColor="#eef4ff" />
            <stop offset="100%" stopColor="#e3ecff" />
          </linearGradient>
          <linearGradient id="agamaNeutralBody" x1="10%" y1="0%" x2="90%" y2="100%">
            <stop offset="0%" stopColor="#f4f7fb" />
            <stop offset="45%" stopColor="#d5deeb" />
            <stop offset="100%" stopColor="#b8c6da" />
          </linearGradient>
          <linearGradient id="agamaNeutralDetail" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#edf3fb" />
            <stop offset="100%" stopColor="#b7c7dc" />
          </linearGradient>
        </defs>

        <rect x="0" y="0" width="420" height="340" rx="44" fill="url(#canvasBg)" />

        {model.product.id === "bucket" ? <BucketPlaceholder {...palette} fill={productFill} /> : null}
        {model.product.id === "lid" ? <LidPlaceholder {...palette} fill={productFill} /> : null}
        {model.product.id === "bottle" ? <BottlePlaceholder {...palette} fill={productFill} /> : null}
        {model.product.id === "cup" ? <CupPlaceholder {...palette} fill={productFill} /> : null}
        {model.product.id === "chair" ? <ChairPlaceholder {...palette} fill={productFill} /> : null}
        {model.product.id === "container" ? <ContainerPlaceholder {...palette} fill={productFill} /> : null}
      </svg>
    </div>
  );
}
