import { Event, EventStatus } from '@/database/event';
import { User } from '@/database/user';
import { ProcessedEvent } from '@jackstenglein/react-scheduler/types';
import { getTimeZonedDate } from '../displayDate';
import { requireField, selectedCohorts, validateRrule, validateTimes } from './eventValidation';
import { UseEventEditorResponse } from './useEventEditor';

export function validateDojoEventEditor(
    user: User,
    originalEvent: ProcessedEvent | undefined,
    editor: UseEventEditorResponse,
): [Event | null, Record<string, string>] {
    const errors: Record<string, string> = {};

    validateTimes(editor, errors);
    requireField(editor, 'title', errors);
    const rrule = validateRrule(editor, user.timezoneOverride, errors);

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
            rrule,
            types: [],
            cohorts: selectedCohorts(editor),
            status: EventStatus.Scheduled,
            location: editor.location.trim(),
            description: editor.description.trim(),
            maxParticipants: 0,
        },
        errors,
    ];
}
