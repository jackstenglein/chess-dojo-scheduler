#!/usr/bin/env node

import pathlib from 'path';
import process from 'process';

import commandLineArgs from 'command-line-args';
import commandLineUsage from 'command-line-usage';
import cypress from 'cypress';
import nodemon from 'nodemon';

const scriptPath = pathlib.join('.', 'scripts', 'run-cypress-tests.js');

const usage = [
    {
        header: 'Custom Cypress Test Harness',
        content: 'A utility for re-running cypress tests on code changes',
    },
    {
        header: 'Options',
        optionList: [
            {
                name: 'watch',
                type: String,
                description:
                    'A file pattern indicating what when changed should trigger rerunning tests',
            },
            {
                name: 'spec',
                type: String,
                description: 'A file pattern indicating which tests to run',
            },
            {
                name: 'help',
                type: Boolean,
                alias: 'h',
                description: 'Print this usage guide.',
            },
        ],
    },
];

const optionList = usage.find((section) => section.header == 'Options').optionList;
const { spec, watch, help } = commandLineArgs(optionList);

if (help) {
    const usageMsg = commandLineUsage(usage);
    console.log(usageMsg);
    process.exit(0);
}

if (watch) {
    if (!spec) {
        console.error(
            'Usage: --watch requires --spec to be specified; running all tests on save is colossal.',
        );
        process.exit(1);
    }
    nodemon({
        script: scriptPath,
        args: ['--spec', spec],
        ext: 'js,jsx,ts,tsx,css,scss',
        watch: ['cypress.config.ts', './.env.test.local', spec, watch],
    });
} else {
    const config = {};
    if (spec) {
        config.spec = spec;
    }

    cypress.run(config);
}
