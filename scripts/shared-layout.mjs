export function buildNav(depthOrOptions = 0, localeArg = 'es', switchHrefArg = null) {
  const options =
    typeof depthOrOptions === 'object' && depthOrOptions !== null
      ? depthOrOptions
      : { depth: depthOrOptions, locale: localeArg, switchHref: switchHrefArg };

  const depth = Number.isFinite(options.depth) ? options.depth : 0;
  const root = options.root ?? (depth === 0 ? '/' : '../'.repeat(depth));
  const locale = options.locale || 'es';
  const isEnglish = locale === 'en';
  const current = options.current || '';
  const productsLabel = isEnglish ? 'Products' : 'Productos';
  const branchesLabel = isEnglish ? 'Branches' : 'Puntos de venta';
  const onlineLabel = isEnglish ? 'Online store' : 'Tienda online';
  const blogLabel = isEnglish ? 'AGAMA Blog' : 'Blog AGAMA';
  const eventsLabel = isEnglish ? 'Events' : 'Eventos';
  const contactLabel = isEnglish ? 'Contact' : 'Contacto';
  const homeLabel = isEnglish ? 'Home' : 'Inicio';
  const pigmentsLabel = isEnglish ? 'Pigments' : 'Pigmentos';
  const masterbatchLabel = 'Masterbatch';
  const additivesLabel = isEnglish ? 'Additives' : 'Aditivos';
  const whatsappLabel = 'WhatsApp';
  const switchLabel = isEnglish ? 'ES' : 'EN';
  const switchAria = isEnglish ? 'Cambiar a español' : 'Switch to English';
  const hasLanguageSwitch = options.switchHref !== false;
  const switchTarget = options.switchHref || (isEnglish ? `${root}index.html` : `${root}index.en.html`);
  const homeHref = isEnglish ? `${root}index.en.html` : `${root}`;
  const productsHref = isEnglish ? `${root}productos/index.en.html` : `${root}productos/`;
  const pigmentsHref = isEnglish ? `${root}productos/pigmentos/index.en.html` : `${root}productos/pigmentos/`;
  const masterbatchHref = isEnglish ? `${root}productos/masterbatch/index.en.html` : `${root}productos/masterbatch/`;
  const additivesHref = isEnglish ? `${root}productos/aditivos/index.en.html` : `${root}productos/aditivos/`;
  const branchesHref = isEnglish ? `${root}puntosdeventa/index.en.html` : `${root}puntosdeventa/`;
  const onlineHref = isEnglish ? `${root}filiales/online/index.en.html` : `${root}filiales/online/`;
  const blogHref = isEnglish ? `${root}blog/index.en.html` : `${root}blog/`;
  const eventsHref = isEnglish ? `${root}eventos/index.en.html` : `${root}eventos/`;
  const contactHref = isEnglish ? `${root}contacto/index.en.html` : `${root}contacto/`;
  const currentClass = (key) => (current === key ? ' is-current' : '');

  return `
  <div class="nav-fixed">
    <nav class="nav_component">
      <div class="page-padding padding-main-nav">
        <div class="container-large">
          <div class="padding-vertical">
            <div class="primary-nav_nav-bar">
              <a href="${homeHref}" class="global-brand-logo w-inline-block">
                <img src="${root}assets/img/agama.svg" loading="lazy" alt="AGAMA"/>
              </a>
              <div class="main-nav-bar">
                <div class="main-nav-menu">
                  <div data-delay="0" data-hover="true" class="dropdown-megamenu w-dropdown${currentClass('productos')}">
                    <div class="button-nav w-dropdown-toggle">
                      <div class="dropdown-flex">
                        <a href="${productsHref}" class="button-nav-link">${productsLabel}</a>
                        <button type="button" class="dropdown-trigger" data-dropdown-trigger aria-label="${isEnglish ? 'Open product categories' : 'Abrir categorías de productos'}" aria-expanded="false" aria-haspopup="menu" aria-controls="products-megamenu">
                          <span class="dropdown-icon" aria-hidden="true">+</span>
                        </button>
                      </div>
                      <div class="button-nav-line"></div>
                    </div>
                    <nav id="products-megamenu" class="megamenu-dropper w-dropdown-list" role="menu" aria-label="${isEnglish ? 'Product categories' : 'Categorías de productos'}">
                      <div class="megamenu-beta">
                        <div class="page-padding padding-megamenu">
                          <div class="container-large"><div class="padding-vertical"><div class="grid _3g">
                            <div class="featured-product-card" role="presentation">
                              <a href="${pigmentsHref}" class="image-link hover-effect w-inline-block" aria-label="${isEnglish ? 'View pigments catalogue' : 'Ver catálogo de Pigmentos'}" role="menuitem">
                                <img src="${root}assets/img/pigmento.jpg" alt="AGAMA Pigmentos" loading="lazy" class="featured-product-card-img"/>
                              </a>
                              <div class="featured-product-card-brief"><h3 class="global-heaading"><div class="global-heading-text">${pigmentsLabel}</div></h3></div>
                            </div>
                            <div class="featured-product-card" role="presentation">
                              <a href="${masterbatchHref}" class="image-link hover-effect w-inline-block" aria-label="${isEnglish ? 'View masterbatch catalogue' : 'Ver catálogo de Masterbatch'}" role="menuitem">
                                <img src="${root}assets/img/master-clean.jpg" alt="AGAMA Masterbatch" loading="lazy" class="featured-product-card-img"/>
                              </a>
                              <div class="featured-product-card-brief"><h3 class="global-heaading"><div class="global-heading-text">${masterbatchLabel}</div></h3></div>
                            </div>
                            <div class="featured-product-card" role="presentation">
                              <a href="${additivesHref}" class="image-link hover-effect w-inline-block" aria-label="${isEnglish ? 'View additives catalogue' : 'Ver catálogo de Aditivos'}" role="menuitem">
                                <img src="${root}assets/img/aditivos.jpg" alt="AGAMA Aditivos" loading="lazy" class="featured-product-card-img"/>
                              </a>
                              <div class="featured-product-card-brief"><h3 class="global-heaading"><div class="global-heading-text">${additivesLabel}</div></h3></div>
                            </div>
                          </div></div></div>
                        </div>
                      </div>
                    </nav>
                  </div>
                  <a href="${branchesHref}" class="button-nav w-inline-block${currentClass('puntosdeventa')}"><div>${branchesLabel}</div><div class="button-nav-line"></div></a>
                  <a href="${onlineHref}" class="button-nav w-inline-block${currentClass('online')}"><div>${onlineLabel}</div><div class="button-nav-line"></div></a>
                  <a href="${blogHref}" class="button-nav w-inline-block${currentClass('blog')}"><div>${blogLabel}</div><div class="button-nav-line"></div></a>
                  <a href="${eventsHref}" class="button-nav w-inline-block${currentClass('eventos')}"><div>${eventsLabel}</div><div class="button-nav-line"></div></a>
                  <a href="${contactHref}" class="button-nav w-inline-block${currentClass('contacto')}"><div>${contactLabel}</div><div class="button-nav-line"></div></a>
                </div>
                ${hasLanguageSwitch ? `<a href="${switchTarget}" class="language-switch" aria-label="${switchAria}">${switchLabel}</a>` : ""}
                <div class="man-nav-cta">
                  <a href="https://wa.me/525573515156" target="_blank" rel="noopener noreferrer" class="g-button w-inline-block">
                    <div>${whatsappLabel}</div>
                    <div class="g-button-material"></div>
                    <div class="g-button-svg"><img src="${root}assets/img/whatsapp-white.svg" loading="lazy" alt=""/></div>
                  </a>
                </div>
                <div class="main-nav-brgr">
                  <button type="button" class="brgr w-inline-block" aria-label="${isEnglish ? 'Open navigation' : 'Abrir navegación'}" aria-expanded="false" aria-controls="mobile-navigation">
                    <div class="brgr-pleca one"></div>
                    <div class="brgr-pleca two"></div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="modal-nav-component">
        <div id="mobile-navigation" class="mobile-nav_nav-element" role="dialog" aria-modal="true" aria-label="${isEnglish ? 'Main navigation' : 'Navegación principal'}">
          <div class="nav-element_header">
            <button type="button" class="close close-btn w-inline-block" aria-label="${isEnglish ? 'Close navigation' : 'Cerrar navegación'}"><div class="icon-font" aria-hidden="true">close</div></button>
          </div>
          <div class="nav-element_body">
            <a href="${homeHref}" class="btn-modal-nav w-button">${homeLabel}</a>
            <a href="${productsHref}" class="btn-modal-nav w-button">${productsLabel}</a>
            <a href="${pigmentsHref}" class="btn-modal-nav small w-button">${pigmentsLabel}</a>
            <a href="${masterbatchHref}" class="btn-modal-nav small w-button">${masterbatchLabel}</a>
            <a href="${additivesHref}" class="btn-modal-nav small w-button">${additivesLabel}</a>
            <a href="${branchesHref}" class="btn-modal-nav w-button">${branchesLabel}</a>
            <a href="${onlineHref}" class="btn-modal-nav w-button">${onlineLabel}</a>
            <a href="${blogHref}" class="btn-modal-nav w-button">${blogLabel}</a>
            <a href="${eventsHref}" class="btn-modal-nav w-button">${eventsLabel}</a>
            <a href="${contactHref}" class="btn-modal-nav w-button">${contactLabel}</a>
            <a href="https://wa.me/525573515156" target="_blank" rel="noopener noreferrer" class="btn-modal-nav cta-btn whatsapp w-inline-block">
              <div class="icon-btn-container">
                <div class="icon-btn_text"><div>${whatsappLabel}</div></div>
                <div class="icon-btn_icon"><img src="${root}assets/img/whats-app.svg" loading="lazy" alt=""/></div>
              </div>
            </a>
          </div>
        </div>
      </div>
    </nav>
  </div>`;
}

