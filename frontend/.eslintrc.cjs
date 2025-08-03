/* eslint-env node */
module.exports = {
    extends: [
        '@jackstenglein/eslint-config-dojo/recommended',
        '@jackstenglein/eslint-config-dojo/next',
    ],
    // parser: '@typescript-eslint/parser',
    // parserOptions: {
    //     project: true,
    //     tsconfigRootDir: __dirname,
    // },
    // settings: {
    //     react: {
    //         version: 'detect',
    //     },
    // },
    ignorePatterns: [
        'build/**',
        'node_modules/**',
        'coverage/**',
        'public/**',
        'src/stockfish/engine/sf17-79.js',
        'src/stockfish/engine/sf171-79.js',
        'scripts/simulate-suggested-tasks.ts',
    ],
    root: true,
};
