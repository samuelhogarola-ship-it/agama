import js from "@eslint/js";
import globals from "globals";

const sharedRules = {
  "no-unused-vars": ["error", { caughtErrors: "none" }],
  "no-useless-assignment": "off",
  "preserve-caught-error": "off",
};

export default [
  {
    ignores: [
      "dist/**",
      "node_modules/**",
      "portal/**",
      "wordpress/**",
      "assets/js/webflow-base.js",
    ],
  },
  {
    ...js.configs.recommended,
    files: ["build.js", "scripts/**/*.mjs"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.node,
      },
    },
    rules: {
      ...js.configs.recommended.rules,
      ...sharedRules,
    },
  },
  {
    ...js.configs.recommended,
    files: ["assets/js/products.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.browser,
      },
    },
    rules: {
      ...js.configs.recommended.rules,
      ...sharedRules,
    },
  },
  {
    ...js.configs.recommended,
    files: ["assets/js/**/*.js"],
    ignores: ["assets/js/products.js", "assets/js/webflow-base.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "script",
      globals: {
        ...globals.browser,
      },
    },
    rules: {
      ...js.configs.recommended.rules,
      ...sharedRules,
    },
  },
];
