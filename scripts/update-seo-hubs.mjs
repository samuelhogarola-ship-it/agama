import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { productFamilies } from "./seo-content-data.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const START = "<!-- pr164-clusters:start -->";
const END = "<!-- pr164-clusters:end -->";

const hubs = {
  masterbatch: ["masterbatch/index.html", "masterbatch/index.en.html"],
  pigment: ["pigmentos/index.html", "pigmentos/index.en.html"],
  additive: ["aditivos/index.html", "aditivos/index.en.html"],
};

function route(family, locale, intent) {
  return `/entrada-de-blog/${family.routes[locale][intent]}/${locale === "en" ? "index.en.html" : ""}`;
}

function stripBlock(html) {
  const pattern = new RegExp(`${START}[\\s\\S]*?${END}\\n?`, "g");
  return html.replace(pattern, "");
}

function ensureCss(html, depth = "../") {
  if (html.includes("seo-hubs.css")) return html;
  return html.replace("</head>", `  <link href="${depth}assets/css/seo-hubs.css?v=20260902" rel="stylesheet"/>\n</head>`);
}

function clusterBlock(category, locale) {
  const isEn = locale === "en";
  const relevant = productFamilies.filter((family) => family.category === category);
  const copy = isEn
    ? { eyebrow: "Technical library", title: "Reviewed product guides", intro: "Choose a product family, then open the scope, application guide, or verified answers for that same grade.", links: ["Product brief", "Application guide", "Questions and answers"] }
    : { eyebrow: "Biblioteca técnica", title: "Guías revisadas por familia", intro: "Elige una familia y consulta su alcance, la guía de aplicación o las respuestas verificadas para esa misma clave.", links: ["Ficha práctica", "Guía de aplicación", "Preguntas y respuestas"] };
  const cards = relevant.map((family) => {
    const localized = family[locale];
    return `<article class="seo-cluster"><h3>${localized.code}</h3><nav aria-label="${localized.code}"><a href="${route(family, locale, "spotlight")}">${copy.links[0]}</a><a href="${route(family, locale, "guide")}">${copy.links[1]}</a><a href="${route(family, locale, "faq")}">${copy.links[2]}</a></nav></article>`;
  }).join("");
  return `${START}<section class="seo-clusters" aria-labelledby="reviewed-guides"><div class="seo-clusters__inner"><span class="seo-clusters__eyebrow">${copy.eyebrow}</span><h2 id="reviewed-guides">${copy.title}</h2><p class="seo-clusters__intro">${copy.intro}</p><div class="seo-clusters__grid">${cards}</div></div></section>${END}\n`;
}

for (const [category, files] of Object.entries(hubs)) {
  for (const relative of files) {
    const locale = relative.endsWith("index.en.html") ? "en" : "es";
    const file = path.join(ROOT, relative);
    let html = stripBlock(await readFile(file, "utf8"));
    html = ensureCss(html);
    html = html.replace("</main>", `${clusterBlock(category, locale)}</main>`);
    await writeFile(file, html, "utf8");
  }
}

const educational = [
  ["Five signs to review your colorant supplier", "/entrada-de-blog/5-signs-switch-plastic-colorant-supplier/index.en.html"],
  ["How to evaluate a Mexican pigment supplier", "/entrada-de-blog/how-to-evaluate-mexican-pigment-supplier-us-plastics/index.en.html"],
  ["Masterbatch or liquid colorant?", "/entrada-de-blog/masterbatch-vs-liquid-colorant-which-is-right/index.en.html"],
  ["USMCA checks for plastic inputs", "/entrada-de-blog/usmca-rules-of-origin-plastics-what-us-buyers-need/index.en.html"],
  ["What is masterbatch?", "/entrada-de-blog/what-is-masterbatch-guide-plastics-manufacturers/index.en.html"],
  ["Evaluating masterbatch supply from Mexico", "/entrada-de-blog/why-us-manufacturers-source-masterbatch-from-mexico/index.en.html"],
];

const resourcesBlock = `${START}<section class="seo-clusters" aria-labelledby="us-resources"><div class="seo-clusters__inner"><span class="seo-clusters__eyebrow">US buyer resources</span><h2 id="us-resources">Practical reading for plastics teams</h2><p class="seo-clusters__intro">Six reviewed articles on supplier qualification, colorant formats, masterbatch, and cross-border purchasing.</p><div class="seo-clusters__grid">${educational.map(([title, href]) => `<article class="seo-cluster"><h3>${title}</h3><nav><a href="${href}">Read article</a></nav></article>`).join("")}</div></div></section>${END}\n`;

{
  const file = path.join(ROOT, "blog/index.en.html");
  let html = stripBlock(await readFile(file, "utf8"));
  html = ensureCss(html);
  html = html.replace("</main>", `${resourcesBlock}</main>`);
  await writeFile(file, html, "utf8");
}

const servicesBlock = `${START}<section class="seo-clusters" aria-labelledby="professional-services"><div class="seo-clusters__inner"><span class="seo-clusters__eyebrow">Technical contact</span><h2 id="professional-services">Plan a focused conversation with AGAMA</h2><p class="seo-clusters__intro">Choose the format that fits the discussion. Dates and availability are confirmed directly by the AGAMA team.</p><div class="seo-clusters__grid"><article class="seo-cluster"><h3>Request a factory visit</h3><nav><a href="/eventos/factory-visit/index.en.html">Review visit scope</a></nav></article><article class="seo-cluster"><h3>Request a virtual consultation</h3><nav><a href="/eventos/virtual-consultation/index.en.html">Review consultation scope</a></nav></article></div></div></section>${END}\n`;

{
  const file = path.join(ROOT, "eventos/index.en.html");
  let html = stripBlock(await readFile(file, "utf8"));
  html = ensureCss(html);
  html = html.replace("</main>", `${servicesBlock}</main>`);
  await writeFile(file, html, "utf8");
}

console.log("Updated category, blog, and service discovery hubs.");
