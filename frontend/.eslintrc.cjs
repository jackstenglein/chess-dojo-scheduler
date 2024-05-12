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
    plugins: ['@typescript-eslint'],
    parser: '@typescript-eslint/parser',
    parserOptions: {
        project: true,
        tsconfigRootDir: __dirname,
    },
    root: true,
};
