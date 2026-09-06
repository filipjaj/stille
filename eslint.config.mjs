import nextCoreWebVitals from 'eslint-config-next/core-web-vitals'
import nextTypescript from 'eslint-config-next/typescript'

/**
 * ESLint flat config.
 *
 * `eslint-config-next` 16 eksporterer ferdige flat configs. Malen kjørte dem
 * gjennom `FlatCompat` fra `@eslint/eslintrc`, som er ment for gamle
 * `.eslintrc`-baserte konfigurasjoner — og det kastet
 * «TypeError: Converting circular structure to JSON» før ESLint rakk å se en
 * eneste fil. Linteren har aldri kjørt i dette repoet.
 *
 * Her importeres konfigurasjonene direkte. Ingen kompatibilitetslag.
 */
const eslintConfig = [
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    rules: {
      '@typescript-eslint/ban-ts-comment': 'warn',
      '@typescript-eslint/no-empty-object-type': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          vars: 'all',
          args: 'after-used',
          ignoreRestSiblings: false,
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^(_|ignore)',
        },
      ],
    },
  },
  {
    ignores: [
      '.next/',
      '.open-next/',
      '.wrangler/',
      'src/payload-types.ts',
      'src/payload-generated-schema.ts',
      // Generert av Payload ved hver `generate:importmap`.
      'src/app/(payload)/admin/importMap.js',
      // Genererte migrasjoner speiler skjemaet og redigeres ikke for hånd.
      'src/migrations/',
    ],
  },
]

export default eslintConfig
