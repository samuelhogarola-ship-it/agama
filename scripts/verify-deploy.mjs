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
    throw new Error(`HTTP ${response.status}`);
  }

  return response.text();
}

function assertIncludes(html, pattern, message) {
  if (!pattern.test(html)) {
    throw new Error(message);
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
    name: "blog-en",
    path: "/blog/index.en.html",
    verify: (html) => {
      assertIncludes(html, /Get new blog posts by email/i, "Missing English blog newsletter heading.");
      assertIncludes(
        html,
        /data-newsletter-source="agama-blog-en"/i,
        "Missing English blog newsletter form."
      );
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
      assertIncludes(
        html,
        /https:\/\/[^"]*supabase\.co\/storage\/v1\/object\/public\/product-images\//i,
        "Missing Supabase-hosted product image references."
      );
    },
  },
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