export function buildFooter(root = '/', locale = 'es') {
  const isEnglish = locale === 'en';
  const homeHref = isEnglish ? `${root}index.en.html` : `${root}`;
  const pigmentsHref = isEnglish ? `${root}productos/pigmentos/index.en.html` : `${root}productos/pigmentos/`;
  const masterbatchHref = isEnglish ? `${root}productos/masterbatch/index.en.html` : `${root}productos/masterbatch/`;
  const additivesHref = isEnglish ? `${root}productos/aditivos/index.en.html` : `${root}productos/aditivos/`;
  const deliveryHref = isEnglish ? `${root}entregas/index.en.html` : `${root}entregas/`;
  const eventsHref = isEnglish ? `${root}eventos/index.en.html` : `${root}eventos/`;
  const blogHref = isEnglish ? `${root}blog/index.en.html` : `${root}blog/`;
  const jobsHref = isEnglish ? `${root}vacantes/index.en.html` : `${root}vacantes/`;
  const contactHref = isEnglish ? `${root}contacto/index.en.html` : `${root}contacto/`;
  const faqsHref = isEnglish ? `${root}faqs/` : `${root}faqs/`;
  const legalHref = isEnglish ? `${root}legal/index.en.html` : `${root}legal/`;
  const pigmentsLabel = isEnglish ? 'Pigments' : 'Pigmentos';
  const additivesLabel = isEnglish ? 'Additives' : 'Aditivos';
  const deliveryLabel = isEnglish ? 'Delivery' : 'Entregas';
  const eventsLabel = isEnglish ? 'Events' : 'Eventos';
  const blogLabel = 'Blog';
  const jobsLabel = isEnglish ? 'Jobs' : 'Vacantes';
  const contactLabel = isEnglish ? 'Contact' : 'Contacto';
  const legalLabel = 'Legal';
  const copy = isEnglish ? 'AGAMA - Pigments &amp; Masterbatch® 2026' : 'AGAMA - Pigmentos &amp; Masterbatch® 2026';
  const credit = isEnglish ? 'Designed and maintained by' : 'Diseñado y mantenido por';

  return `
  <footer class="site-footer">
    <div class="sfp-inner">
      <div class="sfp-top">
        <a href="${homeHref}" class="sfp-logo">
          <img src="${root}assets/img/agama.svg" alt="AGAMA" loading="lazy" height="26"/>
        </a>
        <nav class="sfp-nav">
          <a href="${pigmentsHref}">${pigmentsLabel}</a>
          <a href="${masterbatchHref}">Masterbatch</a>
          <a href="${additivesHref}">${additivesLabel}</a>
          <a href="${deliveryHref}">${deliveryLabel}</a>
          <a href="${eventsHref}">${eventsLabel}</a>
          <a href="${blogHref}">${blogLabel}</a>
          <a href="${jobsHref}">${jobsLabel}</a>
          <a href="${contactHref}">${contactLabel}</a>
          <a href="${faqsHref}">FAQs</a>
          <a href="${legalHref}">${legalLabel}</a>
        </nav>
      </div>
      <div class="sfp-bottom">
        <span class="sfp-copy">${copy}</span>
        <span class="sfp-credit">${credit} <a href="https://webfuengirola.com" target="_blank" rel="noopener noreferrer">Web Fuengirola Studio</a></span>
      </div>
    </div>
  </footer>`;
}
