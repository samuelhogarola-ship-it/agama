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

test('film colors are separated from opaque masterbatch without including slip additives', () => {
  const products = [
    { slug: 'mb-125-mb-azul-pelicula-intenso', tipo: 'Opaco', nombre: 'MB-125 AZUL' },
    { slug: 'mb-110-mb-negro-kalo-economico', tipo: 'Opaco', nombre: 'MB-110 NEGRO' },
    { slug: 'mb-101-mb-amarillo-huevo', tipo: 'Opaco', nombre: 'MB-101 AMARILLO' },
    { slug: 'mb-105-mb-deslizante', tipo: 'Opaco', nombre: 'MB-105 DESLIZANTE' },
  ];
  assert.deepEqual(filterProducts(products, 'masterbatch', 'para-bolsa', '').map(p => p.slug), ['mb-125-mb-azul-pelicula-intenso', 'mb-110-mb-negro-kalo-economico']);
  assert.deepEqual(filterProducts(products, 'masterbatch', 'opacos', 'amarillo').map(p => p.slug), ['mb-101-mb-amarillo-huevo']);
  assert.equal(filterProducts(products, 'masterbatch', 'opacos', 'MB-125').length, 0);
});

test('unsupported URL categories fall back to the full catalog', () => {
  assert.equal(normalizeCategory('pigmentos', 'para-bolsa'), 'todos');
  assert.equal(normalizeCategory('masterbatch', 'cristal'), 'todos');
  assert.equal(normalizeCategory('masterbatch', 'para-bolsa'), 'para-bolsa');
  assert.equal(normalizeCategory('pigmentos', null), 'todos');
});
