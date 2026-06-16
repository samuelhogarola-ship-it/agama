/**
 * AGAMA · products.js
 * Fetches and renders product listings from Supabase.
 */

const SUPABASE_URL = 'https://ozexoekvshuhtkrleuze.supabase.co';
const SUPABASE_KEY = 'sb_publishable_nyvRHJ6eZ3aAfSQjVnBzYg_TdVPqpFL';
const DEFAULT_CALCULATOR_QUANTITY = 25;

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

function buildQuoteWhatsAppUrl(lines, total, copy) {
  return `https://wa.me/525573515156?text=${encodeURIComponent(copy.buildQuoteMessage(lines, total))}`;
}

function getProductCopy() {
  const isEnglish = document.documentElement.lang?.toLowerCase().startsWith('en');

  if (isEnglish) {
    return {
      locale: 'en',
      currency: 'en-US',
      emptySearch: 'No products matched that search.',
      quoteTitle: 'Quote calculator',
      quoteIntro: 'Build an estimated budget, add several items, and send the full request to WhatsApp.',
      lineProduct: 'Product',
      lineQuantity: 'Kg',
      lineSubtotal: 'Subtotal',
      addLine: 'Add product',
      removeLine: 'Remove',
      totalLabel: 'Estimated total',
      quoteButton: 'Send quote via WhatsApp',
      assistantNote: 'Bonny Pellet can use this same estimate as a starting point for your quote.',
      emptyCalculator: 'No priced products are available yet for this category.',
      lineFallback: 'Select a product',
      techSheetLabel: 'Technical sheet',
      requestSheetLabel: 'Request technical sheet',
      quoteLabel: 'Quote',
      defaultWhatsAppDetail: (quantity, total) =>
        `I would like a quote for approximately ${quantity} kg. Estimated total seen online: $${total} MXN.`,
      buildQuoteMessage: (lines, total) => [
        'Hello AGAMA, I would like a quote with this estimate:',
        ...lines.map((line) => `- ${line.name}: ${line.quantity} kg = $${line.subtotal} MXN`),
        `Estimated total: $${total} MXN.`,
        'Please confirm availability, final price, and shipping.',
      ].join('\n'),
    };
  }

  return {
    locale: 'es',
    currency: 'es-MX',
    emptySearch: 'No se encontraron productos con ese término.',
    quoteTitle: 'Calculadora de presupuesto',
    quoteIntro: 'Arma una estimación, suma varios productos y envía el presupuesto completo por WhatsApp.',
    lineProduct: 'Producto',
    lineQuantity: 'Kg',
    lineSubtotal: 'Subtotal',
    addLine: 'Añadir producto',
    removeLine: 'Quitar',
    totalLabel: 'Total estimado',
    quoteButton: 'Enviar presupuesto por WhatsApp',
    assistantNote: 'Bonny Pellet puede usar esta misma estimación como base para ayudarte con la cotización.',
    emptyCalculator: 'Todavía no hay productos con precio visible en esta categoría.',
    lineFallback: 'Selecciona un producto',
    techSheetLabel: 'Ficha técnica',
    requestSheetLabel: 'Solicitar ficha',
    quoteLabel: 'Cotizar',
    defaultWhatsAppDetail: (quantity, total) =>
      `Quisiera cotizar aproximadamente ${quantity} kg. Total estimado visto en web: $${total} MXN.`,
    buildQuoteMessage: (lines, total) => [
      'Hola AGAMA, quiero cotizar este presupuesto estimado:',
      ...lines.map((line) => `- ${line.name}: ${line.quantity} kg = $${line.subtotal} MXN`),
      `Total estimado: $${total} MXN.`,
      'Por favor confirmen disponibilidad, precio final y envío.',
    ].join('\n'),
  };
}

