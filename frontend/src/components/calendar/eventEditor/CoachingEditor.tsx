import { Event, EventStatus } from '@/database/event';
import { dojoCohorts, User } from '@/database/user';
import { ProcessedEvent } from '@jackstenglein/react-scheduler/types';
import { Options, RRule } from 'rrule';
import { getTimeZonedDate } from '../displayDate';
import { getDefaultRRuleCount, RRuleEnds, UseEventEditorResponse } from './useEventEditor';

function validatePrice(priceStr: string): [number, string] {
    const price = 100 * parseFloat(priceStr.trim());
    if (isNaN(price)) {
        return [-1, 'You must specify a number'];
    }
    if (!Number.isInteger(price)) {
        return [-1, 'You must specify a valid dollar amount with up to 2 decimal places'];
    }
    if (price < 500) {
        return [-1, 'Price must be at least $5'];
    }
    return [price, ''];
}

export function validateCoachingEditor(
    user: User,
    originalEvent: ProcessedEvent | undefined,
    editor: UseEventEditorResponse,
): [Event | null, Record<string, string>] {
    const errors: Record<string, string> = {};

    if (editor.start === null) {
        errors.start = 'This field is required';
    } else if (!editor.start.isValid) {
        errors.start = 'Start time must be a valid time';
    }

    if (editor.end === null) {
        errors.end = 'This field is required';
    } else if (!editor.end.isValid) {
        errors.end = 'End time must be a valid time';
    }

    if (!editor.title.trim()) {
        errors.title = 'This field is required';
    }

    if (!editor.description.trim()) {
        errors.description = 'This field is required';
    }

    if (!editor.location.trim()) {
        errors.location = 'This field is required';
    }

    let maxParticipants = -1;
    if (!editor.maxParticipants.trim()) {
        errors.maxParticipants = 'This field is required';
    } else {
        maxParticipants = parseFloat(editor.maxParticipants);
        if (isNaN(maxParticipants) || !Number.isInteger(maxParticipants) || maxParticipants < 1) {
            errors.maxParticipants = 'You must specify an integer greater than 0';
        } else {
            maxParticipants = Math.round(maxParticipants);
        }
    }

    let fullPrice = -1;
    if (!editor.fullPrice.trim()) {
        errors.fullPrice = 'This field is required';
    } else {
        const [price, error] = validatePrice(editor.fullPrice);
        fullPrice = price;
        if (error) {
            errors.fullPrice = error;
        }
    }

    let currentPrice = -1;
    if (editor.currentPrice.trim()) {
        const [price, error] = validatePrice(editor.currentPrice);
        currentPrice = price;
        if (error) {
            errors.currentPrice = error;
        } else if (currentPrice >= fullPrice) {
            errors.currentPrice = 'This must be less than the full price';
        }
    }

    if (Object.entries(errors).length > 0) {
        return [null, errors];
    }
    if (!editor.start || !editor.end) {
        return [null, errors];
    }

    const selectedCohorts = editor.allCohorts
        ? dojoCohorts
        : dojoCohorts.filter((c) => editor.cohorts[c]);

    const startTime = getTimeZonedDate(
        editor.start.toJSDate(),
        user.timezoneOverride,
        'forward',
    ).toISOString();
    const endTime = getTimeZonedDate(
        editor.end.toJSDate(),
        user.timezoneOverride,
        'forward',
    ).toISOString();

    let rrule = '';
    if (editor.rruleOptions.freq) {
        const options: Partial<Options> = {
            freq: editor.rruleOptions.freq,
            dtstart: new Date(startTime),
        };

        if (editor.rruleOptions.ends === RRuleEnds.Count) {
            options.count =
                editor.rruleOptions.count ?? getDefaultRRuleCount(editor.rruleOptions.freq);
        }

        if (editor.rruleOptions.ends === RRuleEnds.Until) {
            if (editor.rruleOptions.until) {
                options.until = new Date(
                    getTimeZonedDate(
                        editor.rruleOptions.until.toJSDate(),
                        user.timezoneOverride,
                    ).toISOString(),
                );
            } else {
                options.until = new Date(
                    getTimeZonedDate(
                        editor.start.plus({ months: 1 }).toJSDate(),
                        user.timezoneOverride,
                    ).toISOString(),
                );
            }
        }

        rrule = RRule.optionsToString(options);
    }

    return [
        {
            ...((originalEvent?.event as Event) ?? {}),
            type: editor.type,
            owner: user.username,
            ownerDisplayName: user.displayName,
            ownerCohort: user.dojoCohort,
            ownerPreviousCohort: user.previousCohort,
            title: editor.title.trim(),
            startTime,
            endTime,
            types: [],
            cohorts: selectedCohorts,
            status: EventStatus.Scheduled,
            location: editor.location.trim(),
            description: editor.description.trim(),
            maxParticipants,
            coaching: {
                stripeId: user.coachInfo?.stripeId || '',
                fullPrice,
                currentPrice,
                bookableByFreeUsers: editor.bookableByFreeUsers,
                hideParticipants: editor.hideParticipants,
            },
            rrule,
        },
        errors,
    ];
}
