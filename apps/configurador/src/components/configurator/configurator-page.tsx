"use client";

import Image from "next/image";
import Link from "next/link";
import { Check, ChevronDown, Copy, Download, FileText, Layers, MessageCircle, Search, ShoppingCart, X } from "lucide-react";
import { startTransition, useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";

import { Logo } from "@/components/logo";
import { QuoteForm } from "@/components/configurator/quote-form";
import { CanvasProductRenderer, MiniProductCanvas } from "@/components/configurator/renderers/canvas-product-renderer";
import { type DemoConfiguratorColor } from "@/data/agama-configurator-demo";
import { AGAMA_BUCKET_BASE_RENDER, getAgamaProductRender, withRenderAssetVersion } from "@/data/agama-product-renders";
import { agamaConfiguratorProducts, getAgamaConfiguratorProduct } from "@/data/agama-products";
import { emitConfiguratorAnalyticsEvent } from "@/lib/configurator-analytics";
import { defaultProductRenderer } from "@/lib/configurator-renderer";
import type { AgamaConfiguratorProductId } from "@/lib/configurator-types";
import type { QuoteRequestItem } from "@/lib/quote-contract";
import { cn } from "@/lib/utils";

const PRODUCT_ID = "bucket";
const TINTABLE_PRODUCTS = agamaConfiguratorProducts.filter((p) => p.baseImage !== null);
const CHATBASE_BOT_ID = "syhmjssLBRg1bJZYYj3ag";
const SALES_PHONE = "525573515156";
const CART_STORAGE_KEY = "agama-configurador-cart-v1";
const CART_QUANTITY_OPTIONS = [1, 25, 50, 75, 100] as const;
const CUSTOM_QUANTITY_THRESHOLD = 100;
const CUSTOM_QUANTITY_STEP = 25;
const DEFAULT_PROCESS = "Extrusion";
const DEFAULT_MATERIAL = "PEAD";

const FAMILY_LABELS: Record<string, string> = {
  amarillos: "Amarillos",
  azules: "Azules",
  verdes: "Verdes",
  naranjas: "Naranjas",
  rojos: "Rojos",
  rosas: "Rosas",
  morados: "Morados",
  negros: "Negros",
  blancos: "Blancos",
  grises: "Grises",
  naturales: "Naturales",
  transparentes: "Transparentes",
  cafes: "Cafés",
  ambar: "Ámbar",
  metalicos: "Metálicos",
};

const FAMILY_ORDER = Object.keys(FAMILY_LABELS);

function subscribeNoop() {
  return () => {};
}

function getFocusableElements(container: HTMLElement) {
  return Array.from(
    container.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  ).filter((element) => !element.hasAttribute("aria-hidden"));
}

function normalizeSearchText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

type CartItem = {
  id: string;
  productId: "bucket" | "cup" | "chair";
  colorCode: string;
  colorName: string;
  process: string;
  material: string;
  quantityKg: number;
  pricePerKgMxn: number | null;
};

function buildSharePath(colorCode?: string | null) {
  if (!colorCode) {
    return "/configurador";
  }

  const params = new URLSearchParams();
  params.set("color", colorCode);
  return `/configurador?${params.toString()}`;
}

function getRenderDownloadFilename(productId: string, colorCode: string) {
  return `${productId}-${colorCode}-2d.png`;
}

function formatCurrencyMxn(value: number) {
  return new Intl.NumberFormat("es-MX", {
    style: "decimal",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatQuantityLabel(quantityKg: number) {
  return `${quantityKg} kg`;
}

function sanitizeQuantityKg(quantityKg: number) {
  if (!Number.isFinite(quantityKg) || quantityKg <= 0) {
    return 1;
  }

  if (quantityKg <= 1) {
    return 1;
  }

  const normalized = Math.max(CUSTOM_QUANTITY_STEP, quantityKg);
  return Math.round(normalized / CUSTOM_QUANTITY_STEP) * CUSTOM_QUANTITY_STEP;
}

function getQuantitySelectValue(quantityKg: number) {
  return quantityKg > CUSTOM_QUANTITY_THRESHOLD ? "custom" : String(quantityKg);
}

function getCartItemTotal(item: CartItem) {
  if (item.pricePerKgMxn == null) {
    return null;
  }

  return item.pricePerKgMxn * item.quantityKg;
}

function getProductLabel(productId: CartItem["productId"]) {
  return getAgamaConfiguratorProduct(productId).name;
}

function buildCartWhatsappUrl(input: { items: CartItem[]; shareUrl: string }) {
  const totalKg = input.items.reduce((sum, item) => sum + item.quantityKg, 0);
  const knownTotal = input.items.reduce((sum, item) => sum + (getCartItemTotal(item) ?? 0), 0);
  const hasPendingPricing = input.items.some((item) => getCartItemTotal(item) == null);
  const lines = [
    "Hola AGAMA, quiero cotizar este pedido:",
    ...input.items.map((item, index) => {
      const itemTotal = getCartItemTotal(item);
      const amountLabel = itemTotal != null ? `${formatCurrencyMxn(itemTotal)} MXN` : "Monto por validar";
      const unitPriceLabel = item.pricePerKgMxn != null ? `${formatCurrencyMxn(item.pricePerKgMxn)} MXN/kg` : "Precio por validar";
      return `${index + 1}. ${getProductLabel(item.productId)} | ${item.colorCode} ${item.colorName} | ${item.quantityKg} kg | ${unitPriceLabel} | ${amountLabel}`;
    }),
    `Peso total: ${totalKg} kg`,
    `Monto total: ${hasPendingPricing ? `${formatCurrencyMxn(knownTotal)} MXN + partidas por validar` : `${formatCurrencyMxn(knownTotal)} MXN`}`,
    `Configuracion: ${input.shareUrl}`,
  ];

  return `https://wa.me/${SALES_PHONE}?text=${encodeURIComponent(lines.join("\n"))}`;
}

function getSwatchStyle(color: DemoConfiguratorColor) {
  if (color.hex) {
    return {
      backgroundColor: color.hex,
      backgroundImage: "none",
    };
  }

  if (color.swatchAssetUrl) {
    return {
      backgroundImage: `url(${color.swatchAssetUrl})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat",
      backgroundColor: "#f4f6f8",
    };
  }

  return {
    background: "linear-gradient(135deg, #eef2f7 0%, #d9e0ea 100%)",
  };
}

function getCatalogPreviewAsset(color: DemoConfiguratorColor) {
  return color.sourceImageUrl ?? color.swatchAssetUrl ?? null;
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new window.Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`No se pudo cargar ${src}`));
    image.src = src;
  });
}

function wrapCanvasText(context: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const nextLine = currentLine ? `${currentLine} ${word}` : word;
    if (context.measureText(nextLine).width <= maxWidth) {
      currentLine = nextLine;
      continue;
    }

    if (currentLine) {
      lines.push(currentLine);
    }

    currentLine = word;
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

function drawRoundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  const safeRadius = Math.min(radius, width / 2, height / 2);
  context.beginPath();
  context.moveTo(x + safeRadius, y);
  context.lineTo(x + width - safeRadius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + safeRadius);
  context.lineTo(x + width, y + height - safeRadius);
  context.quadraticCurveTo(x + width, y + height, x + width - safeRadius, y + height);
  context.lineTo(x + safeRadius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - safeRadius);
  context.lineTo(x, y + safeRadius);
  context.quadraticCurveTo(x, y, x + safeRadius, y);
  context.closePath();
}

function decodeBase64(base64: string) {
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

function toArrayBuffer(bytes: Uint8Array) {
  const buffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buffer).set(bytes);
  return buffer;
}

function escapePdfString(value: string) {
  let result = value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
  // PDF 1.4 strings are Latin-1; encode non-ASCII chars as octal escapes
  result = result.replace(/[^\x00-\x7F]/g, (ch) => {
    const code = ch.charCodeAt(0);
    return code <= 0xff ? `\\${code.toString(8).padStart(3, "0")}` : "";
  });
  return result;
}

function buildPdfFromCanvas(options: {
  canvas: HTMLCanvasElement;
  filename: string;
  links: Array<{ x: number; y: number; width: number; height: number; url: string }>;
}) {
  const jpegDataUrl = options.canvas.toDataURL("image/jpeg", 0.95);
  const imageBase64 = jpegDataUrl.split(",")[1] ?? "";
  const imageBytes = decodeBase64(imageBase64);
  const objects: BlobPart[] = [];
  const offsets: number[] = [0];
  let position = 0;

  const pushString = (value: string) => {
    const bytes = new TextEncoder().encode(value);
    objects.push(bytes);
    position += bytes.length;
  };

  const pushBytes = (bytes: Uint8Array) => {
    objects.push(toArrayBuffer(bytes));
    position += bytes.length;
  };

  const pageWidth = options.canvas.width;
  const pageHeight = options.canvas.height;
  const annots = options.links.map((_, index) => `${6 + index} 0 R`).join(" ");

  pushString("%PDF-1.4\n");
  offsets.push(position);
  pushString("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n");
  offsets.push(position);
  pushString("2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n");
  offsets.push(position);
  pushString(
    `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /XObject << /Im0 4 0 R >> /ProcSet [/PDF /ImageC] >> /Contents 5 0 R /Annots [${annots}] >>\nendobj\n`,
  );
  offsets.push(position);
  pushString(
    `4 0 obj\n<< /Type /XObject /Subtype /Image /Width ${pageWidth} /Height ${pageHeight} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${imageBytes.length} >>\nstream\n`,
  );
  pushBytes(imageBytes);
  pushString("\nendstream\nendobj\n");

  const contentStream = `q\n${pageWidth} 0 0 ${pageHeight} 0 0 cm\n/Im0 Do\nQ\n`;
  const contentBytes = new TextEncoder().encode(contentStream);
  offsets.push(position);
  pushString(`5 0 obj\n<< /Length ${contentBytes.length} >>\nstream\n`);
  pushBytes(contentBytes);
  pushString("endstream\nendobj\n");

  options.links.forEach((link, index) => {
    const rectLeft = link.x;
    const rectBottom = pageHeight - (link.y + link.height);
    const rectRight = link.x + link.width;
    const rectTop = pageHeight - link.y;
    offsets.push(position);
    pushString(
      `${6 + index} 0 obj\n<< /Type /Annot /Subtype /Link /Rect [${rectLeft} ${rectBottom} ${rectRight} ${rectTop}] /Border [0 0 0] /A << /S /URI /URI (${escapePdfString(link.url)}) >> >>\nendobj\n`,
    );
  });

  const xrefOffset = position;
  pushString(`xref\n0 ${offsets.length}\n`);
  pushString("0000000000 65535 f \n");
  offsets.slice(1).forEach((offset) => {
    pushString(`${offset.toString().padStart(10, "0")} 00000 n \n`);
  });
  pushString(`trailer\n<< /Size ${offsets.length} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`);

  const blob = new Blob(objects, { type: "application/pdf" });
  const objectUrl = window.URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = objectUrl;
  link.download = options.filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(objectUrl);
}

function buildQuoteUrl(input: {
  color: DemoConfiguratorColor;
  productName: string;
  shareUrl: string;
  process: string;
  material: string;
  quantityLabel: string;
}) {
  const message = [
    "Hola AGAMA, quiero solicitar una cotizacion.",
    `Producto de referencia visual: ${input.productName}.`,
    `Color: ${input.color.code} ${input.color.name}.`,
    `Proceso: ${input.process}.`,
    `Material: ${input.material}.`,
    `Cantidad objetivo: ${input.quantityLabel}.`,
    `Configuracion: ${input.shareUrl}`,
  ].join(" ");

  return `https://wa.me/${SALES_PHONE}?text=${encodeURIComponent(message)}`;
}

export function ConfiguratorPage({
  colors,
  initialColorCode,
}: {
  colors: DemoConfiguratorColor[];
  initialColorCode: string | null;
}) {
  const router = useRouter();
  const colorsByCode = useMemo(() => new Map(colors.map((color) => [color.code, color])), [colors]);
  const [selectedProductId, setSelectedProductId] = useState<AgamaConfiguratorProductId>("bucket");
  const [selectedColorCode, setSelectedColorCode] = useState<string | null>(initialColorCode);
  const [imageLoadFailed, setImageLoadFailed] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isCopyFeedbackVisible, setIsCopyFeedbackVisible] = useState(false);
  const canvasRendererRef = useRef<HTMLCanvasElement | null>(null);
  const viewerSectionRef = useRef<HTMLElement | null>(null);
  const cartToggleButtonRef = useRef<HTMLButtonElement | null>(null);
  const checkoutDialogRef = useRef<HTMLDivElement | null>(null);
  const checkoutCloseButtonRef = useRef<HTMLButtonElement | null>(null);
  const checkoutTriggerRef = useRef<HTMLElement | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCartHighlightVisible, setIsCartHighlightVisible] = useState(false);
  const [addToCartFeedbackVisible, setAddToCartFeedbackVisible] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isQuoteFormOpen, setIsQuoteFormOpen] = useState(false);
  const [customQuantityItemId, setCustomQuantityItemId] = useState<string | null>(null);
  const [customQuantityDrafts, setCustomQuantityDrafts] = useState<Record<string, string>>({});
  const [colorQuery, setColorQuery] = useState("");
  const [activeFamily, setActiveFamily] = useState<string>("all");
  const [activeLine, setActiveLine] = useState<"all" | "masterbatch" | "pigmentos">("all");
  const [compareSlots, setCompareSlots] = useState<[string | null, string | null, string | null]>([null, null, null]);
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  // Hydration-safe origin: empty during SSR/hydration, real origin after.
  const shareOrigin = useSyncExternalStore(
    subscribeNoop,
    () => window.location.origin,
    () => "",
  );
  const allowedColorCodes = useMemo(() => new Set(colors.map((color) => color.code)), [colors]);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartHydrated, setIsCartHydrated] = useState(false);
  const [cartOrphanCount, setCartOrphanCount] = useState(0);
  const [shouldLoadChatbase, setShouldLoadChatbase] = useState(false);

  useEffect(() => {
    let restoredItems: CartItem[] = [];
    let orphanCount = 0;
    try {
      const saved = window.localStorage.getItem(CART_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as CartItem[];
        restoredItems = parsed
          .filter(
            (item) =>
              item &&
              typeof item.id === "string" &&
              typeof item.colorCode === "string" &&
              allowedColorCodes.has(item.colorCode) &&
              typeof item.colorName === "string" &&
              typeof item.process === "string" &&
              typeof item.material === "string" &&
              typeof item.quantityKg === "number" &&
              (typeof item.pricePerKgMxn === "number" || item.pricePerKgMxn === null || item.pricePerKgMxn === undefined),
          )
          .map((item) => ({
            ...item,
            productId: item.productId === "cup" || item.productId === "chair" ? item.productId : "bucket",
            quantityKg: sanitizeQuantityKg(item.quantityKg),
            pricePerKgMxn: item.pricePerKgMxn ?? null,
          }));
        orphanCount = Math.max(0, parsed.length - restoredItems.length);
      }
    } catch {
      window.localStorage.removeItem(CART_STORAGE_KEY);
    }

    const hydrationTimer = window.setTimeout(() => {
      setCartItems(restoredItems);
      setCartOrphanCount(orphanCount);
      setIsCartHydrated(true);
    }, 0);
    return () => window.clearTimeout(hydrationTimer);
  }, [allowedColorCodes]);
  const [cartOrphanToastVisible, setCartOrphanToastVisible] = useState(() => cartOrphanCount > 0);

  const activeProduct = getAgamaConfiguratorProduct(selectedProductId);
  const isBucketSelected = selectedProductId === "bucket";

  const availableFamilies = useMemo(() => {
    const present = new Set(colors.map((color) => color.family));
    return FAMILY_ORDER.filter((family) => present.has(family as (typeof colors)[number]["family"]));
  }, [colors]);

  const visibleColors = useMemo(() => {
    const normalizedQuery = normalizeSearchText(colorQuery.trim());

    return colors.filter((color) => {
      if (activeLine !== "all" && color.line !== activeLine) {
        return false;
      }

      if (activeFamily !== "all" && color.family !== activeFamily) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      return (
        normalizeSearchText(color.code).includes(normalizedQuery) ||
        normalizeSearchText(color.name).includes(normalizedQuery)
      );
    });
  }, [colors, colorQuery, activeFamily, activeLine]);

  const selectedColor = selectedColorCode ? colorsByCode.get(selectedColorCode) ?? null : null;
  const selectedPricePerKg = selectedColor?.pricePerKgMxn ?? null;
  const selectedCatalogPreview = selectedColor ? getCatalogPreviewAsset(selectedColor) : null;
  const sharePath = buildSharePath(selectedColor?.code);
  const shareUrl = shareOrigin ? new URL(sharePath, shareOrigin).toString() : sharePath;
  const renderUrl = selectedColor ? getAgamaProductRender(PRODUCT_ID, selectedColor.code) : null;
  const previewUrl = imageLoadFailed || !renderUrl ? AGAMA_BUCKET_BASE_RENDER : renderUrl;
  const previewSrc = withRenderAssetVersion(previewUrl) ?? AGAMA_BUCKET_BASE_RENDER;
  const quoteUrl = selectedColor
    ? buildQuoteUrl({
        color: selectedColor,
        productName: activeProduct.name,
        shareUrl,
        process: DEFAULT_PROCESS,
        material: DEFAULT_MATERIAL,
        quantityLabel: formatQuantityLabel(CART_QUANTITY_OPTIONS[0]),
      })
    : null;
  const cartKnownTotal = cartItems.reduce((sum, item) => sum + (getCartItemTotal(item) ?? 0), 0);
  const cartHasPendingPricing = cartItems.some((item) => item.pricePerKgMxn == null);
  const cartTotalKg = cartItems.reduce((sum, item) => sum + item.quantityKg, 0);
  const cartWhatsappUrl = buildCartWhatsappUrl({ items: cartItems, shareUrl });
  const quoteItems: QuoteRequestItem[] = cartItems.map((item) => ({
    configurationId: item.id,
    productId: item.productId,
    colorCode: item.colorCode,
    colorName: item.colorName,
    quantityKg: item.quantityKg,
    pricePerKgMxn: item.pricePerKgMxn,
    process: item.process,
    material: item.material,
  }));
  const renderModel = defaultProductRenderer.buildRenderModel({
    product: activeProduct,
    primaryColor: selectedColor ?? null,
    compareColor: null,
    activeSlot: "a",
  });

  useEffect(() => {
    if (cartOrphanCount === 0) return;
    const showTimer = window.setTimeout(() => setCartOrphanToastVisible(true), 0);
    const timer = window.setTimeout(() => setCartOrphanToastVisible(false), 7000);
    return () => {
      window.clearTimeout(showTimer);
      window.clearTimeout(timer);
    };
  }, [cartOrphanCount]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const current = `${window.location.pathname}${window.location.search}`;
    if (current === sharePath) {
      return;
    }

    startTransition(() => {
      router.replace(sharePath, { scroll: false });
    });
  }, [router, sharePath]);

  useEffect(() => {
    if (!isCartHydrated) return;
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
  }, [cartItems, isCartHydrated]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia("(min-width: 1024px)");
    const handleChange = () => setShouldLoadChatbase(mediaQuery.matches);

    handleChange();
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  useEffect(() => {
    if (!shouldLoadChatbase || typeof window === "undefined" || document.getElementById(CHATBASE_BOT_ID)) {
      return;
    }

    const chatbaseWindow = window as Window & {
      chatbase?: ((...args: unknown[]) => unknown) & { q?: unknown[][] };
    };

    const initialize = () => {
      if (!chatbaseWindow.chatbase || chatbaseWindow.chatbase("getState") !== "initialized") {
        chatbaseWindow.chatbase = (...args: unknown[]) => {
          if (!chatbaseWindow.chatbase?.q) {
            chatbaseWindow.chatbase!.q = [];
          }
          chatbaseWindow.chatbase!.q?.push(args);
        };
        chatbaseWindow.chatbase = new Proxy(chatbaseWindow.chatbase, {
          get(target, prop) {
            if (prop === "q") return target.q;
            return (...args: unknown[]) => target(prop, ...args);
          },
        });
      }

      const script = document.createElement("script");
      script.src = "https://www.chatbase.co/embed.min.js";
      script.id = CHATBASE_BOT_ID;
      script.setAttribute("data-domain", "www.chatbase.co");
      document.body.appendChild(script);
    };

    if (document.readyState === "complete") {
      initialize();
      return;
    }

    window.addEventListener("load", initialize, { once: true });
    return () => window.removeEventListener("load", initialize);
  }, [shouldLoadChatbase]);

  useEffect(() => {
    if (!isCheckoutOpen) return;

    checkoutTriggerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const dialog = checkoutDialogRef.current;
    const fallbackFocusTarget = cartToggleButtonRef.current;
    if (!dialog) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusTimer = window.setTimeout(() => {
      checkoutCloseButtonRef.current?.focus();
    }, 0);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setIsCheckoutOpen(false);
        return;
      }

      if (event.key !== "Tab") return;

      const focusable = getFocusableElements(dialog);
      if (focusable.length === 0) {
        event.preventDefault();
        dialog.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const activeElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;

      if (event.shiftKey && activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && activeElement === last) {
        event.preventDefault();
        first.focus();
      } else if (activeElement && !dialog.contains(activeElement)) {
        event.preventDefault();
        first.focus();
      }
    };

    dialog.addEventListener("keydown", handleKeyDown);

    return () => {
      window.clearTimeout(focusTimer);
      dialog.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      window.requestAnimationFrame(() => {
        if (checkoutTriggerRef.current && checkoutTriggerRef.current.isConnected) {
          checkoutTriggerRef.current.focus();
          return;
        }
        fallbackFocusTarget?.focus();
      });
    };
  }, [isCheckoutOpen]);

  function handleSelectProduct(productId: AgamaConfiguratorProductId) {
    setSelectedProductId(productId);
    setImageLoadFailed(false);
    emitConfiguratorAnalyticsEvent("product_selected", {
      productId,
      activeColorCode: selectedColorCode,
    });
  }

  function handleSelectColor(code: string) {
    const nextColor = colorsByCode.get(code);
    if (!nextColor) return;

    const shouldRevealViewer = !selectedColorCode && window.matchMedia("(max-width: 767px)").matches;
    setImageLoadFailed(false);
    setSelectedColorCode(code);
    if (shouldRevealViewer) {
      window.requestAnimationFrame(() => viewerSectionRef.current?.scrollIntoView({ block: "start" }));
    }
    emitConfiguratorAnalyticsEvent("color_selected", {
      colorCode: code,
      productId: selectedProductId,
      slot: "a",
      validationStatus: nextColor.validationStatus,
    });
  }

  const compareColors = useMemo(() => {
    return compareSlots.map((code) => (code ? colorsByCode.get(code) ?? null : null));
  }, [compareSlots, colorsByCode]);

  const compareCount = compareSlots.filter(Boolean).length;

  const handleAddToCompare = useCallback((code: string) => {
    setCompareSlots((current) => {
      if (current.includes(code)) return current;
      const firstEmpty = current.indexOf(null);
      if (firstEmpty === -1) return current;
      const next = [...current] as [string | null, string | null, string | null];
      next[firstEmpty] = code;
      return next;
    });
    setIsCompareOpen(true);
  }, []);

  const handleRemoveFromCompare = useCallback((index: number) => {
    setCompareSlots((current) => {
      const next = [...current] as [string | null, string | null, string | null];
      next[index] = null;
      return next;
    });
  }, []);

  const handleClearCompare = useCallback(() => {
    setCompareSlots([null, null, null]);
    setIsCompareOpen(false);
  }, []);

  async function handleCopyUrl() {
    if (typeof window === "undefined") return;

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      }

      setIsCopyFeedbackVisible(true);
      window.setTimeout(() => setIsCopyFeedbackVisible(false), 1500);

      emitConfiguratorAnalyticsEvent("share_generated", {
        productId: selectedProductId,
        colorCode: selectedColor?.code ?? null,
        compareColorCode: null,
      });
    } catch {
      // Clipboard blocked by browser policy — no-op
    }
  }

  async function handleDownloadRender() {
    if (typeof window === "undefined") return;

    try {
      setIsDownloading(true);

      let blob: Blob;

      if (isBucketSelected && renderUrl) {
        const assetUrl = withRenderAssetVersion(previewUrl) ?? previewUrl;
        const renderImage = await loadImage(assetUrl);
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");

        if (!context) {
          throw new Error("No se pudo inicializar el canvas de exportacion 2D");
        }

        canvas.width = renderImage.naturalWidth || renderImage.width;
        canvas.height = renderImage.naturalHeight || renderImage.height;
        context.drawImage(renderImage, 0, 0, canvas.width, canvas.height);

        blob = await new Promise<Blob>((resolve, reject) => {
          canvas.toBlob((result) => {
            if (result) {
              resolve(result);
              return;
            }
            reject(new Error("No se pudo exportar el render 2D"));
          }, "image/png");
        });
      } else {
        const rendererCanvas = canvasRendererRef.current;
        if (!rendererCanvas) {
          throw new Error("Canvas del producto no disponible para exportar");
        }

        blob = await new Promise<Blob>((resolve, reject) => {
          rendererCanvas.toBlob((result) => {
            if (result) {
              resolve(result);
              return;
            }
            reject(new Error("No se pudo exportar el render 2D del canvas"));
          }, "image/png");
        });
      }

      const objectUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = objectUrl;
      link.download = getRenderDownloadFilename(selectedProductId, selectedColor?.code ?? "neutral");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(objectUrl);

      emitConfiguratorAnalyticsEvent("png_downloaded", {
        productId: selectedProductId,
        colorCode: selectedColor?.code ?? null,
        exportReady: true,
      });
    } catch (error) {
      console.error("AGAMA configurador: fallo al descargar el render 2D", error);
    } finally {
      setIsDownloading(false);
    }
  }

  function handleOpenFicha() {
    if (typeof window === "undefined" || !selectedColor?.sourceSheetUrl) return;
    window.open(selectedColor.sourceSheetUrl, "_blank", "noopener,noreferrer");
  }

  async function handleDownloadCheckoutPdf() {
    if (typeof window === "undefined") return;

    try {
      setIsDownloading(true);
      const logoImage = await loadImage("/brand/agama.svg");
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");

      if (!context) {
        throw new Error("No se pudo inicializar el canvas del resumen");
      }

      canvas.width = 1480;
      canvas.height = 1120;

      const backgroundGradient = context.createLinearGradient(0, 0, canvas.width, canvas.height);
      backgroundGradient.addColorStop(0, "#ffffff");
      backgroundGradient.addColorStop(1, "#eef4ff");
      context.fillStyle = backgroundGradient;
      context.fillRect(0, 0, canvas.width, canvas.height);

      drawRoundedRect(context, 44, 44, canvas.width - 88, canvas.height - 88, 32);
      context.fillStyle = "#ffffff";
      context.fill();
      context.strokeStyle = "#d7deea";
      context.lineWidth = 2;
      context.stroke();

      context.drawImage(logoImage, 88, 84, 250, 76);

      context.fillStyle = "#62728c";
      context.font = '600 26px "Arial"';
      context.fillText("Resumen comercial del configurador", 88, 196);

      context.fillStyle = "#11131a";
      context.font = '700 50px "Arial"';
      context.fillText("Pedido en preparación", 88, 274);

      context.fillStyle = "#62728c";
      context.font = '500 24px "Arial"';
      const summaryLines = wrapCanvasText(
        context,
        "Documento de apoyo comercial con precios web actuales. Los importes pueden variar y la disponibilidad final debe confirmarse con el equipo de ventas.",
        760,
      );
      summaryLines.forEach((line, index) => {
        context.fillText(line, 88, 334 + index * 36);
      });

      drawRoundedRect(context, 88, 430, 820, 552, 28);
      context.fillStyle = "#f8fbff";
      context.fill();
      context.strokeStyle = "#d7deea";
      context.stroke();

      let rowY = 490;
      cartItems.forEach((item, index) => {
        const itemTotal = getCartItemTotal(item);

        if (index > 0) {
          context.strokeStyle = "#d7deea";
          context.lineWidth = 1;
          context.beginPath();
          context.moveTo(124, rowY - 24);
          context.lineTo(872, rowY - 24);
          context.stroke();
        }

        context.fillStyle = "#11131a";
        context.font = '700 28px "Arial"';
        context.fillText(`${item.colorCode} · ${item.colorName}`, 124, rowY);

        context.fillStyle = "#62728c";
        context.font = '500 22px "Arial"';
        context.fillText(`${item.process} · ${item.material}`, 124, rowY + 34);
        context.fillText(`Cantidad: ${formatQuantityLabel(item.quantityKg)}`, 124, rowY + 68);
        context.fillText(
          `Precio web actual: ${item.pricePerKgMxn != null ? `${formatCurrencyMxn(item.pricePerKgMxn)} MXN/kg` : "Validación comercial"}`,
          124,
          rowY + 102,
        );

        context.fillStyle = "#0a3d91";
        context.font = '700 28px "Arial"';
        context.fillText(itemTotal != null ? `${formatCurrencyMxn(itemTotal)} MXN` : "Consultar", 700, rowY + 68);

        rowY += 152;
      });

      drawRoundedRect(context, 956, 430, 436, 552, 28);
      context.fillStyle = "#ffffff";
      context.fill();
      context.strokeStyle = "#d7deea";
      context.stroke();

      context.fillStyle = "#62728c";
      context.font = '600 22px "Arial"';
      context.fillText("Resumen económico", 996, 486);

      context.font = '500 22px "Arial"';
      context.fillText("Configuraciones", 996, 548);
      context.fillText(String(cartItems.length), 1324, 548);
      context.fillText("Cantidad total", 996, 594);
      context.fillText(`${cartTotalKg} kg`, 1298, 594);

      context.strokeStyle = "#d7deea";
      context.lineWidth = 1;
      context.beginPath();
      context.moveTo(996, 630);
      context.lineTo(1352, 630);
      context.stroke();

      context.fillStyle = "#62728c";
      context.font = '600 22px "Arial"';
      context.fillText(cartHasPendingPricing ? "Total parcial" : "Costo total", 996, 688);

      context.fillStyle = "#11131a";
      context.font = '700 46px "Arial"';
      context.fillText(`${formatCurrencyMxn(cartKnownTotal)} MXN`, 996, 756);

      context.fillStyle = "#62728c";
      context.font = '500 21px "Arial"';
      const disclaimerLines = wrapCanvasText(
        context,
        "Los precios mostrados corresponden al valor web actual y pueden variar sin previo aviso. Consultar disponibilidad, validación comercial y condiciones finales con el equipo de ventas AGAMA.",
        324,
      );
      disclaimerLines.forEach((line, index) => {
        context.fillText(line, 996, 812 + index * 30);
      });

      const linkCards = [
        {
          label: "Configuración",
          value: "Abrir enlace compartible",
          url: shareUrl,
          x: 88,
          y: 1010,
          width: 400,
          height: 68,
        },
        {
          label: "Cotización",
          value: "Hablar con ventas",
          url: quoteUrl,
          x: 516,
          y: 1010,
          width: 400,
          height: 68,
        },
      ].filter((card): card is { label: string; value: string; url: string; x: number; y: number; width: number; height: number } => Boolean(card.url));

      linkCards.forEach((card) => {
        drawRoundedRect(context, card.x, card.y, card.width, card.height, 18);
        context.fillStyle = "#ffffff";
        context.fill();
        context.strokeStyle = "#c9d7ef";
        context.stroke();

        context.fillStyle = "#62728c";
        context.font = '600 18px "Arial"';
        context.fillText(card.label, card.x + 20, card.y + 25);
        context.fillStyle = "#0a3d91";
        context.font = '700 22px "Arial"';
        context.fillText(card.value, card.x + 20, card.y + 50);
      });

      buildPdfFromCanvas({
        canvas,
        filename: `agama-resumen-pedido-${selectedColor?.code ?? cartItems[0]?.colorCode ?? "neutral"}.pdf`,
        links: linkCards.map((card) => ({
          x: card.x,
          y: card.y,
          width: card.width,
          height: card.height,
          url: card.url,
        })),
      });
    } catch (error) {
      console.error("AGAMA configurador: fallo al descargar el resumen PDF", error);
    } finally {
      setIsDownloading(false);
    }
  }

  function handleAddToCart() {
    if (!selectedColor) return;

    setIsCartOpen(true);
    setIsCartHighlightVisible(true);
    setAddToCartFeedbackVisible(true);
    setCartItems((current) => [
      {
        id: `${selectedColor.code}-${DEFAULT_PROCESS}-${DEFAULT_MATERIAL}-${current.length + 1}`,
        productId: selectedProductId === "cup" || selectedProductId === "chair" ? selectedProductId : "bucket",
        colorCode: selectedColor.code,
        colorName: selectedColor.name,
        process: DEFAULT_PROCESS,
        material: DEFAULT_MATERIAL,
        quantityKg: CART_QUANTITY_OPTIONS[0],
        pricePerKgMxn: selectedPricePerKg,
      },
      ...current,
    ]);
    emitConfiguratorAnalyticsEvent("cart_item_added", {
      productId: selectedProductId,
      colorCode: selectedColor.code,
      quantityKg: CART_QUANTITY_OPTIONS[0],
    });

    window.setTimeout(() => {
      setIsCartHighlightVisible(false);
    }, 1300);

    window.setTimeout(() => {
      setAddToCartFeedbackVisible(false);
    }, 1600);
  }

  function handleUpdateCartItemQuantity(itemId: string, quantityKg: number) {
    setCartItems((current) =>
      current.map((item) => (item.id === itemId ? { ...item, quantityKg: sanitizeQuantityKg(quantityKg) } : item)),
    );
  }

  function handleCustomQuantityDraftChange(itemId: string, value: string) {
    setCustomQuantityDrafts((current) => ({
      ...current,
      [itemId]: value,
    }));
  }

  function commitCustomQuantityDraft(itemId: string, fallbackQuantityKg: number) {
    const rawDraft = customQuantityDrafts[itemId];
    const parsedQuantityKg = Number(rawDraft);

    if (!rawDraft || !Number.isFinite(parsedQuantityKg) || parsedQuantityKg <= 0) {
      setCustomQuantityDrafts((current) => ({
        ...current,
        [itemId]: String(fallbackQuantityKg),
      }));
      return;
    }

    const normalizedQuantityKg = sanitizeQuantityKg(parsedQuantityKg);
    handleUpdateCartItemQuantity(itemId, normalizedQuantityKg);
    setCustomQuantityDrafts((current) => ({
      ...current,
      [itemId]: String(normalizedQuantityKg),
    }));
  }

  function isCustomQuantityEnabled(itemId: string, quantityKg: number) {
    return customQuantityItemId === itemId || quantityKg > CUSTOM_QUANTITY_THRESHOLD;
  }

  function handleRemoveCartItem(itemId: string) {
    setCartItems((current) => current.filter((item) => item.id !== itemId));
    setCustomQuantityDrafts((current) => {
      const nextDrafts = { ...current };
      delete nextDrafts[itemId];
      return nextDrafts;
    });
  }

  return (
    <>
      <a
        href="#configurator-main"
        className="sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:not-sr-only focus:inline-flex focus:rounded-full focus:border focus:border-brand focus:bg-white focus:px-3 focus:py-1.5 focus:text-xs focus:font-semibold focus:text-brand focus:shadow-lg focus:outline-none"
      >
        Saltar al contenido principal
      </a>

      <main id="configurator-main" className="page-frame section-gap">
        <section className="studio-panel overflow-hidden rounded-[1.5rem] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(247,250,255,0.98)_100%)] px-3 py-3 shadow-[0_20px_50px_rgba(19,35,78,0.07)] sm:px-4 sm:py-4 md:px-6 md:py-5">
        <div className="flex flex-col gap-4 border-b border-line/80 pb-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-4">
            <Logo href="/configurador" className="shrink-0" />
            <div className="hidden h-10 w-px bg-line sm:block" />
            <div className="min-w-0">
              <h1 className="text-[1.6rem] font-bold tracking-[-0.04em] text-graphite md:text-[2.2rem]">Configurador de Color</h1>
              <p className="text-[0.82rem] text-muted">Elige color, visualiza y solicita cotización al instante</p>
            </div>
          </div>

          <div className="flex flex-col items-stretch gap-2.5 lg:items-end">
            <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center sm:justify-end">
              <button
                type="button"
                onClick={handleCopyUrl}
                className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-full border border-line bg-white px-3 py-2 text-xs font-semibold text-muted transition hover:border-brand hover:text-brand"
              >
                {isCopyFeedbackVisible ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                {isCopyFeedbackVisible ? "Copiado" : "Compartir"}
              </button>
            </div>

            <div className="relative">
              <button
                ref={cartToggleButtonRef}
                type="button"
                onClick={() => setIsCartOpen((current) => !current)}
                className={cn(
                  "inline-flex w-full min-w-[15rem] items-center justify-between gap-4 rounded-xl border border-line bg-white px-3 py-2 text-left text-graphite shadow-[0_8px_20px_rgba(18,32,70,0.06)] transition hover:border-brand/40 lg:w-auto",
                  isCartHighlightVisible && "border-brand/50 bg-brand-soft",
                )}
              >
                <span className="flex items-center gap-3">
                  <span className="relative flex h-10 w-10 items-center justify-center rounded-full bg-brand-soft text-brand">
                    <ShoppingCart className="size-5" />
                    {cartItems.length > 0 ? (
                      <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1 text-[0.68rem] font-bold text-white">
                        {cartItems.length}
                      </span>
                    ) : null}
                  </span>
                  <span>
                    <span className="block text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-muted">Pedido</span>
                    <span className="block text-sm font-semibold">
                      {cartItems.length > 0 ? `${cartTotalKg} kg configurados` : "Configurar pedido"}
                    </span>
                  </span>
                </span>
                <span className="flex items-center gap-3">
                  <span className="text-right">
                    <span className="block text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-muted">
                      {cartHasPendingPricing ? "Total parcial" : "Total"}
                    </span>
                    <span className="block text-sm font-semibold">
                      {cartItems.length > 0 ? formatCurrencyMxn(cartKnownTotal) : "Sin items"}
                    </span>
                  </span>
                  <ChevronDown className={cn("size-4 transition", isCartOpen && "rotate-180")} />
                </span>
              </button>

              {isCartOpen ? (
                <div className="mt-3 w-full rounded-[1.6rem] border border-line/80 bg-white p-4 shadow-[0_28px_70px_rgba(19,35,78,0.16)] lg:absolute lg:right-0 lg:top-full lg:z-20 lg:mt-4 lg:w-[28rem]">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-muted">Carrito comercial</p>
                      <h3 className="mt-1 text-[1.25rem] font-bold tracking-[-0.03em] text-graphite">Pedido en preparación</h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsCartOpen(false)}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-line text-muted transition hover:border-brand hover:text-brand"
                      aria-label="Cerrar carrito"
                    >
                      <X className="size-4" />
                    </button>
                  </div>

                  <div className="mt-4 rounded-[1.15rem] border border-line bg-[#f8fbff] p-4">
                    <p className="text-sm font-semibold text-graphite">
                      {cartItems.length > 0
                        ? `${cartItems.length} ${cartItems.length === 1 ? "configuración añadida" : "configuraciones añadidas"}`
                        : "Todavía no hay configuraciones añadidas"}
                    </p>
                    <p className="mt-1 text-sm text-muted">
                      {cartHasPendingPricing
                        ? "El total mostrado es parcial. Algunas referencias requieren validación comercial."
                        : "El total se recalcula automáticamente al cambiar los kg."}
                    </p>
                    <div className="mt-4 rounded-[1rem] border border-white bg-white px-4 py-3">
                      <p className="text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-muted">Total</p>
                      <p className="mt-1 text-lg font-bold tracking-[-0.03em] text-graphite">
                        {cartItems.length > 0 ? `${formatCurrencyMxn(cartKnownTotal)} MXN` : "Sin items"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 space-y-3">
                    {cartItems.length === 0 ? (
                      <div className="rounded-[1.1rem] border border-dashed border-line bg-white px-4 py-5 text-sm text-muted">
                        Añade una combinación y desde aquí podrás ajustar los kg necesarios antes de pasar a la siguiente fase comercial.
                      </div>
                    ) : (
                      cartItems.map((item) => {
                        const itemTotal = getCartItemTotal(item);

                        return (
                          <div key={item.id} className="rounded-[1.15rem] border border-line bg-white p-4">
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <p className="text-sm font-semibold text-graphite">{item.colorCode} · {item.colorName}</p>
                                <p className="mt-1 text-sm text-muted">{item.process} · {item.material}</p>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveCartItem(item.id)}
                                className="text-sm font-semibold text-brand"
                              >
                                Quitar
                              </button>
                            </div>

                            <div className="mt-4 grid gap-3 sm:grid-cols-[9rem_minmax(0,1fr)] sm:items-end">
                              <label className="block">
                                <span className="mb-2 block text-sm font-semibold text-graphite">Cantidad</span>
                                <select
                                  value={getQuantitySelectValue(item.quantityKg)}
                                  onChange={(event) => {
                                    if (event.target.value === "custom") {
                                      handleUpdateCartItemQuantity(item.id, CUSTOM_QUANTITY_THRESHOLD + CUSTOM_QUANTITY_STEP);
                                      return;
                                    }

                                    handleUpdateCartItemQuantity(item.id, Number(event.target.value));
                                  }}
                                  className="h-11 w-full rounded-[0.95rem] border border-line bg-white px-4 text-sm text-graphite outline-none"
                                >
                                  {CART_QUANTITY_OPTIONS.map((option) => (
                                    <option key={option} value={option}>
                                      {formatQuantityLabel(option)}
                                    </option>
                                  ))}
                                  <option value="custom">Más de 100 kg</option>
                                </select>
                                <button
                                  type="button"
                                  onClick={() => setCustomQuantityItemId((current) => (current === item.id ? null : item.id))}
                                  className="mt-2 text-xs font-semibold text-brand"
                                >
                                  {isCustomQuantityEnabled(item.id, item.quantityKg) ? "Ocultar escritura manual" : "Escribir kg"}
                                </button>
                              </label>

                              <div className="rounded-[0.95rem] border border-line bg-[#fbfcfe] px-4 py-3">
                                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-muted">Precio</p>
                                {item.pricePerKgMxn != null ? (
                                  <div className="mt-1 flex items-end justify-between gap-3">
                                    <p className="text-sm text-muted">{formatCurrencyMxn(item.pricePerKgMxn)} MXN/kg</p>
                                    <p className="text-base font-bold tracking-[-0.03em] text-graphite">
                                      {itemTotal != null ? formatCurrencyMxn(itemTotal) : "Consultar"}
                                    </p>
                                  </div>
                                ) : (
                                  <p className="mt-1 text-sm text-muted">Precio sujeto a validación comercial para esta referencia visual.</p>
                                )}
                              </div>
                            </div>

                            {isCustomQuantityEnabled(item.id, item.quantityKg) ? (
                              <div className="mt-3 grid gap-2">
                                <label className="block">
                                  <span className="mb-2 block text-sm font-semibold text-graphite">Kg personalizados</span>
                                  <input
                                    type="number"
                                    min={1}
                                    step={item.quantityKg <= 1 ? 1 : CUSTOM_QUANTITY_STEP}
                                    value={customQuantityDrafts[item.id] ?? String(item.quantityKg)}
                                    onChange={(event) => handleCustomQuantityDraftChange(item.id, event.target.value)}
                                    onBlur={() => commitCustomQuantityDraft(item.id, item.quantityKg)}
                                    onKeyDown={(event) => {
                                      if (event.key === "Enter") {
                                        event.preventDefault();
                                        commitCustomQuantityDraft(item.id, item.quantityKg);
                                      }
                                    }}
                                    className="h-11 w-full rounded-[0.95rem] border border-line bg-white px-4 text-sm text-graphite outline-none"
                                  />
                                </label>
                                <p className="text-xs leading-5 text-muted">
                                  Puedes escribir `1 kg` o cualquier multiplo de `25 kg`.
                                </p>
                              </div>
                            ) : null}
                          </div>
                        );
                      })
                    )}
                  </div>

                  <div className="mt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setIsCartOpen(false);
                        setIsCheckoutOpen(true);
                      }}
                      className="inline-flex w-full items-center justify-center rounded-[1rem] bg-brand px-4 py-3 text-sm font-semibold text-white transition hover:opacity-95"
                    >
                      Siguiente
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
          {TINTABLE_PRODUCTS.map((product) => (
            <button
              key={product.id}
              type="button"
              onClick={() => handleSelectProduct(product.id)}
              aria-pressed={selectedProductId === product.id}
              className={cn(
                "min-h-11 rounded-full border px-4 py-2 text-[0.82rem] font-semibold transition",
                selectedProductId === product.id
                  ? "border-brand bg-brand text-white shadow-[0_6px_16px_rgba(10,61,145,0.18)]"
                  : "border-line bg-white text-muted hover:border-brand/40 hover:text-graphite",
              )}
            >
              {product.name}
            </button>
          ))}
          <div className="flex w-full justify-center">
            <button
              type="button"
              onClick={() => setIsCompareOpen((c) => !c)}
              aria-expanded={isCompareOpen}
              className={cn(
                "inline-flex min-h-11 items-center gap-1.5 rounded-full border px-4 py-2 text-[0.82rem] font-semibold transition",
                isCompareOpen || compareCount > 0
                  ? "border-brand/30 bg-brand/6 text-brand"
                  : "border-line bg-white text-muted hover:border-brand/40 hover:text-brand",
              )}
            >
              <Layers className="size-3.5" />
              Comparar{compareCount > 0 ? ` (${compareCount})` : ""}
            </button>
          </div>
        </div>

        {cartOrphanToastVisible ? (
          <div className="mt-4 flex items-start justify-between gap-3 rounded-[1.2rem] border border-amber-200 bg-amber-50 px-4 py-3">
            <p className="text-sm text-amber-800">
              <span className="font-semibold">
                {cartOrphanCount === 1 ? "1 configuración" : `${cartOrphanCount} configuraciones`} del carrito anterior
              </span>{" "}
              no {cartOrphanCount === 1 ? "está disponible" : "están disponibles"} en el catálogo actual y{" "}
              {cartOrphanCount === 1 ? "ha sido eliminada" : "han sido eliminadas"} automáticamente.
            </p>
            <button
              type="button"
              onClick={() => setCartOrphanToastVisible(false)}
              className="shrink-0 text-xs font-semibold text-amber-700 underline"
            >
              Cerrar
            </button>
          </div>
        ) : null}

        {isCompareOpen ? (
          <div className="mt-3 rounded-[1.4rem] border border-line/80 bg-white p-4 shadow-[0_14px_36px_rgba(18,32,70,0.04)]">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Layers className="size-5 text-brand" />
                <div>
                  <p className="text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-muted">Comparador de tonos</p>
                  <h2 className="text-[1.1rem] font-bold tracking-[-0.03em] text-graphite">
                    {compareCount === 0 ? "Selecciona hasta 3 colores" : `${compareCount} de 3 colores`}
                  </h2>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {compareCount > 0 ? (
                  <button
                    type="button"
                    onClick={handleClearCompare}
                    className="text-xs font-semibold text-brand"
                  >
                    Limpiar
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => setIsCompareOpen(false)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-line text-muted transition hover:border-brand hover:text-brand"
                  aria-label="Cerrar comparador"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 md:grid-cols-3" role="list" aria-label="Slots del comparador">
              {[0, 1, 2].map((index) => {
                const slotColor = compareColors[index];

                if (!slotColor) {
                  return (
                    <div key={index} role="listitem" className="flex flex-col items-center gap-3 rounded-[1.2rem] border border-dashed border-line bg-[#f8fbff] p-4">
                      <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-dashed border-line/60 bg-white">
                        <span className="text-2xl font-bold text-line">{index + 1}</span>
                      </div>
                      <p className="text-center text-xs text-muted">
                        Pulsa <Layers className="inline size-3" /> en un color para añadirlo
                      </p>
                    </div>
                  );
                }

                return (
                  <div key={index} role="listitem" className="relative flex flex-col items-center gap-2 rounded-[1.2rem] border border-line bg-white p-3">
                    <button
                      type="button"
                      onClick={() => handleRemoveFromCompare(index)}
                      className="absolute right-2 top-2 z-10 inline-flex h-6 w-6 items-center justify-center rounded-full border border-line bg-white/80 text-muted transition hover:border-red-300 hover:text-red-500"
                      aria-label={`Quitar ${slotColor.code} del comparador`}
                    >
                      <X className="size-3" />
                    </button>
                    <div className="aspect-[5/4] w-full overflow-hidden rounded-lg">
                      <MiniProductCanvas
                        model={defaultProductRenderer.buildRenderModel({
                          product: activeProduct,
                          primaryColor: slotColor,
                          compareColor: null,
                          activeSlot: "a",
                        })}
                      />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-bold tracking-[-0.02em] text-graphite">{slotColor.code}</p>
                      <p className="text-xs text-muted">{slotColor.name}</p>
                      {slotColor.hex ? (
                        <p className="mt-1 inline-flex items-center gap-1.5 rounded-full border border-line bg-[#f7f9fc] px-2 py-0.5 text-[0.7rem] font-medium text-muted">
                          <span className="h-2.5 w-2.5 rounded-full border border-black/10" style={{ backgroundColor: slotColor.hex }} />
                          {slotColor.hex.toUpperCase()}
                        </p>
                      ) : null}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleSelectColor(slotColor.code)}
                      className="w-full rounded-lg border border-line bg-[#f7f9fc] px-3 py-1.5 text-xs font-semibold text-brand transition hover:border-brand"
                    >
                      Ver en visor
                    </button>
                  </div>
                );
              })}
            </div>

            {compareCount >= 2 ? (
              <div className="mt-4 rounded-[1rem] border border-line bg-[#f8fbff] p-3">
                <div className="flex items-center gap-2">
                  {compareColors.filter(Boolean).map((c) => (
                    <div key={c!.code} className="flex items-center gap-2">
                      <span className="h-6 w-12 rounded border border-black/5" style={getSwatchStyle(c!)} />
                      <span className="text-xs font-semibold text-graphite">{c!.code}</span>
                    </div>
                  ))}
                </div>
                <p className="mt-2 text-xs text-muted">Compara los tonos lado a lado. Usa el visor para previsualizar cada uno sobre el producto.</p>
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="mt-4 grid grid-cols-[minmax(0,1fr)] justify-items-stretch gap-4 md:grid-cols-[minmax(20rem,0.9fr)_minmax(0,1.1fr)] lg:grid-cols-[24rem_minmax(0,1fr)]">
          <section
            id="catalogo-colores"
            className={cn(
              "rounded-2xl border border-line/80 bg-white p-3 shadow-[0_10px_28px_rgba(18,32,70,0.04)] sm:p-4 md:order-1",
              selectedColor ? "order-2" : "order-1",
            )}
          >
            <div>
              <h2 className="text-[1.15rem] font-bold tracking-[-0.03em] text-graphite">Catálogo de color AGAMA</h2>
              <p className="mt-1 text-xs text-muted">{colors.length} colores con HEX validado</p>
            </div>

            <div className="relative mt-3">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 size-3.5 -translate-y-1/2 text-muted" />
              <input
                type="search"
                value={colorQuery}
                onChange={(event) => setColorQuery(event.target.value)}
                placeholder="Código o nombre..."
                aria-label="Buscar por código o nombre de color"
                className="h-11 w-full rounded-xl border border-line bg-[#f8fbff] pl-9 pr-3 text-sm text-graphite transition placeholder:text-muted focus:border-brand focus:bg-white"
              />
            </div>

            <div
              role="group"
              aria-label="Filtrar por línea"
              className="mt-2.5 grid grid-cols-2 gap-1 rounded-[1.25rem] border border-line bg-[#f4f7fb] p-1 min-[375px]:grid-cols-3"
            >
              {([
                ["all", "Todo"],
                ["masterbatch", "Masterbatch"],
                ["pigmentos", "Pigmentos"],
              ] as const).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setActiveLine(value)}
                  className={cn(
                    "min-h-11 min-w-0 rounded-full px-2 py-2 text-[0.72rem] font-semibold transition min-[390px]:px-3 min-[390px]:text-[0.75rem]",
                    activeLine === value ? "bg-white text-brand shadow-[0_4px_12px_rgba(18,32,70,0.08)]" : "text-muted hover:text-brand",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="hide-scrollbar mt-2 flex gap-1.5 overflow-x-auto pb-1">
              <button
                type="button"
                onClick={() => setActiveFamily("all")}
                className={cn(
                  "min-h-11 shrink-0 rounded-full border px-3 py-2 text-[0.72rem] font-medium transition",
                  activeFamily === "all"
                    ? "border-brand bg-brand text-white"
                    : "border-line bg-white text-muted hover:border-brand/50 hover:text-brand",
                )}
              >
                Todas
              </button>
              {availableFamilies.map((family) => (
                <button
                  key={family}
                  type="button"
                  onClick={() => setActiveFamily((current) => (current === family ? "all" : family))}
                  className={cn(
                    "min-h-11 shrink-0 rounded-full border px-3 py-2 text-[0.72rem] font-medium transition",
                    activeFamily === family
                      ? "border-brand bg-brand text-white"
                      : "border-line bg-white text-muted hover:border-brand/50 hover:text-brand",
                  )}
                >
                  {FAMILY_LABELS[family] ?? family}
                </button>
              ))}
            </div>

            <p className="mt-2.5 border-t border-line/60 pt-2 text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-muted/70">
              {visibleColors.length === colors.length
                ? `${colors.length} colores`
                : `${visibleColors.length} de ${colors.length} colores`}
            </p>

            <div className="mt-1.5 max-h-[58vh] min-h-[18rem] space-y-1.5 overflow-y-auto pr-1 md:max-h-[calc(100vh-24rem)]">
              {visibleColors.length === 0 ? (
                <div className="rounded-[1.1rem] border border-dashed border-line bg-white px-4 py-6 text-center text-sm text-muted">
                  Sin resultados para esta búsqueda. Prueba con otro código, nombre o familia.
                </div>
              ) : (
                visibleColors.map((color) => {
                  const isActive = color.code === selectedColor?.code;
                  const isInCompare = compareSlots.includes(color.code);

                  return (
                    <div key={color.code} className="flex items-stretch gap-1">
                      <button
                        type="button"
                        onClick={() => handleSelectColor(color.code)}
                        aria-pressed={isActive}
                        className={cn(
                          "group flex min-h-14 min-w-0 flex-1 items-center gap-2.5 overflow-hidden rounded-xl border bg-white px-3 py-2 text-left transition",
                          isActive
                            ? "border-brand bg-brand/[0.03] shadow-[0_8px_20px_rgba(10,61,145,0.1)]"
                            : "border-line/80 hover:border-brand/40 hover:shadow-[0_6px_16px_rgba(18,32,70,0.04)]",
                        )}
                      >
                        <span
                          className="h-8 w-8 shrink-0 rounded-full border border-black/5 shadow-[inset_0_1px_2px_rgba(255,255,255,0.5),0_4px_10px_rgba(18,32,70,0.1)]"
                          style={getSwatchStyle(color)}
                        />
                        <span className="min-w-0 flex-1 overflow-hidden">
                          <span className="flex min-w-0 items-baseline gap-1.5">
                            <span className="min-w-0 truncate text-[0.82rem] font-bold tracking-[-0.02em] text-graphite">{color.code}</span>
                            <span className="shrink-0 text-[0.62rem] font-semibold uppercase tracking-[0.08em] text-muted/60">
                              {color.line === "masterbatch" ? "MB" : "PIG"}
                            </span>
                          </span>
                          <span className="block truncate text-[0.72rem] text-muted">{color.name}</span>
                        </span>
                        {isActive ? (
                          <span className="flex h-5.5 w-5.5 shrink-0 items-center justify-center rounded-full bg-brand text-white">
                            <Check className="size-3" />
                          </span>
                        ) : null}
                      </button>
                      <button
                        type="button"
                        onClick={() => isInCompare ? undefined : handleAddToCompare(color.code)}
                        disabled={isInCompare || compareCount >= 3}
                        aria-label={isInCompare ? `${color.code} ya está en el comparador` : `Añadir ${color.code} al comparador`}
                        title={isInCompare ? "Ya en comparador" : compareCount >= 3 ? "Máximo 3 colores" : "Comparar"}
                        className={cn(
                          "flex min-h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition",
                          isInCompare
                            ? "border-brand/30 bg-brand/6 text-brand"
                            : "border-transparent bg-transparent text-muted/40 hover:border-line hover:bg-white hover:text-brand disabled:opacity-30",
                        )}
                      >
                        <Layers className="size-3" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </section>

          <section
            ref={viewerSectionRef}
            aria-label="Visor de producto"
            className={cn(
              "w-full min-w-0 max-w-full scroll-mt-3 self-start overflow-hidden rounded-2xl border border-line/80 bg-white p-3 md:sticky md:top-4 md:order-2 md:p-4",
              selectedColor ? "order-1 max-md:sticky max-md:top-2 max-md:z-20" : "order-2",
            )}
          >
            <div className="flex items-center justify-between gap-2">
              {isBucketSelected && renderUrl ? (
                <div className="inline-flex min-h-8 items-center gap-1.5 whitespace-nowrap rounded-full border border-brand/20 bg-brand/6 px-2 py-1 text-[0.64rem] font-semibold uppercase tracking-[0.1em] text-brand sm:px-2.5 sm:text-[0.68rem]">
                  <span className="h-1.5 w-1.5 rounded-full bg-brand" />
                  Render
                </div>
              ) : (
                <div className="inline-flex min-h-8 items-center gap-1.5 whitespace-nowrap rounded-full border border-line/60 bg-white/80 px-2 py-1 text-[0.64rem] font-semibold uppercase tracking-[0.1em] text-muted sm:px-2.5 sm:text-[0.68rem]">
                  <span className="h-1.5 w-1.5 rounded-full bg-muted/40" />
                  Vista
                </div>
              )}
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={handleDownloadRender}
                  disabled={isDownloading}
                  className="inline-flex min-h-8 items-center justify-center gap-1.5 whitespace-nowrap rounded-full border border-brand bg-brand px-2 py-1 text-[0.68rem] font-semibold text-white shadow-[0_6px_16px_rgba(10,61,145,0.16)] transition hover:bg-brand-strong disabled:opacity-60 sm:px-3 sm:text-xs"
                >
                  <Download className="size-3" />
                  Imagen
                </button>
                <button
                  type="button"
                  onClick={handleOpenFicha}
                  disabled={isDownloading || !selectedColor?.sourceSheetUrl}
                  title={selectedColor ? `Abrir ficha técnica de ${selectedColor.code} en nueva pestaña` : "Abrir ficha técnica"}
                  className="inline-flex min-h-8 items-center justify-center gap-1.5 whitespace-nowrap rounded-full border border-line bg-white px-2 py-1 text-[0.68rem] font-semibold text-muted transition hover:border-brand hover:text-brand disabled:opacity-60 sm:px-3 sm:text-xs"
                >
                  <FileText className="size-3" />
                  Ficha
                </button>
              </div>
            </div>

            <div className="relative mt-3 overflow-hidden rounded-[1.3rem] border border-line/40 bg-[linear-gradient(180deg,#ffffff_0%,#f7f9fc_100%)] px-4 py-4 md:px-6 md:py-5">

              <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-[0.8rem] border border-white bg-white shadow-[0_8px_16px_rgba(18,32,70,0.08)]">
                    {selectedColor?.hex ? (
                      <div className="h-full w-full" style={getSwatchStyle(selectedColor)} />
                    ) : selectedCatalogPreview ? (
                      <Image
                        src={selectedCatalogPreview}
                        alt={`Referencia de catálogo ${selectedColor?.code ?? "neutral"}`}
                        fill
                        unoptimized
                        sizes="40px"
                        className="object-contain p-1"
                      />
                    ) : (
                      <div className="h-full w-full" style={{ background: "linear-gradient(135deg, #f4f7fb 0%, #e5ebf4 100%)" }} />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-muted">Color activo</p>
                    <p className="truncate text-[0.98rem] font-bold tracking-[-0.03em] text-graphite">{selectedColor?.code ?? "Sin selección"}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={!selectedColor}
                  className={cn(
                    "inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-[0.82rem] font-semibold transition disabled:cursor-not-allowed disabled:border-line disabled:bg-white disabled:text-muted sm:min-w-[11rem]",
                    addToCartFeedbackVisible
                      ? "border-[#25d366] bg-[#f2fff5] text-[#12663b]"
                      : "border-brand bg-brand text-white shadow-[0_8px_18px_rgba(10,61,145,0.16)] hover:bg-brand-strong",
                  )}
                >
                  {addToCartFeedbackVisible ? <Check className="size-3.5" /> : <ShoppingCart className="size-3.5" />}
                  {addToCartFeedbackVisible ? "Añadido" : "Añadir al carrito"}
                </button>
              </div>

              <div className="mx-auto w-full max-w-[min(720px,100%)] md:max-w-[min(760px,100%)]">
                {isBucketSelected && renderUrl ? (
                  <div className="relative aspect-[5/4]">
                    <Image
                      key={previewSrc}
                      src={previewSrc}
                      alt={`${activeProduct.name} ${selectedColor?.code ?? "neutral"}`}
                      fill
                      priority
                      unoptimized
                      sizes="(max-width: 1280px) 84vw, 760px"
                      className="object-contain"
                      onError={() => setImageLoadFailed(true)}
                    />
                  </div>
                ) : (
                  <CanvasProductRenderer model={renderModel} ref={canvasRendererRef} />
                )}
              </div>

              <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 rounded-[0.9rem] border border-line/50 bg-white px-3 py-2.5">
                <p className="min-w-0 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-muted">Precio de referencia</p>
                <p className="min-w-0 break-words text-right text-[1rem] font-bold tracking-[-0.03em] text-graphite">
                  {selectedPricePerKg != null ? `${formatCurrencyMxn(selectedPricePerKg)} MXN/kg` : "Consultar"}
                </p>
              </div>

              <div className="relative mt-2.5 rounded-[1rem] border border-line/50 bg-white p-3 shadow-[0_8px_20px_rgba(18,32,70,0.04)]">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0">
                    <p className="text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-muted">Color</p>
                    <p className="mt-0.5 break-words text-[1.05rem] font-bold tracking-[-0.04em] text-graphite">{selectedColor?.name ?? `${activeProduct.name} se muestra en blanco hasta elegir un color.`}</p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {selectedColor?.hex ? (
                      <span className="inline-flex items-center gap-2 rounded-full border border-line bg-[#f7f9fc] px-3 py-1.5 text-[0.82rem] font-medium text-muted">
                        <span
                          className="h-3.5 w-3.5 rounded-full border border-black/10"
                          style={{ backgroundColor: selectedColor.hex }}
                        />
                        {selectedColor.hex.toUpperCase()}
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="mt-2.5 grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
                  <div className="min-w-0">
                    {selectedColor?.shortDescription ? (
                      <p className="break-words text-[0.88rem] leading-5 text-muted">{selectedColor.shortDescription}</p>
                    ) : (
                      <p className="break-words text-[0.88rem] leading-5 text-muted">Selecciona un color del catálogo para visualizar tu producto y solicitar cotización.</p>
                    )}
                    {selectedColor?.visualNote ? (
                      <p className="mt-1 break-words text-[0.82rem] leading-5 text-muted">{selectedColor.visualNote}</p>
                    ) : null}
                  </div>

                  <div className="flex flex-col gap-2.5 md:min-w-[14rem]">
                    {quoteUrl ? (
                      <Link
                        href={quoteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="order-2 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-[#25d366]/40 bg-[#f2fff5] px-4 py-3 text-[0.92rem] font-semibold text-[#12663b] transition hover:bg-[#e7faec]"
                      >
                        <MessageCircle className="size-4" />
                        Solicitar cotización
                      </Link>
                    ) : (
                      <button
                        type="button"
                        disabled
                        className="order-2 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#dceee3] px-4 py-3 text-[0.92rem] font-semibold text-[#5b7a68]"
                      >
                        <MessageCircle className="size-4" />
                        Solicitar cotización
                      </button>
                    )}
                    {selectedColor?.sourceSheetUrl ? (
                      <Link
                        href={selectedColor.sourceSheetUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Ver ficha técnica de ${selectedColor.code} (abre en nueva pestaña)`}
                        className="order-3 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-line bg-white px-4 py-3 text-[0.92rem] font-semibold text-brand transition hover:border-brand"
                      >
                        <FileText className="size-4" />
                        Ver ficha técnica
                      </Link>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        <p className="mt-4 rounded-xl border border-line/80 bg-white/70 px-4 py-3 text-xs leading-5 text-muted">
          La simulación de color es orientativa. El resultado puede variar según material, concentración, proceso de transformación y pantalla. Ventas confirmará disponibilidad y condiciones finales.
        </p>

        </section>

        {isCheckoutOpen ? (
          <div className="fixed inset-0 z-40 overflow-y-auto bg-[linear-gradient(180deg,rgba(245,248,255,0.98)_0%,rgba(237,243,252,0.98)_100%)] px-4 py-6 md:px-8" role="presentation">
            <div
              ref={checkoutDialogRef}
              className="mx-auto max-w-5xl outline-none"
              role="dialog"
              aria-modal="true"
              aria-labelledby="checkout-title"
              tabIndex={-1}
            >
            <div className="rounded-[2rem] border border-white/70 bg-white/95 p-5 shadow-[0_28px_70px_rgba(19,35,78,0.16)] md:p-8">
              <div className="flex flex-col gap-4 border-b border-line/80 pb-6 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-brand">Solicitud comercial</p>
                  <h2 id="checkout-title" className="mt-2 text-[2rem] font-bold tracking-[-0.05em] text-graphite">Resumen del pedido</h2>
                  <p className="mt-2 max-w-[58ch] text-sm leading-6 text-muted">
                    Revisa las configuraciones y cantidades antes de enviar la solicitud al equipo de ventas.
                  </p>
                </div>
                <button
                  ref={checkoutCloseButtonRef}
                  type="button"
                  onClick={() => setIsCheckoutOpen(false)}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-line text-muted transition hover:border-brand hover:text-brand"
                  aria-label="Cerrar resumen del pedido"
                >
                  <X className="size-4" />
                </button>
              </div>

              <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_22rem]">
                <section className="space-y-4">
                  {cartItems.length === 0 ? (
                    <div className="rounded-[1.25rem] border border-dashed border-line bg-[#f8fbff] px-5 py-8 text-sm text-muted">
                      Todavía no hay configuraciones añadidas al pedido.
                    </div>
                  ) : (
                    cartItems.map((item) => {
                      const itemTotal = getCartItemTotal(item);

                      return (
                        <div key={`checkout-${item.id}`} className="rounded-[1.35rem] border border-line bg-white p-5 shadow-[0_14px_34px_rgba(18,32,70,0.05)]">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="text-[1.05rem] font-bold tracking-[-0.03em] text-graphite">{item.colorCode} · {item.colorName}</p>
                              <p className="mt-1 text-sm text-muted">{item.process} · {item.material}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveCartItem(item.id)}
                              className="text-sm font-semibold text-brand"
                            >
                              Quitar
                            </button>
                          </div>

                          <div className="mt-4 grid gap-3 md:grid-cols-[11rem_minmax(0,1fr)_11rem]">
                            <label className="block">
                              <span className="mb-2 block text-sm font-semibold text-graphite">Cantidad</span>
                              <select
                                value={getQuantitySelectValue(item.quantityKg)}
                                onChange={(event) => {
                                  if (event.target.value === "custom") {
                                    handleUpdateCartItemQuantity(item.id, CUSTOM_QUANTITY_THRESHOLD + CUSTOM_QUANTITY_STEP);
                                    return;
                                  }

                                  handleUpdateCartItemQuantity(item.id, Number(event.target.value));
                                }}
                                className="h-11 w-full rounded-[0.95rem] border border-line bg-white px-4 text-sm text-graphite outline-none"
                              >
                                {CART_QUANTITY_OPTIONS.map((option) => (
                                  <option key={`${item.id}-${option}`} value={option}>
                                    {formatQuantityLabel(option)}
                                  </option>
                                ))}
                                <option value="custom">Mas de 100 kg</option>
                              </select>
                            </label>

                            <div className="rounded-[0.95rem] border border-line bg-[#fbfcfe] px-4 py-3">
                              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-muted">Precio web actual</p>
                              <p className="mt-1 text-sm text-muted">
                                {item.pricePerKgMxn != null ? `${formatCurrencyMxn(item.pricePerKgMxn)} MXN/kg` : "Validación comercial"}
                              </p>
                            </div>

                            <div className="rounded-[0.95rem] border border-line bg-[#fbfcfe] px-4 py-3">
                              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-muted">Importe</p>
                              <p className="mt-1 text-base font-bold tracking-[-0.03em] text-graphite">
                                {itemTotal != null ? `${formatCurrencyMxn(itemTotal)} MXN` : "Consultar"}
                              </p>
                            </div>
                          </div>

                          <div className="mt-3">
                            <button
                              type="button"
                              onClick={() => setCustomQuantityItemId((current) => (current === item.id ? null : item.id))}
                              className="text-xs font-semibold text-brand"
                            >
                              {isCustomQuantityEnabled(item.id, item.quantityKg) ? "Ocultar escritura manual" : "Escribir kg"}
                            </button>
                          </div>

                          {isCustomQuantityEnabled(item.id, item.quantityKg) ? (
                            <div className="mt-3">
                              <label className="block">
                                <span className="mb-2 block text-sm font-semibold text-graphite">Kg personalizados</span>
                                <input
                                  type="number"
                                  min={1}
                                  step={item.quantityKg <= 1 ? 1 : CUSTOM_QUANTITY_STEP}
                                  value={customQuantityDrafts[item.id] ?? String(item.quantityKg)}
                                  onChange={(event) => handleCustomQuantityDraftChange(item.id, event.target.value)}
                                  onBlur={() => commitCustomQuantityDraft(item.id, item.quantityKg)}
                                  onKeyDown={(event) => {
                                    if (event.key === "Enter") {
                                      event.preventDefault();
                                      commitCustomQuantityDraft(item.id, item.quantityKg);
                                    }
                                  }}
                                  className="h-11 w-full rounded-[0.95rem] border border-line bg-white px-4 text-sm text-graphite outline-none"
                                />
                              </label>
                              <p className="mt-2 text-xs leading-5 text-muted">
                                Puedes escribir `1 kg` o cualquier multiplo de `25 kg`.
                              </p>
                            </div>
                          ) : null}
                        </div>
                      );
                    })
                  )}
                </section>

                <aside className="rounded-[1.5rem] border border-line bg-[#f8fbff] p-5">
                  <p className="text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-muted">Resumen económico</p>
                  <div className="mt-4 space-y-3 rounded-[1.1rem] border border-white bg-white p-4">
                    <div className="flex items-center justify-between gap-3 text-sm text-muted">
                      <span>Configuraciones</span>
                      <span>{cartItems.length}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3 text-sm text-muted">
                      <span>Cantidad total</span>
                      <span>{cartTotalKg} kg</span>
                    </div>
                    <div className="border-t border-line pt-3">
                      <p className="text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-muted">
                        {cartHasPendingPricing ? "Total parcial" : "Costo total"}
                      </p>
                      <p className="mt-2 text-[1.7rem] font-bold tracking-[-0.05em] text-graphite">
                        {cartItems.length > 0 ? `${formatCurrencyMxn(cartKnownTotal)} MXN` : "Sin items"}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-muted">
                        {cartHasPendingPricing
                          ? "Algunas referencias requieren validación comercial antes del cierre."
                          : "Importe calculado sobre el precio web actual en pesos mexicanos."}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3">
                    <button
                      type="button"
                      onClick={handleDownloadCheckoutPdf}
                      disabled={isDownloading || cartItems.length === 0}
                      className="inline-flex items-center justify-center gap-2 rounded-[1rem] border border-line bg-white px-4 py-3 text-sm font-semibold text-brand transition hover:border-brand disabled:opacity-60"
                    >
                      <FileText className="size-4" />
                      Descargar PDF
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsQuoteFormOpen((current) => !current)}
                      disabled={cartItems.length === 0}
                      aria-expanded={isQuoteFormOpen}
                      className="inline-flex items-center justify-center rounded-[1rem] bg-brand px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-strong disabled:opacity-60"
                    >
                      {isQuoteFormOpen ? "Ocultar formulario" : "Solicitar cotización"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsCheckoutOpen(false)}
                      className="inline-flex items-center justify-center rounded-[1rem] border border-line bg-[#f7f9fc] px-4 py-3 text-sm font-semibold text-muted transition hover:border-brand hover:text-brand"
                    >
                      Volver al configurador
                    </button>
                  </div>
                </aside>
              </div>
              {isQuoteFormOpen ? (
                <div className="mt-6">
                  <QuoteForm
                    items={quoteItems}
                    configurationUrl={shareUrl}
                    whatsappUrl={cartWhatsappUrl}
                    onSubmitted={() => setCartItems([])}
                  />
                </div>
              ) : null}
            </div>
          </div>
          </div>
        ) : null}
      </main>
    </>
  );
}
