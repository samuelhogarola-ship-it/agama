"use client";

import React, { useEffect, useRef, useState } from "react";

import type { RenderModel } from "@/lib/configurator-types";

const CANVAS_WIDTH = 840;
const CANVAS_HEIGHT = 680;

type LoadedAssets = {
  baseImage: HTMLImageElement | null;
  maskImage: HTMLImageElement | null;
  logoImage: HTMLImageElement | null;
};

function loadImage(src: string | null | undefined) {
  if (!src) return Promise.resolve<HTMLImageElement | null>(null);

  return new Promise<HTMLImageElement | null>((resolve) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => {
      console.error("[configurator] Failed to load image", { src });
      resolve(null);
    };
    image.src = src;
  });
}

function hasMaskPixels(maskImage: HTMLImageElement | null) {
  if (!maskImage) return false;

  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, maskImage.naturalWidth || maskImage.width);
  canvas.height = Math.max(1, maskImage.naturalHeight || maskImage.height);
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return false;

  ctx.drawImage(maskImage, 0, 0, canvas.width, canvas.height);
  const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);

  for (let index = 3; index < data.length; index += 4) {
    if (data[index] > 8) {
      return true;
    }
  }

  return false;
}

function shouldShowMaskDebugOverlay() {
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).get("debugMask") === "1";
}

function logTintDebug(model: RenderModel, maskLoaded: boolean, maskHasPixels: boolean) {
  console.log("[configurator] tint debug", {
    selectedColor: model.selectedColor,
    selectedColorValidatedHex: model.selectedColor?.validatedHex ?? null,
    selectedColorHex: model.selectedColor?.hex ?? null,
    productId: model.product.id,
    productSupportsTint: model.product.supportsTint,
    productBaseImage: model.product.baseImage,
    productMaskImage: model.product.maskImage,
    tintHex: model.tintHex,
    tintEnabled: Boolean(model.tintHex && model.product.supportsTint && model.product.maskImage && maskLoaded && maskHasPixels),
    maskLoaded,
    maskHasPixels,
  });
}

