// @ts-check

import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
    eslint.configs.recommended,
    ...tseslint.configs.strictTypeChecked,
    ...tseslint.configs.stylistic,
    {
        rules: {
            '@typescript-eslint/no-confusing-void-expression': [
                'warn',
                { ignoreArrowShorthand: true },
            ],
            '@typescript-eslint/no-unnecessary-condition': 'off',
            '@typescript-eslint/prefer-nullish-coalescing': 'off',
            '@typescript-eslint/restrict-template-expressions': [
                'warn',
                { allowNumber: true },
            ],
            '@typescript-eslint/use-unknown-in-catch-callback-variable': 'off',
            '@typescript-eslint/no-unsafe-enum-comparison': 'off',
            '@typescript-eslint/no-unused-vars': ['error', { ignoreRestSiblings: true, argsIgnorePattern: "^_"}],
            '@typescript-eslint/no-misused-promises': [
                'error',
                { checksVoidReturn: { attributes: false }}
            ]
        }
    }
)
