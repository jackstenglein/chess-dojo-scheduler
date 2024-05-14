/* eslint-env node */
module.exports = {
    extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/strict-type-checked',
        'plugin:@typescript-eslint/stylistic-type-checked',
        'plugin:cypress/recommended',
        'plugin:eqeqeq-fix/recommended',
        'plugin:react/jsx-runtime',
        'plugin:react-hooks/recommended',
        'plugin:react/recommended',
        './.eslintrc-temp-rules.cjs',
    ],
    rules: {
        'react/react-in-jsx-scope': 'off',
        'react/jsx-uses-react': 'off',
        // While using React.FC, this will give false positives
        'react/prop-types': 'off',
        // React is now imported by default
        'jsx-uses-react': 'off',
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
};
