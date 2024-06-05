#!/usr/bin/env node

import pathlib from 'path';
import process from 'process';

import commandLineArgs from 'command-line-args';
import commandLineUsage from 'command-line-usage';
import { ESLint } from 'eslint';
import { writeFileSync } from 'fs';

const usage = [
    {
        header: 'ESLint Config Baseline Generator',
        content: 'Derive an eslint configuration on what rules are currently passing',
    },
    {
        header: 'Options',
        optionList: [
            {
                name: 'inPath',
                alias: 'i',
                type: String,
                description: 'Source eslint config file to establish baseline from',
            },
            {
                name: 'outPath',
                alias: 'o',
                type: String,
                description: 'Destination to write passing eslint config file',
            },
            {
                name: 'root',
                type: String,
                description:
                    'The working directory where outPath will be loaded/run by eslint.',
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

async function main() {
    const optionList = usage.find((section) => section.header === 'Options').optionList;
    const { inPath, outPath, root, help } = commandLineArgs(optionList);

    if (help || !inPath || !outPath || !root) {
        const usageMsg = commandLineUsage(usage);
        console.error(usageMsg);
        process.exit(0);
    }

    const absRoot = pathlib.resolve(root);
    const eslint = new ESLint({
        overrideConfigFile: inPath,
    });

    const results = await eslint.lintFiles(root);
    const filesByRule = {};
    for (const result of results) {
        const filePath = pathlib.relative(absRoot, result.filePath);
        for (const message of result.messages) {
            const { ruleId } = message;
            if (ruleId) {
                filesByRule[ruleId] ??= new Set();
                filesByRule[ruleId].add(filePath);
            }
        }
    }

    const failingRules = [...Object.keys(filesByRule)].sort();
    const overrides = [];
    for (const ruleId of failingRules) {
        overrides.push({
            files: [...filesByRule[ruleId]].toSorted(),
            rules: { [ruleId]: 'off' },
        });
    }

    const baselineConfig = {
        overrides,
        extends: [`./${pathlib.relative(absRoot, inPath)}`],
    };

    writeFileSync(outPath, JSON.stringify(baselineConfig, null, 4));
}

main().catch((err) => console.error(err));
