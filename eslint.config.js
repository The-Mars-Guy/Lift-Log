import js from "@eslint/js";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";

export default [
  js.configs.recommended,
  {
    plugins: { "react-hooks": reactHooks },
    rules: {
      ...reactHooks.configs.recommended.rules,
      // Allow _-prefixed variables to be unused (conventional ignore marker)
      "no-unused-vars": ["error", { vars: "all", args: "after-used", argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      // Experimental v7 rules — too aggressive for this codebase (common patterns flagged)
      "react-hooks/purity": "off",
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/immutability": "off",
      "react-hooks/preserve-manual-memoization": "off",
    },
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: {
        ...globals.browser,
        ...globals.es2022,
        __APP_VERSION__: "readonly",
      },
    },
    files: ["src/**/*.{js,jsx}"],
  },
  {
    // Test + script files: Node globals
    files: ["test/**/*.mjs", "scripts/**/*.mjs"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: { ...globals.node, ...globals.es2022 },
    },
  },
  {
    ignores: ["dist/**", "node_modules/**"],
  },
];