function roundedRectPath(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

function drawBackground(ctx: CanvasRenderingContext2D) {
  const base = ctx.createLinearGradient(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  base.addColorStop(0, "#ffffff");
  base.addColorStop(0.5, "#f7f9fc");
  base.addColorStop(1, "#f0f3f8");
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
}

function applyMaterialFill(
  ctx: CanvasRenderingContext2D,
  _assets: LoadedAssets,
  model: RenderModel,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  if (model.tintHex) {
    const tint = ctx.createLinearGradient(x, y, x + width, y + height);
    tint.addColorStop(0, model.tintHex);
    tint.addColorStop(0.6, model.tintHex);
    tint.addColorStop(1, "rgba(255,255,255,0.18)");
    ctx.fillStyle = tint;
    ctx.fill();
    return;
  }

  const neutral = ctx.createLinearGradient(x, y, x + width, y + height);
  neutral.addColorStop(0, "#f3f7fc");
  neutral.addColorStop(0.5, "#d8e2ef");
  neutral.addColorStop(1, "#b6c6da");
  ctx.fillStyle = neutral;
  ctx.fill();
}

function drawEmbossLogo(ctx: CanvasRenderingContext2D, logoImage: HTMLImageElement | null, x: number, y: number, width: number, height: number) {
  if (!logoImage) return;

  ctx.save();
  ctx.globalAlpha = 0.1;
  ctx.filter = "blur(1px)";
  ctx.drawImage(logoImage, x - 1, y - 1, width, height);
  ctx.restore();

  ctx.save();
  ctx.globalAlpha = 0.06;
  ctx.drawImage(logoImage, x + 1, y + 1, width, height);
  ctx.restore();

  ctx.save();
  ctx.globalAlpha = 0.08;
  ctx.drawImage(logoImage, x, y, width, height);
  ctx.restore();
}

function drawBucket(ctx: CanvasRenderingContext2D, assets: LoadedAssets, model: RenderModel) {
  const cx = 420;
  const rimY = 155;
  const bottomY = 560;
  const rimRx = 200;
  const rimRy = 38;
  const bottomRx = 160;
  const bottomRy = 24;
  const lipH = 22;

  // floor shadow
  ctx.save();
  ctx.fillStyle = "rgba(39,60,103,0.14)";
  ctx.beginPath();
  ctx.ellipse(cx, bottomY + 32, bottomRx + 20, 22, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // bucket body
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(cx - rimRx, rimY);
  ctx.lineTo(cx - bottomRx, bottomY);
  ctx.bezierCurveTo(cx - bottomRx, bottomY + bottomRy, cx + bottomRx, bottomY + bottomRy, cx + bottomRx, bottomY);
  ctx.lineTo(cx + rimRx, rimY);
  ctx.closePath();
  applyMaterialFill(ctx, assets, model, cx - rimRx, rimY, rimRx * 2, bottomY - rimY);
  ctx.strokeStyle = "rgba(44,59,89,0.2)";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();

  // left highlight
  ctx.save();
  ctx.globalAlpha = 0.22;
  const hl = ctx.createLinearGradient(cx - rimRx, rimY, cx - rimRx + 80, bottomY);
  hl.addColorStop(0, "rgba(255,255,255,0.9)");
  hl.addColorStop(0.6, "rgba(255,255,255,0.3)");
  hl.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = hl;
  ctx.beginPath();
  ctx.moveTo(cx - rimRx + 10, rimY + 5);
  ctx.lineTo(cx - bottomRx + 10, bottomY - 5);
  ctx.lineTo(cx - bottomRx + 60, bottomY - 5);
  ctx.lineTo(cx - rimRx + 70, rimY + 5);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // right shadow
  ctx.save();
  ctx.globalAlpha = 0.12;
  const sh = ctx.createLinearGradient(cx + rimRx - 80, rimY, cx + rimRx, bottomY);
  sh.addColorStop(0, "rgba(0,0,0,0)");
  sh.addColorStop(0.4, "rgba(0,0,0,0.1)");
  sh.addColorStop(1, "rgba(0,0,0,0.3)");
  ctx.fillStyle = sh;
  ctx.beginPath();
  ctx.moveTo(cx + rimRx - 70, rimY + 5);
  ctx.lineTo(cx + bottomRx - 50, bottomY - 5);
  ctx.lineTo(cx + bottomRx, bottomY - 5);
  ctx.lineTo(cx + rimRx, rimY + 5);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // horizontal ribs
  const ribYs = [rimY + 60, rimY + 110, rimY + 160];
  for (const ry of ribYs) {
    const t = (ry - rimY) / (bottomY - rimY);
    const rx = rimRx + (bottomRx - rimRx) * t;
    ctx.save();
    ctx.strokeStyle = "rgba(255,255,255,0.18)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx - rx + 6, ry);
    ctx.lineTo(cx + rx - 6, ry);
    ctx.stroke();
    ctx.strokeStyle = "rgba(0,0,0,0.06)";
    ctx.beginPath();
    ctx.moveTo(cx - rx + 6, ry + 3);
    ctx.lineTo(cx + rx - 6, ry + 3);
    ctx.stroke();
    ctx.restore();
  }

  // lip/rim
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(cx, rimY, rimRx + 8, rimRy + 4, 0, 0, Math.PI * 2);
  if (model.tintHex) {
    ctx.fillStyle = model.tintHex;
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.3)";
    ctx.fill();
  } else {
    ctx.fillStyle = "#e4eaf3";
    ctx.fill();
  }
  ctx.strokeStyle = "rgba(44,59,89,0.2)";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();

  // lip inner
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(cx, rimY, rimRx - 10, rimRy - 8, 0, 0, Math.PI * 2);
  if (model.tintHex) {
    ctx.fillStyle = model.tintHex;
    ctx.fill();
    ctx.fillStyle = "rgba(0,0,0,0.08)";
    ctx.fill();
  } else {
    ctx.fillStyle = "#cdd6e4";
    ctx.fill();
  }
  ctx.restore();

  // lip top highlight
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(cx, rimY - 2, rimRx - 4, rimRy - 4, 0, Math.PI, Math.PI * 2);
  ctx.fillStyle = "rgba(255,255,255,0.25)";
  ctx.fill();
  ctx.restore();

  // wire handle
  ctx.save();
  ctx.strokeStyle = "rgba(44,59,89,0.5)";
  ctx.lineWidth = 5;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(cx - rimRx + 20, rimY - lipH);
  ctx.quadraticCurveTo(cx, rimY - 140, cx + rimRx - 20, rimY - lipH);
  ctx.stroke();
  ctx.strokeStyle = "rgba(255,255,255,0.3)";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();

  // handle pivot dots
  for (const px of [cx - rimRx + 20, cx + rimRx - 20]) {
    ctx.save();
    ctx.fillStyle = "rgba(44,59,89,0.4)";
    ctx.beginPath();
    ctx.arc(px, rimY - lipH, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // emboss logo (icon only, small and subtle)
  drawEmbossLogo(ctx, assets.logoImage, cx - 50, 340, 100, 68);
}

function drawLid(ctx: CanvasRenderingContext2D, assets: LoadedAssets, model: RenderModel) {
  ctx.save();
  ctx.fillStyle = "rgba(39,60,103,0.12)";
  ctx.beginPath();
  ctx.ellipse(420, 540, 240, 30, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.beginPath();
  ctx.ellipse(420, 330, 264, 130, 0, 0, Math.PI * 2);
  applyMaterialFill(ctx, assets, model, 156, 198, 528, 264);
  ctx.restore();

  ctx.strokeStyle = "rgba(44,59,89,0.28)";
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.beginPath();
  ctx.ellipse(420, 316, 196, 70, 0, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255,255,255,0.28)";
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.36)";
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.beginPath();
  roundedRectPath(ctx, 386, 224, 68, 56, 18);
  ctx.fillStyle = "rgba(255,255,255,0.22)";
  ctx.fill();
  ctx.strokeStyle = "rgba(44,59,89,0.24)";
  ctx.stroke();

  drawEmbossLogo(ctx, assets.logoImage, 302, 316, 236, 80);
}

function drawBottle(ctx: CanvasRenderingContext2D, assets: LoadedAssets, model: RenderModel) {
  ctx.save();
  ctx.fillStyle = "rgba(39,60,103,0.12)";
  ctx.beginPath();
  ctx.ellipse(420, 616, 104, 20, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.beginPath();
  ctx.moveTo(382, 110);
  ctx.lineTo(458, 110);
  ctx.lineTo(458, 148);
  ctx.lineTo(510, 186);
  ctx.lineTo(510, 480);
  ctx.bezierCurveTo(510, 564, 472, 606, 420, 606);
  ctx.bezierCurveTo(368, 606, 330, 564, 330, 480);
  ctx.lineTo(330, 186);
  ctx.lineTo(382, 148);
  ctx.closePath();
  applyMaterialFill(ctx, assets, model, 330, 110, 180, 496);
  ctx.strokeStyle = "rgba(44,59,89,0.28)";
  ctx.lineWidth = 3;
  ctx.stroke();

  roundedRectPath(ctx, 390, 78, 60, 32, 10);
  ctx.fillStyle = "rgba(255,255,255,0.18)";
  ctx.fill();
  ctx.stroke();

  drawEmbossLogo(ctx, assets.logoImage, 350, 300, 140, 58);
}

function drawCup(ctx: CanvasRenderingContext2D, assets: LoadedAssets, model: RenderModel) {
  ctx.save();
  ctx.fillStyle = "rgba(39,60,103,0.12)";
  ctx.beginPath();
  ctx.ellipse(420, 610, 110, 20, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.beginPath();
  ctx.moveTo(310, 170);
  ctx.lineTo(530, 170);
  ctx.lineTo(506, 510);
  ctx.bezierCurveTo(500, 566, 468, 600, 420, 600);
  ctx.bezierCurveTo(372, 600, 340, 566, 334, 510);
  ctx.closePath();
  applyMaterialFill(ctx, assets, model, 310, 170, 220, 430);
  ctx.strokeStyle = "rgba(44,59,89,0.26)";
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.beginPath();
  ctx.ellipse(420, 170, 112, 24, 0, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255,255,255,0.24)";
  ctx.fill();
  ctx.stroke();

  drawEmbossLogo(ctx, assets.logoImage, 346, 320, 148, 56);
}

function drawChair(ctx: CanvasRenderingContext2D, assets: LoadedAssets, model: RenderModel) {
  ctx.save();
  ctx.fillStyle = "rgba(39,60,103,0.1)";
  ctx.beginPath();
  ctx.ellipse(420, 618, 160, 18, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  roundedRectPath(ctx, 306, 110, 228, 172, 50);
  applyMaterialFill(ctx, assets, model, 306, 110, 228, 172);
  ctx.strokeStyle = "rgba(44,59,89,0.28)";
  ctx.lineWidth = 3;
  ctx.stroke();

  roundedRectPath(ctx, 282, 296, 276, 54, 26);
  ctx.fillStyle = "rgba(255,255,255,0.28)";
  ctx.fill();
  ctx.stroke();

  const legs: [string, string, string, string][] = [["316", "350", "274", "580"], ["524", "350", "566", "580"], ["370", "350", "344", "576"], ["470", "350", "496", "576"]];
  legs.forEach(([x1, y1, x2, y2], index) => {
    ctx.beginPath();
    ctx.moveTo(Number(x1), Number(y1));
    ctx.lineTo(Number(x2), Number(y2));
    ctx.strokeStyle = index < 2 ? "rgba(52,64,86,0.85)" : "rgba(72,82,104,0.82)";
    ctx.lineWidth = index < 2 ? 14 : 10;
    ctx.lineCap = "round";
    ctx.stroke();
  });

  drawEmbossLogo(ctx, assets.logoImage, 342, 156, 156, 56);
}


function drawReferenceCutout(
  ctx: CanvasRenderingContext2D,
  baseImage: HTMLImageElement,
  maskImage: HTMLImageElement | null,
  tintHex: string | null,
  supportsTint: boolean,
  showMaskDebugOverlay: boolean,
) {
  const scale = Math.min(620 / baseImage.width, 560 / baseImage.height);
  const drawWidth = baseImage.width * scale;
  const drawHeight = baseImage.height * scale;
  const x = (CANVAS_WIDTH - drawWidth) / 2;
  const y = (CANVAS_HEIGHT - drawHeight) / 2 + 10;

  ctx.save();
  ctx.fillStyle = "rgba(39,60,103,0.12)";
  ctx.beginPath();
  ctx.ellipse(CANVAS_WIDTH / 2, y + drawHeight + 18, drawWidth * 0.34, 22, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  const buffer = document.createElement("canvas");
  buffer.width = Math.max(1, Math.round(drawWidth));
  buffer.height = Math.max(1, Math.round(drawHeight));
  const bufferCtx = buffer.getContext("2d");

  if (!bufferCtx) {
    ctx.drawImage(baseImage, x, y, drawWidth, drawHeight);
    return;
  }

  bufferCtx.clearRect(0, 0, buffer.width, buffer.height);
  bufferCtx.drawImage(baseImage, 0, 0, buffer.width, buffer.height);
  bufferCtx.globalCompositeOperation = "screen";
  bufferCtx.fillStyle = "rgba(255,255,255,0.18)";
  bufferCtx.fillRect(0, 0, buffer.width, buffer.height);
  bufferCtx.globalCompositeOperation = "source-over";
  bufferCtx.filter = "grayscale(1) brightness(1.02) contrast(1.12) saturate(0.2)";
  bufferCtx.drawImage(buffer, 0, 0, buffer.width, buffer.height);
  bufferCtx.filter = "none";

  bufferCtx.globalCompositeOperation = "multiply";
  const sculptShadow = bufferCtx.createLinearGradient(0, 0, buffer.width, buffer.height);
  sculptShadow.addColorStop(0, "rgba(192,203,219,0.08)");
  sculptShadow.addColorStop(0.52, "rgba(150,166,190,0.1)");
  sculptShadow.addColorStop(1, "rgba(102,120,152,0.22)");
  bufferCtx.fillStyle = sculptShadow;
  bufferCtx.fillRect(0, 0, buffer.width, buffer.height);

  bufferCtx.globalCompositeOperation = "screen";
  const crispHighlight = bufferCtx.createLinearGradient(0, 0, buffer.width * 0.72, buffer.height);
  crispHighlight.addColorStop(0, "rgba(255,255,255,0.34)");
  crispHighlight.addColorStop(0.3, "rgba(255,255,255,0.16)");
  crispHighlight.addColorStop(1, "rgba(255,255,255,0)");
  bufferCtx.fillStyle = crispHighlight;
  bufferCtx.fillRect(0, 0, buffer.width, buffer.height);

  if (tintHex && supportsTint && maskImage) {
    const tintLayer = document.createElement("canvas");
    tintLayer.width = buffer.width;
    tintLayer.height = buffer.height;
    const tintCtx = tintLayer.getContext("2d");

    if (tintCtx) {
      tintCtx.drawImage(maskImage, 0, 0, tintLayer.width, tintLayer.height);
      tintCtx.globalCompositeOperation = "source-in";
      const tint = tintCtx.createLinearGradient(0, 0, tintLayer.width, tintLayer.height);
      tint.addColorStop(0, tintHex);
      tint.addColorStop(0.68, tintHex);
      tint.addColorStop(1, "#f6f9ff");
      tintCtx.fillStyle = tint;
      tintCtx.fillRect(0, 0, tintLayer.width, tintLayer.height);

      tintCtx.globalCompositeOperation = "soft-light";
      tintCtx.fillStyle = "rgba(255,255,255,0.2)";
      tintCtx.fillRect(0, 0, tintLayer.width, tintLayer.height);

      bufferCtx.globalCompositeOperation = "multiply";
      bufferCtx.drawImage(tintLayer, 0, 0, buffer.width, buffer.height);

      bufferCtx.globalCompositeOperation = "screen";
      const gloss = bufferCtx.createLinearGradient(0, 0, buffer.width, buffer.height);
      gloss.addColorStop(0, "rgba(255,255,255,0.18)");
      gloss.addColorStop(1, "rgba(255,255,255,0)");
      bufferCtx.fillStyle = gloss;
      bufferCtx.fillRect(0, 0, buffer.width, buffer.height);

      if (showMaskDebugOverlay) {
        const debugLayer = document.createElement("canvas");
        debugLayer.width = buffer.width;
        debugLayer.height = buffer.height;
        const debugCtx = debugLayer.getContext("2d");

        if (debugCtx) {
          debugCtx.drawImage(maskImage, 0, 0, debugLayer.width, debugLayer.height);
          debugCtx.globalCompositeOperation = "source-in";
          debugCtx.fillStyle = "rgba(255,0,0,0.26)";
          debugCtx.fillRect(0, 0, debugLayer.width, debugLayer.height);
          bufferCtx.globalCompositeOperation = "source-over";
          bufferCtx.drawImage(debugLayer, 0, 0, buffer.width, buffer.height);
        }
      }
    }
  }

  // Clip to product silhouette: removes grey/white background from the base
  // photo so the canvas gradient shows through. Works for any product with an
  // RGBA mask (alpha=255 = tint zone, alpha=0 = background).
  if (maskImage) {
    bufferCtx.globalCompositeOperation = "destination-in";
    bufferCtx.drawImage(maskImage, 0, 0, buffer.width, buffer.height);
  }

  bufferCtx.globalCompositeOperation = "source-over";
  ctx.drawImage(buffer, x, y, drawWidth, drawHeight);
}

function drawProduct(ctx: CanvasRenderingContext2D, assets: LoadedAssets, model: RenderModel) {
  if (model.asset.kind === "png-cutout" && assets.baseImage) {
    drawReferenceCutout(
      ctx,
      assets.baseImage,
      assets.maskImage,
      model.tintHex,
      model.product.supportsTint,
      shouldShowMaskDebugOverlay(),
    );
    return;
  }
  switch (model.product.id) {
    case "bucket":
      drawBucket(ctx, assets, model);
      break;
    case "lid":
      drawLid(ctx, assets, model);
      break;
    case "bottle":
      drawBottle(ctx, assets, model);
      break;
    case "cup":
      drawCup(ctx, assets, model);
      break;
    case "chair":
      drawChair(ctx, assets, model);
      break;
  }
}

export const CanvasProductRenderer = React.memo(
  React.forwardRef<HTMLCanvasElement, { model: RenderModel }>(function CanvasProductRenderer({ model }, forwardedRef) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const [tintError, setTintError] = useState<string | null>(null);

    useEffect(() => {
      let mounted = true;

      async function paint() {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const [baseImage, maskImage, logoImage] = await Promise.all([
          loadImage(model.product.baseImage ?? model.asset.source),
          loadImage(model.product.maskImage),
          loadImage(model.embossLogoSrc),
        ]);

        if (!mounted) return;

        ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        drawBackground(ctx);
        const maskLoaded = Boolean(maskImage);
        const maskNonEmpty = hasMaskPixels(maskImage);
        logTintDebug(model, maskLoaded, maskNonEmpty);

        if (model.product.supportsTint && !maskLoaded) {
          console.error("[configurator] Tint blocked: mask image failed to load", {
            productId: model.product.id,
            maskImage: model.product.maskImage,
          });
          setTintError("No se pudo cargar la máscara de tintado");
        } else if (model.product.supportsTint && maskLoaded && !maskNonEmpty) {
          console.error("[configurator] Tint blocked: mask image is empty", {
            productId: model.product.id,
            maskImage: model.product.maskImage,
          });
          setTintError("La máscara de tintado está vacía");
        } else {
          setTintError(null);
        }

        if (model.tintHex && model.product.supportsTint && model.product.maskImage && maskLoaded && maskNonEmpty) {
          console.log("[configurator] Tint branch enabled", {
            productId: model.product.id,
            tintHex: model.tintHex,
          });
        } else {
          console.warn("[configurator] Tint branch blocked", {
            productId: model.product.id,
            tintHex: model.tintHex,
            supportsTint: model.product.supportsTint,
            maskImage: model.product.maskImage,
            maskLoaded,
            maskNonEmpty,
          });
        }

        drawProduct(ctx, { baseImage, maskImage, logoImage }, model);
      }

      paint();

      return () => {
        mounted = false;
      };
    }, [model]);

    return (
      <div className="mx-auto aspect-[5/4] w-full min-w-0 max-w-[min(480px,100%)] overflow-hidden">
        <canvas
          ref={(node) => {
            canvasRef.current = node;
            if (typeof forwardedRef === "function") {
              forwardedRef(node);
            } else if (forwardedRef != null) {
              (forwardedRef as React.MutableRefObject<HTMLCanvasElement | null>).current = node;
            }
          }}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="block h-full w-full max-w-full"
          role="img"
          aria-label={`${model.product.name} renderizado en canvas`}
        />
        {process.env.NODE_ENV === "development" && tintError ? (
          <p className="mt-1 rounded-lg border border-yellow-200 bg-yellow-50 px-3 py-1.5 text-xs text-yellow-700">
            ⚠ Tint error: {tintError}
          </p>
        ) : null}
      </div>
    );
  }),
);

export function MiniProductCanvas({ model }: { model: RenderModel }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    let mounted = true;

    async function paint() {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const [baseImage, maskImage, logoImage] = await Promise.all([
        loadImage(model.product.baseImage ?? model.asset.source),
        loadImage(model.product.maskImage),
        loadImage(model.embossLogoSrc),
      ]);
      if (!mounted) return;

      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      drawBackground(ctx);
      drawProduct(ctx, { baseImage, maskImage, logoImage }, model);
    }

    paint();
    return () => { mounted = false; };
  }, [model]);

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_WIDTH}
      height={CANVAS_HEIGHT}
      className="h-full w-full"
      aria-label={`${model.product.name} miniatura`}
    />
  );
}
