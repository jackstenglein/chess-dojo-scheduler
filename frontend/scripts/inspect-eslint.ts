#!/usr/bin/env -S npx tsx

import process from 'process';

import commandLineArgs from 'command-line-args';
import commandLineUsage from 'command-line-usage';
import { ESLint } from 'eslint';
import { writeFileSync } from 'fs';

const options = [
    {
        name: 'pattern',
        type: String,
        description:
            'The pattern supplied to the eslint command that specifies the source to lint',
    },
    {
        name: 'outAll',
        type: String,
        description: 'Path to write calculated config per file',
    },
    {
        name: 'outFailing',
        type: String,
        description: 'Path to write failing rules per file',
    },
    {
        name: 'help',
        type: Boolean,
        alias: 'h',
        description: 'Print this usage guide.',
    },
];

const usage = [
    {
        header: 'Debug Eslint Config',
        content: 'Dump information about the eslint setup',
    },
    {
        header: 'Options',
        optionList: options,
    },
];

async function main() {
    const { pattern, help, outAll, outFailing } = commandLineArgs(options) as {
        pattern: string;
        help: boolean;
        outAll: string;
        outFailing: string;
    };

    if (help || !pattern || !outAll || !outFailing) {
        const usageMsg = commandLineUsage(usage);
        console.error(usageMsg);
        process.exit(0);
    }

    const eslint = new ESLint();

    const results = await eslint.lintFiles(pattern);
    const failingFilesByRule: Record<string, Set<string>> = {};
    const allRulesByFile: Record<string, any> = {};
    for (const result of results) {
        const filePath = result.filePath;
        if (!allRulesByFile[filePath]) {
            allRulesByFile[filePath] = await eslint.calculateConfigForFile(
                result.filePath,
            );
        }
        for (const message of result.messages) {
            const { ruleId } = message;
            if (ruleId) {
                failingFilesByRule[ruleId] ??= new Set();
                failingFilesByRule[ruleId].add(filePath);
            }
        }
    }

    const failingRules = [...Object.keys(failingFilesByRule)].sort();
    const failingRulesPretty: Record<string, string[]> = {};
    for (const ruleId of failingRules) {
        failingRulesPretty[ruleId] = [...failingFilesByRule[ruleId]].sort();
    }

    writeFileSync(outFailing, JSON.stringify(failingRules, null, 4));
    writeFileSync(outAll, JSON.stringify(allRulesByFile, null, 4));
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
