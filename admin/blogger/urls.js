const PUBLIC_SITE_ORIGIN = "https://www.agama.com.mx";

/** Resolve editor-facing post and upload paths on AGAMA's public website. */
export function resolvePublicUrl(path) {
  return new URL(path, PUBLIC_SITE_ORIGIN).href;
}
