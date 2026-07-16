from __future__ import annotations

import colorsys
import io
import math
from pathlib import Path
from typing import Iterable
from urllib.request import urlopen

from PIL import Image, ImageDraw, ImageEnhance, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
BASE_IMAGE_PATH = ROOT / "public" / "products" / "bucket-base.webp"
MASK_OUTPUT_PATH = ROOT / "public" / "products" / "bucket-mask.webp"
RENDERS_DIR = ROOT / "public" / "renders" / "bucket"


RENDER_SPECS = {
    "MB-103": {"hex": "#FFD200"},
    "MB-106": {"hex": "#0057B8"},
    "MB-110": {
        "swatch": "https://ozexoekvshuhtkrleuze.supabase.co/storage/v1/object/public/product-images/masterbatch/mb-110-mb-negro-kalo-economico/cover.webp",
        "swatch_local": str(ROOT / "public" / "renders" / "bucket" / "swatches" / "MB-110.webp"),
    },
}


def parse_hex(value: str) -> tuple[int, int, int]:
    value = value.lstrip("#")
    return tuple(int(value[index : index + 2], 16) for index in (0, 2, 4))


def rgb_to_hex(rgb: tuple[int, int, int]) -> str:
    return "#{:02X}{:02X}{:02X}".format(*rgb)


def clamp(channel: float) -> int:
    return max(0, min(255, int(round(channel))))


def sample_color_from_swatch(url: str, local_fallback: str | None = None) -> tuple[int, int, int]:
    payload: bytes | None = None

    if local_fallback and Path(local_fallback).exists():
        payload = Path(local_fallback).read_bytes()
    else:
        with urlopen(url) as response:
            payload = response.read()

    swatch = Image.open(io.BytesIO(payload)).convert("RGBA")
    width, height = swatch.size
    center_x = width / 2
    center_y = height / 2
    radius = min(width, height) * 0.36

    weighted_r = 0.0
    weighted_g = 0.0
    weighted_b = 0.0
    total_weight = 0.0

    for y in range(height):
        for x in range(width):
            dx = x - center_x
            dy = y - center_y
            if math.hypot(dx, dy) > radius:
                continue

            r, g, b, a = swatch.getpixel((x, y))
            if a < 20:
                continue
            if r > 245 and g > 245 and b > 245:
                continue

            _, l, s = colorsys.rgb_to_hls(r / 255, g / 255, b / 255)
            if s < 0.02 and l > 0.9:
                continue

            weight = max(0.15, 1.0 - l * 0.45)
            weighted_r += r * weight
            weighted_g += g * weight
            weighted_b += b * weight
            total_weight += weight

    if total_weight == 0:
        raise RuntimeError(f"No pude muestrear color util desde {url}")

    sampled = (
        clamp(weighted_r / total_weight),
        clamp(weighted_g / total_weight),
        clamp(weighted_b / total_weight),
    )
    return sampled


def apply_morphological_closing(mask: Image.Image, radius: int = 10) -> Image.Image:
    if radius <= 0:
        return mask

    kernel_size = radius * 2 + 1
    closed = mask.filter(ImageFilter.MaxFilter(kernel_size))
    closed = closed.filter(ImageFilter.MinFilter(kernel_size))
    return closed


