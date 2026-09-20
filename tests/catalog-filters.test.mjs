import test from 'node:test';
import assert from 'node:assert/strict';
import { filterProducts, normalizeCategory } from '../assets/js/catalog-filters.js';

test('opaque and crystal categories use product classification and combine with search', () => {
  const products = [
    { nombre: 'ROJO', tipo: 'Opaco', slug: 'rojo' },
    { nombre: 'AZUL', tipo: 'Cristal', slug: 'azul' },
    { nombre: 'AZUL', tipo: 'Opaco', slug: 'azul-opaco' },
  ];
  assert.deepEqual(filterProducts(products, 'pigmentos', 'opacos', 'azul').map(p => p.slug), ['azul-opaco']);
  assert.deepEqual(filterProducts(products, 'pigmentos', 'cristal', '').map(p => p.slug), ['azul']);
  assert.equal(filterProducts(products, 'pigmentos', 'todos', '').length, 3);
  assert.equal(filterProducts(products, 'pigmentos', 'cristal', 'rojo').length, 0);
});

test('opaque masterbatch includes all opaque products without inferred film exclusions', () => {
  const products = [
    { slug: 'mb-125-mb-azul-pelicula-intenso', tipo: 'Opaco', nombre: 'MB-125 AZUL' },
    { slug: 'mb-110-mb-negro-kalo-economico', tipo: 'Opaco', nombre: 'MB-110 NEGRO' },
    { slug: 'mb-101-mb-amarillo-huevo', tipo: 'Opaco', nombre: 'MB-101 AMARILLO' },
  ];
  assert.equal(filterProducts(products, 'masterbatch', 'opacos').length, 3);
  assert.equal(filterProducts(products, 'masterbatch', 'opacos', '125').length, 1);
});

test('unsupported URL categories fall back to the full catalog', () => {
  assert.equal(normalizeCategory('pigmentos', 'para-bolsa'), 'todos');
  assert.equal(normalizeCategory('masterbatch', 'cristal'), 'todos');
  assert.equal(normalizeCategory('masterbatch', 'para-bolsa'), 'todos');
  assert.equal(normalizeCategory('pigmentos', null), 'todos');
});
