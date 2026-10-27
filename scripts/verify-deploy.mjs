const args = process.argv.slice(2);

function getArgValue(flag) {
  const index = args.indexOf(flag);
  if (index === -1) return null;
  return args[index + 1] || null;
}

function normalizeBaseUrl(input) {
  if (!input) return null;
  return input.endsWith("/") ? input.slice(0, -1) : input;
}

async function fetchPage(url) {
  let response;

  try {
    response = await fetch(url, {
      headers: {
        "user-agent": "AGAMA-deploy-verifier/1.0",
      },
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(`Network request failed for ${url}: ${detail}`);
  }

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} ${response.statusText} for ${response.url || url}`);
  }

  return response.text();
}

function assertIncludes(html, pattern, message) {
  if (!pattern.test(html)) {
    throw new Error(message);
  }
}

function verifyProductAssets(html, requireImageDownload = false) {
  if (/(?:https?:\/\/[^"'\s<>]+\/storage\/v1\/object\/public\/(?:product-images|product-tech-sheets)\/|https?:\/\/(?:[^/.]+\.)*(?:website-files|webflow)\.com\/)/i.test(html)) {
    throw new Error("Product assets still reference remote Storage or Webflow URLs.");
  }
  assertIncludes(html, /<img\b[^>]*\bsrc="\/assets\/product-media\/images\/[^"<>]+\.webp"/i,
    "Missing same-origin product image.");
  assertIncludes(html, /<a\b(?=[^>]*\bhref="\/assets\/product-media\/tech-sheets\/[^"<>]+\.pdf")(?=[^>]*\sdownload(?:\s|=|>))[^>]*>/i,
    "Missing same-origin PDF download.");
  if (requireImageDownload) {
    assertIncludes(html, /<a\b(?=[^>]*\bhref="\/assets\/product-media\/images\/[^"<>]+\.webp")(?=[^>]*\sdownload(?:\s|=|>))[^>]*>/i,
      "Missing same-origin image download.");
  }
}

const baseUrl = normalizeBaseUrl(getArgValue("--url") || process.env.DEPLOY_URL);

if (!baseUrl) {
  console.error("Usage: npm run verify:deploy -- --url https://your-deployed-site");
  process.exit(1);
}

const checks = [
  {
    name: "home",
    path: "/",
    verify: (html) => {
      assertIncludes(
        html,
        /Pigmentos, Masterbatch y Aditivos|Pigments, Masterbatch & Additives/i,
        "Missing main hero copy."
      );
      assertIncludes(
        html,
        /data-newsletter-source="agama-home"|data-newsletter-source="agama-home-en"/i,
        "Missing landing newsletter form."
      );
    },
  },
  {
    name: "blog-es",
    path: "/blog/",
    verify: (html) => {
      assertIncludes(html, /Boletín AGAMA/i, "Missing Spanish blog newsletter heading.");
      assertIncludes(
        html,
        /data-newsletter-source="agama-blog"/i,
        "Missing Spanish blog newsletter form."
      );
    },
  },
  {
    name: "faqs",
    path: "/faqs/",
    verify: (html) => {
      assertIncludes(html, /Preguntas frecuentes|FAQs/i, "Missing FAQs page content.");
      assertIncludes(html, /Dudas comunes antes de pedir con AGAMA/i, "Missing FAQs hero copy.");
    },
  },
  {
    name: "blog-en",
    path: "/blog/index.en.html",
    verify: (html) => {
      assertIncludes(html, /Current English posts/i, "Missing English blog hub heading.");
      assertIncludes(html, /href="[^" ]*entrada-de-blog\//i, "Missing English blog article links.");
    },
  },
  {
    name: "contacto",
    path: "/contacto/",
    verify: (html) => {
      assertIncludes(html, /data-contact-form/i, "Missing contact form marker.");
      assertIncludes(html, /Enviar mensaje|Send message/i, "Missing contact submit CTA.");
    },
  },
  {
    name: "vacantes",
    // Keep this in sync if the active AGAMA vacancy slug changes or is removed.
    path: "/vacantes/jefe-de-reclutamiento-y-seleccion/",
    verify: (html) => {
      assertIncludes(html, /cv_url|curriculum|Postularme|Apply/i, "Missing jobs application form markers.");
    },
  },
  {
    name: "catalogo",
    path: "/productos/masterbatch/",
    verify: (html) => {
      assertIncludes(html, /Masterbatch/i, "Missing catalogue keyword.");
      verifyProductAssets(html);
    },
  },
  {
    name: "catalogo-en",
    path: "/productos/masterbatch/index.en.html",
    verify: (html) => verifyProductAssets(html),
  },
  ...["", "index.en.html"].map((locale) => ({
    name: `producto-${locale ? "en" : "es"}`,
    path: `/productos/masterbatch/mb-101-mb-amarillo-huevo/${locale}`,
    verify: (html) => verifyProductAssets(html, true),
  })),
];

const results = [];

console.log("== AGAMA deploy verification ==");
console.log(`Base URL: ${baseUrl}`);

for (const check of checks) {
  const url = `${baseUrl}${check.path}`;
  const start = Date.now();

  try {
    console.log(`\n[check] ${check.name} -> ${url}`);
    const html = await fetchPage(url);
    check.verify(html);
    results.push({
      ...check,
      ok: true,
      ms: Date.now() - start,
    });
    console.log(`[ok] ${check.name} (${Date.now() - start}ms)`);
  } catch (error) {
    results.push({
      ...check,
      ok: false,
      ms: Date.now() - start,
      error: error instanceof Error ? error.message : String(error),
    });
    console.error(`[fail] ${check.name}: ${results.at(-1).error}`);
  }
}

const failed = results.filter((result) => !result.ok);

console.log("\n== Summary ==");
for (const result of results) {
  console.log(`${result.ok ? "OK" : "FAIL"}  ${result.name}  ${result.path}`);
}

if (failed.length > 0) {
  console.error(`\nDeploy verification failed: ${failed.length} check(s) need attention.`);
  process.exit(1);
}

console.log("\nDeploy verification passed.");
