import path from 'node:path'
import eslintPluginImport from 'eslint-plugin-import'
import typescriptParser from '@typescript-eslint/parser'
import {recommended} from './dist/index.cjs'
import nodeSpecifier from 'eslint-plugin-node-specifier'
import unusedImports from 'eslint-plugin-unused-imports'

const shared = {
  files: ['src/**/*.ts', 'test/**/*.test.ts'],
  ignores: ['dist/**', 'coverage/**', 'workspaces/**'],
}

/** @type {import('eslint').Linter.Config[]} */
export default [
  recommended(shared),
  {
    ...shared,
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        project: path.join(process.cwd(), './tsconfig.json'),
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      import: eslintPluginImport,
      'node-specifier': nodeSpecifier,
      'unused-imports': unusedImports,
    },
    rules: {
      'unused-imports/no-unused-imports': 'error',
      'node-specifier/enforce-node-specifier': 'error',
      'import/extensions': [
        'error',
        'ignorePackages',
        {
          js: 'never',
        },
      ],
    },
    settings: {
      'import/extensions': ['.ts'],
    },
  },
]