def build_bucket_mask(size: tuple[int, int]) -> Image.Image:
    mask = Image.new("L", size, 0)
    draw = ImageDraw.Draw(mask)

    # Outer lip and visible top plastic.
    draw.ellipse((150, 208, 1102, 364), fill=255)
    draw.ellipse((214, 236, 1038, 314), fill=214)

    # Upper structural rings.
    draw.rounded_rectangle((158, 294, 1096, 354), radius=20, fill=255)
    draw.rounded_rectangle((164, 352, 1090, 402), radius=18, fill=255)
    draw.rounded_rectangle((172, 412, 1082, 456), radius=18, fill=255)

    # Main bucket wall.
    draw.polygon(
        [
            (188, 348),
            (1066, 348),
            (992, 1036),
            (262, 1036),
        ],
        fill=255,
    )
    draw.ellipse((248, 968, 1008, 1118), fill=255)

    # Front emboss zone broad enough to keep the logo inside the tinted body.
    draw.ellipse((372, 548, 882, 940), fill=255)

    # Remove metallic handles and side background by carving side windows.
    draw.polygon([(0, 250), (136, 324), (176, 1034), (0, 1254)], fill=0)
    draw.polygon([(1254, 250), (1118, 324), (1078, 1034), (1254, 1254)], fill=0)

    mask = apply_morphological_closing(mask, radius=10)
    return mask.filter(ImageFilter.GaussianBlur(0.55))


def build_browser_mask(mask: Image.Image) -> Image.Image:
    browser_mask = Image.new("RGBA", mask.size, (255, 255, 255, 0))
    browser_mask.putalpha(mask)
    return browser_mask


def build_tinted_bucket(base: Image.Image, mask: Image.Image, rgb: tuple[int, int, int]) -> Image.Image:
    base_rgba = base.convert("RGBA")
    grayscale = base_rgba.convert("L")
    grayscale = ImageEnhance.Contrast(grayscale).enhance(1.22)

    result = base_rgba.copy()
    result_pixels = result.load()
    gray_pixels = grayscale.load()
    mask_pixels = mask.load()

    for y in range(base_rgba.height):
        for x in range(base_rgba.width):
            alpha = mask_pixels[x, y]
            if alpha <= 5:
                continue

            luminance = gray_pixels[x, y] / 255
            shadow_strength = 0.22 + luminance * 0.92
            shadow_strength = min(1.18, max(0.14, shadow_strength))

            r = rgb[0] * shadow_strength
            g = rgb[1] * shadow_strength
            b = rgb[2] * shadow_strength

            gloss = max(0.0, (luminance - 0.8) / 0.2) * 0.48
            r = r * (1.0 - gloss) + 255 * gloss
            g = g * (1.0 - gloss) + 255 * gloss
            b = b * (1.0 - gloss) + 255 * gloss

            # Preserve some of the original local shading and emboss detail.
            base_r, base_g, base_b, base_a = result_pixels[x, y]
            mix = alpha / 255
            keep_base = 0.18
            out_r = clamp((r * (1.0 - keep_base) + base_r * keep_base) * mix + base_r * (1.0 - mix))
            out_g = clamp((g * (1.0 - keep_base) + base_g * keep_base) * mix + base_g * (1.0 - mix))
            out_b = clamp((b * (1.0 - keep_base) + base_b * keep_base) * mix + base_b * (1.0 - mix))
            result_pixels[x, y] = (out_r, out_g, out_b, base_a)

    return result


def ensure_output_dirs() -> None:
    RENDERS_DIR.mkdir(parents=True, exist_ok=True)


def generate(codes: Iterable[str]) -> None:
    ensure_output_dirs()
    base = Image.open(BASE_IMAGE_PATH).convert("RGBA")
    mask = build_bucket_mask(base.size)
    build_browser_mask(mask).save(MASK_OUTPUT_PATH, format="WEBP", lossless=True, quality=100)

    for code in codes:
        spec = RENDER_SPECS[code]
        if "hex" in spec:
            rgb = parse_hex(spec["hex"])
            source = spec["hex"]
        else:
            rgb = sample_color_from_swatch(spec["swatch"], spec.get("swatch_local"))
            source = rgb_to_hex(rgb)

        render = build_tinted_bucket(base, mask, rgb)
        output = RENDERS_DIR / f"{code}.webp"
        render.save(output, format="WEBP", quality=98, method=6)
        print(f"{code}: {output.name} <- {source}")


if __name__ == "__main__":
    generate(["MB-103", "MB-106", "MB-110"])
