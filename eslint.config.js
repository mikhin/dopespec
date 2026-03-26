import js from "@eslint/js";
import tseslint from "typescript-eslint";
import sonarjs from "eslint-plugin-sonarjs";
import perfectionist from "eslint-plugin-perfectionist";

export default tseslint.config(
  { ignores: ["dist", "node_modules", "**/generated"] },

  // Base configs
  js.configs.recommended,
  ...tseslint.configs.recommended,
  sonarjs.configs.recommended,
  perfectionist.configs["recommended-natural"],

  // All TypeScript files
  {
    files: ["**/*.ts"],
    rules: {
      // No classes, no enums, no default exports
      "no-restricted-syntax": [
        "error",
        {
          selector: "ClassDeclaration",
          message: "Use factory functions instead of classes.",
        },
        {
          selector: "TSEnumDeclaration",
          message: "Use as-const objects instead of enums.",
        },
        {
          selector: "ExportDefaultDeclaration",
          message: "Use named exports instead of default exports.",
        },
      ],

      // TypeScript strictness — allow _prefixed unused params (convention for stubs)
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-non-null-assertion": "error",
      "@typescript-eslint/consistent-type-definitions": ["error", "type"],

      // Padding between statements
      "padding-line-between-statements": [
        "error",
        { blankLine: "always", prev: "directive", next: "*" },
        { blankLine: "always", prev: "*", next: "return" },
        { blankLine: "always", prev: "*", next: "throw" },
        { blankLine: "always", prev: ["const", "let", "var"], next: "*" },
        {
          blankLine: "any",
          prev: ["const", "let", "var"],
          next: ["const", "let", "var"],
        },
        { blankLine: "always", prev: "*", next: "export" },
        { blankLine: "any", prev: "export", next: "export" },
        { blankLine: "always", prev: "*", next: "function" },
        { blankLine: "always", prev: "function", next: "*" },
        { blankLine: "always", prev: "*", next: "block-like" },
        { blankLine: "always", prev: "block-like", next: "*" },
        { blankLine: "always", prev: "*", next: "switch" },
        { blankLine: "always", prev: "case", next: "case" },
        { blankLine: "always", prev: "*", next: "try" },
        { blankLine: "always", prev: "try", next: "*" },
      ],

      // Relax sonarjs
      "sonarjs/no-commented-code": "off",
      "sonarjs/todo-tag": "off",
    },
  },

  // Test files — relax no-restricted-syntax (only block enums, allow classes and default exports)
  {
    files: ["**/*.test.ts"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: "TSEnumDeclaration",
          message: "Use as-const objects instead of enums.",
        },
      ],
    },
  },
);