function formatPrice(value, locale) {
  return Number(value).toLocaleString(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
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
function renderCard(p, copy) {
  const detailHref = copy.locale === 'en' ? `${escapeHtml(p.slug)}/index.en.html` : `${escapeHtml(p.slug)}/`;
  const img = p.portada
    ? `<img src="${escapeHtml(p.portada)}" alt="${escapeHtml(p.nombre)}" loading="lazy" class="prod-card-img"/>`
    : `<div class="prod-card-img prod-card-img--placeholder"><span class="icon-font">inventory_2</span></div>`;

  const badge = p.tipo
    ? `<span class="prod-badge">${escapeHtml(p.tipo)}</span>` : '';

  const pdf = p.ficha_tecnica && !isBrokenTechSheetUrl(p.ficha_tecnica)
    ? `<a href="${escapeHtml(p.ficha_tecnica)}" target="_blank" rel="noopener" class="prod-card-pdf">
        <span class="icon-font">picture_as_pdf</span> ${copy.techSheetLabel}
       </a>`
    : `<a href="${buildWhatsAppUrl(p.nombre, copy.locale === 'en' ? 'I would like to request the technical sheet.' : 'Quisiera solicitar la ficha técnica.')}" target="_blank" rel="noopener" class="prod-card-pdf prod-card-pdf--fallback">
        <span class="icon-font">description</span> ${copy.requestSheetLabel}
       </a>`;

  const hasPrice = p.precio != null && p.precio !== '';
  const priceValue = hasPrice ? Number(p.precio) : null;
  const priceDisplay = hasPrice
    ? `<span class="prod-card-precio">$${formatPrice(priceValue, copy.currency)} MXN</span>` : '';

  const waUrl = buildWhatsAppUrl(
    p.nombre,
    hasPrice ? copy.defaultWhatsAppDetail(DEFAULT_CALCULATOR_QUANTITY, formatPrice(priceValue * DEFAULT_CALCULATOR_QUANTITY, copy.currency)) : ''
  );

  return `
    <article class="prod-card">
      <a href="${detailHref}" class="prod-card-cover" aria-label="${escapeHtml(p.nombre)}">
        <div class="prod-card-cover-inner">${img}</div>
      </a>
      <div class="prod-card-body">
        ${badge}
        <h3 class="prod-card-name"><a href="${detailHref}">${escapeHtml(p.nombre)}</a></h3>
        ${p.descripcion ? `<p class="prod-card-desc">${escapeHtml(p.descripcion)}</p>` : ''}
        <div class="prod-card-footer">
          ${priceDisplay}
          ${pdf}
          <a href="${waUrl}"
             target="_blank" class="prod-card-wa">
            <img src="/assets/img/whatsapp-white.svg" alt="WhatsApp" width="16"/>
            ${copy.quoteLabel}
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
      <div class="prod-card-cover">
        <div class="prod-card-cover-inner prod-card-img--placeholder"></div>
      </div>
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
  const calculator = ensureCalculatorContainer();
  const grid    = document.getElementById('products-grid');
  const counter = document.getElementById('products-count');
  const search  = document.getElementById('products-search');
  const errorEl = document.getElementById('products-error');
  const copy = getProductCopy();

  if (!grid) return;

  renderSkeletons(grid);

  let allProducts = [];

  try {
    allProducts = await fetchProducts(tipo);
  } catch (err) {
    if (calculator) calculator.hidden = true;
    grid.innerHTML = '';
    if (errorEl) errorEl.hidden = false;
    console.error(err);
    return;
  }

  renderQuoteCalculator(calculator, allProducts, copy);

  function render(products) {
    if (products.length === 0) {
      grid.innerHTML = `<div class="prod-empty">
        <span class="icon-font">search_off</span>
        <p>${copy.emptySearch}</p>
      </div>`;
    } else {
      grid.innerHTML = products.map((product) => renderCard(product, copy)).join('');
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

function renderQuoteCalculator(container, products, copy) {
  if (!container) return;

  const pricedProducts = products
    .filter((product) => product.precio != null && product.precio !== '')
    .map((product) => ({ ...product, priceNumber: Number(product.precio) }))
    .filter((product) => Number.isFinite(product.priceNumber) && product.priceNumber > 0);

  if (pricedProducts.length === 0) {
    container.hidden = false;
    container.innerHTML = `
      <section class="quote-calculator">
        <div class="quote-calculator__header">
          <h2>${copy.quoteTitle}</h2>
          <p>${copy.emptyCalculator}</p>
        </div>
      </section>`;
    return;
  }

  const state = [
    { slug: pricedProducts[0].slug, quantity: DEFAULT_CALCULATOR_QUANTITY },
  ];

  container.hidden = false;
  container.innerHTML = `
    <section class="quote-calculator">
      <div class="quote-calculator__header">
        <h2>${copy.quoteTitle}</h2>
        <p>${copy.quoteIntro}</p>
      </div>
      <div class="quote-calculator__rows" data-quote-rows></div>
      <div class="quote-calculator__actions">
        <button type="button" class="quote-calculator__add" data-action="add-line">${copy.addLine}</button>
      </div>
      <div class="quote-calculator__footer">
        <div class="quote-calculator__summary">
          <span>${copy.totalLabel}</span>
          <strong data-quote-total>$0 MXN</strong>
        </div>
        <a href="https://wa.me/525573515156" target="_blank" rel="noopener noreferrer" class="quote-calculator__send" data-quote-send>
          ${copy.quoteButton}
        </a>
      </div>
      <p class="quote-calculator__note">${copy.assistantNote}</p>
    </section>`;

  const rowsHost = container.querySelector('[data-quote-rows]');
  const totalEl = container.querySelector('[data-quote-total]');
  const sendLink = container.querySelector('[data-quote-send]');

  function getProductBySlug(slug) {
    return pricedProducts.find((product) => product.slug === slug) || pricedProducts[0];
  }

  function buildRowsMarkup() {
    return state.map((line, index) => {
      const selectedProduct = getProductBySlug(line.slug);
      const subtotal = formatPrice(selectedProduct.priceNumber * line.quantity, copy.currency);
      const options = pricedProducts.map((product) => `
        <option value="${escapeHtml(product.slug)}"${product.slug === selectedProduct.slug ? ' selected' : ''}>
          ${escapeHtml(product.nombre)} - $${formatPrice(product.priceNumber, copy.currency)} MXN/kg
        </option>
      `).join('');

      return `
        <div class="quote-calculator__line" data-line-index="${index}">
          <div class="quote-calculator__field quote-calculator__field--product">
            <label>${copy.lineProduct}</label>
            <select data-role="product-select" data-index="${index}">
              <option value="">${copy.lineFallback}</option>
              ${options}
            </select>
          </div>
          <div class="quote-calculator__field quote-calculator__field--quantity">
            <label>${copy.lineQuantity}</label>
            <input type="number" min="1" step="1" value="${line.quantity}" inputmode="numeric" data-role="quantity-input" data-index="${index}"/>
          </div>
          <div class="quote-calculator__field quote-calculator__field--subtotal">
            <label>${copy.lineSubtotal}</label>
            <strong>$${subtotal} MXN</strong>
          </div>
          <div class="quote-calculator__field quote-calculator__field--remove">
            <button type="button" data-action="remove-line" data-index="${index}"${state.length === 1 ? ' disabled' : ''}>${copy.removeLine}</button>
          </div>
        </div>`;
    }).join('');
  }

  function sync() {
    rowsHost.innerHTML = buildRowsMarkup();
    const lines = state.map((line) => {
      const product = getProductBySlug(line.slug);
      return {
        name: product.nombre,
        quantity: line.quantity,
        subtotal: formatPrice(product.priceNumber * line.quantity, copy.currency),
        amount: product.priceNumber * line.quantity,
      };
    });
    const total = formatPrice(lines.reduce((sum, line) => sum + line.amount, 0), copy.currency);
    totalEl.textContent = `$${total} MXN`;
    sendLink.href = buildQuoteWhatsAppUrl(lines, total, copy);
  }

  container.addEventListener('click', (event) => {
    const action = event.target.closest('[data-action]');
    if (!action) return;

    if (action.dataset.action === 'add-line') {
      state.push({ slug: pricedProducts[0].slug, quantity: DEFAULT_CALCULATOR_QUANTITY });
      sync();
      return;
    }

    if (action.dataset.action === 'remove-line') {
      const index = Number(action.dataset.index);
      if (state.length > 1) {
        state.splice(index, 1);
        sync();
      }
    }
  });

  container.addEventListener('input', (event) => {
    const index = Number(event.target.dataset.index);
    if (event.target.dataset.role === 'quantity-input' && state[index]) {
      state[index].quantity = Math.max(1, Number(event.target.value) || 1);
      sync();
    }
  });

  container.addEventListener('change', (event) => {
    const index = Number(event.target.dataset.index);
    if (event.target.dataset.role === 'product-select' && state[index]) {
      state[index].slug = event.target.value || pricedProducts[0].slug;
      sync();
    }
  });

  sync();
}

function ensureCalculatorContainer() {
  const existing = document.getElementById('products-calculator');
  if (existing) return existing;

  const calculator = document.createElement('div');
  calculator.id = 'products-calculator';
  calculator.className = 'products-calculator-wrap';
  calculator.hidden = true;

  const toolbar = document.querySelector('.products-toolbar');
  const grid = document.getElementById('products-grid');

  if (toolbar?.parentNode) {
    toolbar.insertAdjacentElement('afterend', calculator);
    return calculator;
  }

  if (grid?.parentNode) {
    grid.parentNode.insertBefore(calculator, grid);
    return calculator;
  }

  document.body.appendChild(calculator);
  return calculator;
}
