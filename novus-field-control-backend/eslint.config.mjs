import eslint from "@eslint/js";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import globals from "globals";

// Regras base do ESLint que o TypeScript ja resolve por conta propria. Mantidas
// ligadas, elas produzem falsos positivos em codigo TS: `no-undef` nao conhece
// os globals de tipo nem os do Node, e `no-unused-vars` acusa parametros de
// construtor com modificador de acesso (o padrao de injecao de dependencia do
// Nest) como se nunca fossem usados.
const disabledBaseRules = {
  "no-undef": "off",
  "no-unused-vars": "off",
  "no-redeclare": "off",
  "no-dupe-class-members": "off",
};

export default [
  {
    ignores: ["dist/**", "coverage/**", "node_modules/**"],
  },

  // Codigo da aplicacao: linting com informacao de tipos.
  {
    files: ["src/**/*.ts", "prisma/**/*.ts"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: "./tsconfig.json",
        tsconfigRootDir: import.meta.dirname,
      },
      globals: {
        ...globals.node,
        ...globals.jest,
      },
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
    },
    rules: {
      ...eslint.configs.recommended.rules,
      ...disabledBaseRules,
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
    },
  },

  // Arquivos de configuracao na raiz: ficam fora do tsconfig, entao sem `project`.
  {
    files: ["*.ts"],
    languageOptions: {
      parser: tsParser,
      globals: globals.node,
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
    },
    rules: {
      ...eslint.configs.recommended.rules,
      ...disabledBaseRules,
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
    },
  },

  // A propria config do ESLint.
  {
    files: ["**/*.mjs"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: globals.node,
    },
    rules: eslint.configs.recommended.rules,
  },
];
