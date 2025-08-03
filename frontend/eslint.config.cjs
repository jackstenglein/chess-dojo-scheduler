const reactRules = require('@jackstenglein/eslint-config-dojo/react-rules');
const recommended = require('@jackstenglein/eslint-config-dojo/recommended');
const next = require('eslint-config-next');
const coreWebVitals = require('eslint-config-next/core-web-vitals');
const nextTypescript = require('eslint-config-next/typescript');

module.exports = [
    recommended,
    reactRules,
    next,
    coreWebVitals,
    nextTypescript,
    {
        languageOptions: {
            parser: tsParser,
            parserOptions: {
                project: true,
                tsconfigRootDir: __dirname,
            },
        },
        settings: {
            react: {
                version: 'detect',
            },
        },
    },
    {
        ignores: [
            'build/**/*',
            'node_modules/**/*',
            'coverage/**/*',
            'public/**/*',
            'src/stockfish/engine/sf17-79.js',
            'src/stockfish/engine/sf171-79.js',
            'scripts/simulate-suggested-tasks.ts',
        ],
    },
];
