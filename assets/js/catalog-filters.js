// Film-color references documented in the committed product technical information.
// Slip additives MB-105/MB-200 are intentionally not part of the color selection.
const FILM_COLORS = new Set(['110', '125', '126', '127', '210', '221']);
const categories = {
  pigmentos: ['todos', 'opacos', 'cristal'],
  masterbatch: ['todos', 'opacos', 'para-bolsa'],
};
const normalize = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

export function normalizeCategory(tipo, category) {
  return categories[tipo]?.includes(category) ? category : 'todos';
}

export function filterProducts(products, tipo, category, query = '') {
  const selected = normalizeCategory(tipo, category);
  const term = normalize(query);
  return products.filter(product => {
    const filmColor = tipo === 'masterbatch' && FILM_COLORS.has(product.slug?.match(/^mb-(\d+)-/)?.[1]);
    const finish = normalize(product.tipo);
    const matchesCategory = selected === 'todos'
      || (selected === 'para-bolsa' && filmColor)
      || (selected === 'opacos' && ['opaco', 'opaque'].includes(finish) && !filmColor)
      || (selected === 'cristal' && ['cristal', 'crystal'].includes(finish));
    return matchesCategory && [product.nombre, product.descripcion, product.tipo, product.slug]
      .some(value => normalize(value).includes(term));
  });
}
