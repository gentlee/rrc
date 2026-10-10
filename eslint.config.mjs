import js from '@eslint/js'
import typescriptEslint from '@typescript-eslint/eslint-plugin'
import typescriptParser from '@typescript-eslint/parser'
import {globalIgnores} from 'eslint/config'
import prettier from 'eslint-plugin-prettier/recommended'
import reactHooks from 'eslint-plugin-react-hooks'
import simpleImportSort from 'eslint-plugin-simple-import-sort'
import globals from 'globals'

export default [
  globalIgnores(['**/node_modules/**', './example/**', './dist/**']),
  prettier,
  {
    files: ['**/*.{mjs,js,jsx,ts,tsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parser: typescriptParser,
      globals: {
        ...globals.node,
        ...globals.jest,
        ...globals.browser,
        __DEV__: true,
      },
    },
    plugins: {
      '@typescript-eslint': typescriptEslint,
      'react-hooks': reactHooks,
      'simple-import-sort': simpleImportSort,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...typescriptEslint.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      curly: ['error', 'all'],
      'object-shorthand': 'error',
      'padding-line-between-statements': [
        'error',
        {blankLine: 'always', prev: '*', next: 'export'},
        {blankLine: 'always', prev: 'export', next: '*'},
      ],
      'react-hooks/globals': 0,
      'no-unused-vars': 0,
      '@typescript-eslint/no-empty-function': 0,
      '@typescript-eslint/no-non-null-assertion': 0,
      '@typescript-eslint/no-var-requires': 0,
      '@typescript-eslint/no-unused-expressions': 0,
      '@typescript-eslint/no-require-imports': 0,
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',
    },
  },
]
