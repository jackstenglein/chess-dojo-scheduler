/*
 * Temporarily turn these failing rules to warnings until they no longer exist in the code base.
 * Generate this like so:
 * npx eslint --format json . | jq  '[.[] | .messages[] | select(.severity == 2) |  .ruleId] | unique |  map({key: .|tostring, value: "warn"}) | from_entries'
 */

/* eslint-env node */
module.exports = {
    rules: {
        '@typescript-eslint/array-type': 'warn',
        '@typescript-eslint/ban-types': 'warn',
        '@typescript-eslint/consistent-indexed-object-style': 'warn',
        '@typescript-eslint/consistent-type-definitions': 'warn',
        '@typescript-eslint/no-base-to-string': 'warn',
        '@typescript-eslint/no-confusing-void-expression': [
            'warn',
            { ignoreArrowShorthand: true },
        ],
        '@typescript-eslint/no-empty-interface': 'warn',
        '@typescript-eslint/no-explicit-any': 'warn',
        '@typescript-eslint/no-floating-promises': 'warn',
        '@typescript-eslint/no-inferrable-types': 'warn',
        '@typescript-eslint/no-invalid-void-type': 'warn',
        '@typescript-eslint/no-misused-promises': 'warn',
        '@typescript-eslint/no-non-null-assertion': 'warn',
        '@typescript-eslint/no-redundant-type-constituents': 'warn',
        '@typescript-eslint/no-unnecessary-condition': 'off',
        '@typescript-eslint/no-unnecessary-type-arguments': 'warn',
        '@typescript-eslint/no-unnecessary-type-assertion': 'warn',
        '@typescript-eslint/no-unsafe-argument': 'warn',
        '@typescript-eslint/no-unsafe-assignment': 'warn',
        '@typescript-eslint/no-unsafe-call': 'warn',
        '@typescript-eslint/no-unsafe-enum-comparison': 'warn',
        '@typescript-eslint/no-unsafe-member-access': 'warn',
        '@typescript-eslint/no-unsafe-return': 'warn',
        '@typescript-eslint/no-unused-vars': 'warn',
        '@typescript-eslint/no-useless-template-literals': 'warn',
        '@typescript-eslint/non-nullable-type-assertion-style': 'warn',
        '@typescript-eslint/prefer-includes': 'warn',
        '@typescript-eslint/prefer-nullish-coalescing': 'off',
        '@typescript-eslint/prefer-optional-chain': 'warn',
        '@typescript-eslint/prefer-promise-reject-errors': 'warn',
        '@typescript-eslint/prefer-reduce-type-parameter': 'warn',
        '@typescript-eslint/prefer-string-starts-ends-with': 'warn',
        '@typescript-eslint/restrict-plus-operands': 'warn',
        '@typescript-eslint/restrict-template-expressions': [
            'warn',
            { allowNumber: true },
        ],
        '@typescript-eslint/triple-slash-reference': 'warn',
        '@typescript-eslint/unbound-method': 'warn',
        '@typescript-eslint/use-unknown-in-catch-callback-variable': 'off',
        'cypress/unsafe-to-chain-command': 'warn',
        'no-async-promise-executor': 'warn',
        'no-case-declarations': 'warn',
        'no-extra-boolean-cast': 'warn',
        'no-prototype-builtins': 'warn',
        'prefer-const': 'warn',
        'react/display-name': 'warn',
        'react/jsx-key': 'warn',
        'react/no-unescaped-entities': 'off',
    },
};
