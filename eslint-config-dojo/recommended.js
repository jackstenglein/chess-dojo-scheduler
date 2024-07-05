/* eslint-env node */
module.exports = {
    extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/strict-type-checked',
        'plugin:@typescript-eslint/stylistic-type-checked',
        'plugin:eqeqeq-fix/recommended',
    ],
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
    },
    plugins: ['@typescript-eslint'],
};
