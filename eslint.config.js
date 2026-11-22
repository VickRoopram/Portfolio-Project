/**
 * ESLint (flat config): catches real bugs, not style. Prettier handles the style (.prettierrc.json).
 * No plugins and no packages: only rules built into ESLint, so it runs anywhere with `npm run lint` (npx fetches ESLint).
 * TypeScript Netlify Functions (*.mts) are checked by scripts/ci-functions.mjs instead.
 */
const g = (names) => Object.fromEntries(names.split(/\s+/).filter(Boolean).map((n) => [n, 'readonly']));

const BROWSER = g(`
  window document navigator location history screen console performance localStorage sessionStorage
  addEventListener removeEventListener matchMedia getComputedStyle getSelection requestAnimationFrame
  setTimeout clearTimeout setInterval clearInterval innerWidth innerHeight devicePixelRatio
  fetch URL URLSearchParams AbortController DOMParser ResizeObserver Image Audio Path2D createImageBitmap
`);
const NODE = g('process console Buffer URL setTimeout clearTimeout');

export default [
  { ignores: ['node_modules/', 'assets/', '.netlify/', 'tools/admin-artifact/out/'] },
  {
    files: ['**/*.js', '**/*.mjs'],
    languageOptions: { ecmaVersion: 'latest', sourceType: 'module', globals: BROWSER },
    linterOptions: { reportUnusedDisableDirectives: 'error' },
    rules: {
      'no-undef': 'error',
      'no-unused-vars': ['error', { args: 'none', caughtErrors: 'none' }],
      'no-unreachable': 'error',
      'no-dupe-keys': 'error',
      'no-duplicate-case': 'error',
      'no-self-assign': 'error',
      'no-self-compare': 'error',
      'no-cond-assign': ['error', 'except-parens'],
      'no-constant-binary-expression': 'error',
      'no-unsafe-finally': 'error',
      'no-unsafe-negation': 'error',
      'use-isnan': 'error',
      'valid-typeof': 'error',
      'no-var': 'error',
      eqeqeq: ['error', 'smart'],
    },
  },
  // Node scripts (CI, setup) and this file
  { files: ['scripts/**', 'eslint.config.js'], languageOptions: { globals: NODE } },
  // The Claude artifact admin runs inside claude.ai, which provides these
  { files: ['tools/admin-artifact/**'], languageOptions: { globals: { ...BROWSER, claude: 'readonly', SITE_CSS: 'readonly' } } },
];
