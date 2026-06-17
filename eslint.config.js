import js from '@eslint/js';
import globals from 'globals';

export default [
  {
    ignores: [
      'dist/**',
      'portal/**',
      'node_modules/**',
      'assets/js/webflow-base.js',
      'filiales/**',
      'productos/**',
      'blog/**',
      'blog-agama/**',
      'entrada-de-blog/**',
      'faqs/**',
      'legal/**',
      'contacto/**',
      'entregas/**',
      'eventos/**',
      'vacantes/**',
    ],
  },
  js.configs.recommended,
  {
    files: ['**/*.js', '**/*.mjs'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.node,
        ...globals.browser,
      },
    },
    rules: {
      'no-console': 'off',
    },
  },
];
