const categories = {
  pigmentos: ['todos', 'opacos', 'cristal'],
  masterbatch: ['todos', 'opacos'],
};
const normalize = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

export function normalizeCategory(tipo, category) {
  return categories[tipo]?.includes(category) ? category : 'todos';
}

export function filterProducts(products, tipo, category, query = '') {
  const selected = normalizeCategory(tipo, category);
  const term = normalize(query);
  return products.filter(product => {
    const finish = normalize(product.tipo);
    const matchesCategory = selected === 'todos'
      || (selected === 'opacos' && ['opaco', 'opaque'].includes(finish))
      || (selected === 'cristal' && ['cristal', 'crystal'].includes(finish));
    return matchesCategory && [product.nombre, product.descripcion, product.tipo, product.slug]
      .some(value => normalize(value).includes(term));
  });
}
