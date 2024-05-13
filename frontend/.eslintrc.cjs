/* eslint-env node */
module.exports = {
    extends: [
        'eslint:recommended',
        'plugin:eqeqeq-fix/recommended',
        'plugin:cypress/recommended',
        'plugin:@typescript-eslint/strict-type-checked',
        'plugin:@typescript-eslint/stylistic-type-checked',
        'plugin:react-hooks/recommended',
        'plugin:react/recommended',
        'plugin:eqeqeq-fix/recommended',
        'plugin:cypress/recommended',
    ],
    rules: {
        'react/react-in-jsx-scope': 'off',
        'react/jsx-uses-react': 'off',
    },
    plugins: ['@typescript-eslint'],
    parser: '@typescript-eslint/parser',
    parserOptions: {
        project: true,
        tsconfigRootDir: __dirname,
    },
    root: true,
};
