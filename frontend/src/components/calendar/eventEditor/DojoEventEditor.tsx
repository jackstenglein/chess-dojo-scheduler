import { Event, EventStatus } from '@/database/event';
import { dojoCohorts, User } from '@/database/user';
import { ProcessedEvent } from '@jackstenglein/react-scheduler/types';
import { Options, RRule } from 'rrule';
import { getTimeZonedDate } from '../displayDate';
import { getDefaultRRuleCount, RRuleEnds, UseEventEditorResponse } from './useEventEditor';

export function validateDojoEventEditor(
    user: User,
    originalEvent: ProcessedEvent | undefined,
    editor: UseEventEditorResponse,
): [Event | null, Record<string, string>] {
    const errors: Record<string, string> = {};

    if (editor.title.trim() === '') {
        errors.title = 'This field is required';
    }

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

    if (
        editor.rruleOptions.freq !== undefined &&
        editor.rruleOptions.ends === RRuleEnds.Count &&
        (editor.rruleOptions.count ?? getDefaultRRuleCount(editor.rruleOptions.freq)) <= 0
    ) {
        errors.count = 'Must be greater than 0';
    }

    const selectedCohorts = editor.allCohorts
        ? dojoCohorts
        : dojoCohorts.filter((c) => editor.cohorts[c]);

    if (Object.entries(errors).length > 0) {
        return [null, errors];
    }
    if (!editor.start || !editor.end) {
        return [null, errors];
    }

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
            location: editor.location,
            description: editor.description,
            maxParticipants: 0,
            hideFromPublicDiscord: editor.hideFromPublicDiscord,
            rrule,
        },
        errors,
    ];
}
