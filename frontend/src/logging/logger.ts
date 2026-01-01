/* eslint-disable no-console */
import { getConfig } from '@/config';
import { LogLevel } from './logLevel';

const logLevel = getConfig().logLevel;

export const logger = {
    debug: logLevel <= LogLevel.Debug ? console.debug : undefined,
    log: logLevel <= LogLevel.Log ? console.log : undefined,
    info: logLevel <= LogLevel.Info ? console.info : undefined,
    warn: logLevel <= LogLevel.Warning ? console.warn : undefined,
    error: logLevel <= LogLevel.Error ? console.error : undefined,
} as const;
