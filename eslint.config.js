// @ts-check
import js from '@eslint/js';
import { defineConfig, globalIgnores } from 'eslint/config';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import tseslint from 'typescript-eslint';

// Which @arena packages each simulation package may import (PLAN.md §4 layering).
const LAYERS = { core: [], sim: ['core'], ai: ['core', 'sim'], game: ['core', 'sim', 'ai'] };

// Math functions the ECMAScript spec lets engines approximate differently (V8, SpiderMonkey, JSC).
const ENGINE_DEPENDENT_MATH = [
  'sin',
  'cos',
  'tan',
  'asin',
  'acos',
  'atan',
  'atan2',
  'sinh',
  'cosh',
  'tanh',
  'exp',
  'expm1',
  'log',
  'log1p',
  'log2',
  'log10',
  'pow',
  'hypot',
  'cbrt',
];

export default defineConfig(
  globalIgnores(['**/dist/**', '**/coverage/**', '**/.turbo/**', '**/.netlify/**']),
  js.configs.recommended,
  tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    rules: {
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
  { files: ['**/*.js'], extends: [tseslint.configs.disableTypeChecked] },
  {
    files: ['apps/web/src/**/*.{ts,tsx}'],
    languageOptions: { globals: globals.browser },
    plugins: { 'react-hooks': reactHooks },
    rules: { 'react-hooks/rules-of-hooks': 'error', 'react-hooks/exhaustive-deps': 'warn' },
  },
  {
    files: [
      'packages/server/**/*.ts',
      'apps/web/netlify/**/*.ts',
      'tools/**/*.ts',
      '**/*.config.{js,ts}',
    ],
    languageOptions: { globals: globals.node },
  },

  // Determinism profile: simulation code may not touch time, randomness, engine-dependent math or the platform.
  {
    files: Object.keys(LAYERS).map((p) => `packages/${p}/src/**/*.ts`),
    ignores: ['**/*.test.ts'], // tests may compare detMath against Math.sin, etc.
    rules: {
      'no-restricted-globals': [
        'error',
        ...[
          'Date',
          'performance',
          'setTimeout',
          'setInterval',
          'requestAnimationFrame',
          'queueMicrotask',
          'crypto',
          'window',
          'document',
          'process',
        ].map((name) => ({
          name,
          message: 'Simulation code must be deterministic and platform-free.',
        })),
      ],
      'no-restricted-properties': [
        'error',
        { object: 'Math', property: 'random', message: 'Use the seeded RNG from @arena/core.' },
        ...ENGINE_DEPENDENT_MATH.map((property) => ({
          object: 'Math',
          property,
          message: 'Results differ between JS engines: use detMath from @arena/core.',
        })),
      ],
      'no-restricted-syntax': [
        'error',
        {
          selector: "BinaryExpression[operator='**'], AssignmentExpression[operator='**=']",
          message: '`**` has Math.pow semantics: multiply explicitly or use detMath.',
        },
      ],
    },
  },

  // Layering: each simulation package may import only the layers below it, and never UI, platform or Node code.
  ...Object.entries(LAYERS).map(([pkg, allowed]) => ({
    files: [`packages/${pkg}/**/*.ts`],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@arena/*', ...allowed.map((a) => `!@arena/${a}`)],
              message: `@arena/${pkg} may only import ${allowed.map((a) => `@arena/${a}`).join(', ') || 'no @arena packages'}.`,
            },
            {
              group: ['react', 'react-dom', 'pixi.js', 'zod', 'node:*'],
              message: 'Simulation packages have zero runtime dependencies.',
            },
          ],
        },
      ],
    },
  })),
);
