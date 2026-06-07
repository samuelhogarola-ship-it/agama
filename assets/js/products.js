/**
 * AGAMA · products.js
 * Fetches and renders product listings from Supabase.
 */

const SUPABASE_URL = 'https://ozexoekvshuhtkrleuze.supabase.co';
const SUPABASE_KEY = 'sb_publishable_nyvRHJ6eZ3aAfSQjVnBzYg_TdVPqpFL';

function escapeHtml(value) {
  if (value == null) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function isBrokenTechSheetUrl() { return false; }

function buildWhatsAppUrl(productName, extraText = '') {
  const base = `Hola AGAMA, me interesa el producto: ${productName}`;
  const text = extraText ? `${base}. ${extraText}` : base;
  return `https://wa.me/525573515156?text=${encodeURIComponent(text)}`;
}

/**
 * Fetch products by tipo_producto
 * @param {'pigmentos'|'masterbatch'|'aditivos'} tipo
 */
async function fetchProducts(tipo) {
  const url = `${SUPABASE_URL}/rest/v1/products`
    + `?tipo_producto=eq.${tipo}`
    + `&published=eq.true`
    + `&select=nombre,slug,descripcion,portada,precio,ficha_tecnica,tipo,acabado,color`
    + `&order=nombre.asc`;

  const res = await fetch(url, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
    },
  });

  if (!res.ok) throw new Error(`Error ${res.status}`);
  return res.json();
}

/**
 * Render a product card
 */
function renderCard(p) {
  const img = p.portada
    ? `<img src="${escapeHtml(p.portada)}" alt="${escapeHtml(p.nombre)}" loading="lazy" class="prod-card-img"/>`
    : `<div class="prod-card-img prod-card-img--placeholder"><span class="icon-font">inventory_2</span></div>`;

  const badge = p.tipo
    ? `<span class="prod-badge">${escapeHtml(p.tipo)}</span>` : '';

  const pdf = p.ficha_tecnica && !isBrokenTechSheetUrl(p.ficha_tecnica)
    ? `<a href="${escapeHtml(p.ficha_tecnica)}" target="_blank" rel="noopener" class="prod-card-pdf">
        <span class="icon-font">picture_as_pdf</span> Ficha técnica
       </a>`
    : `<a href="${buildWhatsAppUrl(p.nombre, 'Quisiera solicitar la ficha técnica.')}" target="_blank" rel="noopener" class="prod-card-pdf prod-card-pdf--fallback">
        <span class="icon-font">description</span> Solicitar ficha
       </a>`;

  const precio = p.precio
    ? `<span class="prod-card-precio">$${Number(p.precio).toLocaleString('es-MX')} MXN</span>` : '';

  const waUrl = buildWhatsAppUrl(p.nombre);

  return `
    <article class="prod-card">
      <div class="prod-card-cover">${img}</div>
      <div class="prod-card-body">
        ${badge}
        <h3 class="prod-card-name">${escapeHtml(p.nombre)}</h3>
        ${p.descripcion ? `<p class="prod-card-desc">${escapeHtml(p.descripcion)}</p>` : ''}
        <div class="prod-card-footer">
          ${precio}
          ${pdf}
          <a href="${waUrl}"
             target="_blank" class="prod-card-wa">
            <img src="/assets/img/whatsapp-white.svg" alt="WhatsApp" width="16"/>
            Cotizar
          </a>
        </div>
      </div>
    </article>`;
}

/**
 * Render skeleton loaders while fetching
 */
function renderSkeletons(container, n = 6) {
  container.innerHTML = Array(n).fill(0).map(() => `
    <article class="prod-card prod-card--skeleton">
      <div class="prod-card-cover prod-card-img--placeholder"></div>
      <div class="prod-card-body">
        <div class="skel skel-badge"></div>
        <div class="skel skel-title"></div>
        <div class="skel skel-desc"></div>
        <div class="skel skel-btn"></div>
      </div>
    </article>`).join('');
}

/**
 * Main init — call this from each product page
 * @param {'pigmentos'|'masterbatch'|'aditivos'} tipo
 */
export async function initProductPage(tipo) {
  const grid    = document.getElementById('products-grid');
  const counter = document.getElementById('products-count');
  const search  = document.getElementById('products-search');
  const errorEl = document.getElementById('products-error');

  if (!grid) return;

  renderSkeletons(grid);

  let allProducts = [];

  try {
    allProducts = await fetchProducts(tipo);
  } catch (err) {
    grid.innerHTML = '';
    if (errorEl) errorEl.hidden = false;
    console.error(err);
    return;
  }

  function render(products) {
    if (products.length === 0) {
      grid.innerHTML = `<div class="prod-empty">
        <span class="icon-font">search_off</span>
        <p>No se encontraron productos con ese término.</p>
      </div>`;
    } else {
      grid.innerHTML = products.map(renderCard).join('');
    }
    if (counter) counter.textContent = products.length;
  }

  render(allProducts);

  // Búsqueda en tiempo real (client-side)
  if (search) {
    search.addEventListener('input', () => {
      const q = search.value.toLowerCase().trim();
      if (!q) return render(allProducts);
      render(allProducts.filter(p =>
        p.nombre.toLowerCase().includes(q) ||
        (p.descripcion || '').toLowerCase().includes(q) ||
        (p.tipo || '').toLowerCase().includes(q)
      ));
    });
  }
}
