/* eslint-env node */
module.exports = {
    extends: [
        'eslint:recommended',
        'plugin:eqeqeq-fix/recommended',
        'plugin:react/jsx-runtime',
        'plugin:react-hooks/recommended',
        'plugin:react/recommended',
    ],
    rules: {
        'react/react-in-jsx-scope': 'off',
        'react/jsx-uses-react': 'off',
        // While using React.FC, this will give false positives
        'react/prop-types': 'off',
        // React is now imported by default
        'jsx-uses-react': 'off',
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
        'react/no-unescaped-entities': 'off',
    },
    plugins: ['@typescript-eslint'],
    parser: '@typescript-eslint/parser',
    parserOptions: {
        project: true,
        tsconfigRootDir: __dirname,
    },
    root: true,
    settings: {
        react: {
            version: 'detect',
        },
    },
    ignorePatterns: ['build'],
};
