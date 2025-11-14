import tseslint from "typescript-eslint";
import eslint from "@eslint/js";
import prettierPlugin from "eslint-plugin-prettier";

export default [
  eslint.configs.recommended,
  ...tseslint.configs.recommended.map((config) => ({
    ...config,
    files: ["**/*.ts", "**/*.tsx"],
  })),
  {
    files: ["**/*.{ts,tsx,js,json,md}"], // apply Prettier broadly
    plugins: {
      prettier: prettierPlugin,
    },
    rules: {
      "prettier/prettier": "error", // treats Prettier issues as ESLint errors
    },
  },
  {
    files: ["src/**/*.{ts,tsx}"],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: "./tsconfig.json",
      },
    },
  },
];