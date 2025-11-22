import { dojoCohorts } from '@/database/user';
import { DateTime } from 'luxon';
import { Options, RRule } from 'rrule';
import { getTimeZonedDate } from '../displayDate';
import { getDefaultRRuleCount, RRuleEnds, UseEventEditorResponse } from './useEventEditor';

export function validateTimes(
    editor: UseEventEditorResponse,
    errors: Record<string, string>,
    minEnd?: DateTime<boolean> | null,
) {
    if (editor.start === null) {
        errors.start = 'This field is required';
    } else if (!editor.start.isValid) {
        errors.start = 'Start time must be a valid time';
    }

    if (editor.end === null) {
        errors.end = 'This field is required';
    } else if (!editor.end.isValid) {
        errors.end = 'End time must be a valid time';
    } else if (minEnd && editor.end < minEnd) {
        errors.end = 'End time must be at least one hour after start time';
    }
}

export function requireField(
    editor: UseEventEditorResponse,
    field: keyof UseEventEditorResponse,
    errors: Record<string, string>,
) {
    const value = editor[field];
    if (typeof value === 'string' && !value.trim()) {
        errors[field] = 'This field is required';
    } else if (typeof value === 'number' && value < 0) {
        errors[field] = 'This field is required';
    }
}

export function requireMaxParticipants(
    editor: UseEventEditorResponse,
    errors: Record<string, string>,
): number {
    if (!editor.maxParticipants.trim()) {
        errors.maxParticipants = 'This field is required';
        return -1;
    }

    const maxParticipants = parseFloat(editor.maxParticipants);
    if (isNaN(maxParticipants) || !Number.isInteger(maxParticipants) || maxParticipants < 1) {
        errors.maxParticipants = 'You must specify an integer greater than 0';
        return -1;
    }

    return Math.round(maxParticipants);
}

export function requirePrice(
    editor: UseEventEditorResponse,
    field: 'fullPrice' | 'currentPrice',
    errors: Record<string, string>,
): number {
    if (!editor[field].trim()) {
        errors[field] = 'This field is required';
        return -1;
    }

    return optionalPrice(editor, field, errors);
}

export function optionalPrice(
    editor: UseEventEditorResponse,
    field: 'fullPrice' | 'currentPrice',
    errors: Record<string, string>,
): number {
    if (!editor[field].trim()) {
        return -1;
    }

    const price = 100 * parseFloat(editor[field].trim());
    if (isNaN(price)) {
        errors[field] = 'You must specify a number';
        return -1;
    }
    if (!Number.isInteger(price)) {
        errors[field] = 'You must specify a valid dollar amount with up to 2 decimal places';
        return -1;
    }
    if (price < 500) {
        errors[field] = 'Price must be at least $5';
        return -1;
    }
    return price;
}

export function selectedCohorts(editor: UseEventEditorResponse): string[] {
    return editor.allCohorts ? dojoCohorts : dojoCohorts.filter((c) => editor.cohorts[c]);
}

export function validateRrule(
    editor: UseEventEditorResponse,
    timezoneOverride: string,
    errors: Record<string, string>,
): string {
    if (!editor.rruleOptions.freq || !editor.start) {
        return '';
    }

    const options: Partial<Options> = {
        freq: editor.rruleOptions.freq,
        dtstart: getTimeZonedDate(editor.start.toJSDate(), timezoneOverride, 'forward'),
    };

    if (editor.rruleOptions.ends === RRuleEnds.Count) {
        options.count = editor.rruleOptions.count ?? getDefaultRRuleCount(editor.rruleOptions.freq);
        if (options.count <= 0) {
            errors.count = 'Must be greater than 0';
        }
    }

    if (editor.rruleOptions.ends === RRuleEnds.Until) {
        if (editor.rruleOptions.until) {
            options.until = new Date(
                getTimeZonedDate(
                    editor.rruleOptions.until.toJSDate(),
                    timezoneOverride,
                ).toISOString(),
            );
        } else {
            options.until = new Date(
                getTimeZonedDate(
                    editor.start.plus({ months: 1 }).toJSDate(),
                    timezoneOverride,
                ).toISOString(),
            );
        }
    }

    return RRule.optionsToString(options);
}
