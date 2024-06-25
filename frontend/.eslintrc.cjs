/* eslint-env node */
module.exports = {
    extends: [
        '@jackstenglein/eslint-config-dojo/recommended',
        '@jackstenglein/eslint-config-dojo/react',
    ],
    parser: '@typescript-eslint/parser',
    parserOptions: {
        project: true,
        tsconfigRootDir: __dirname,
    },
    settings: {
        react: {
            version: 'detect',
        },
    },
    ignorePatterns: ['build/**', 'node_modules/**'],
    root: true,
};
