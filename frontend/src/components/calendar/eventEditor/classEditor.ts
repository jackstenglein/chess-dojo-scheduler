import { Event, EventStatus, EventType } from '@/database/event';
import { User } from '@/database/user';
import { ProcessedEvent } from '@jackstenglein/react-scheduler/types';
import { getTimeZonedDate } from '../displayDate';
import {
    optionalPrice,
    requireField,
    requirePrice,
    selectedCohorts,
    validateRrule,
    validateTimes,
} from './eventValidation';
import { UseEventEditorResponse } from './useEventEditor';

export function validateClassEditor(
    user: User,
    originalEvent: ProcessedEvent | undefined,
    editor: UseEventEditorResponse,
): [Event | null, Record<string, string>] {
    const errors: Record<string, string> = {};

    validateTimes(editor, errors);
    requireField(editor, 'title', errors);
    requireField(editor, 'description', errors);
    requireField(editor, 'location', errors);
    const fullPrice =
        editor.type === EventType.LectureTier ? requirePrice(editor, 'fullPrice', errors) : -1;
    const currentPrice = optionalPrice(editor, 'currentPrice', errors);
    const rrule = validateRrule(editor, user.timezoneOverride, errors);

    if (Object.entries(errors).length > 0) {
        return [null, errors];
    }
    if (!editor.start || !editor.end) {
        return [null, errors];
    }

    return [
        {
            ...((originalEvent?.event as Event) ?? {}),
            type: editor.type,
            owner: user.username,
            ownerDisplayName: user.displayName,
            ownerCohort: user.dojoCohort,
            title: editor.title.trim(),
            startTime: getTimeZonedDate(
                editor.start.toJSDate(),
                user.timezoneOverride,
                'forward',
            ).toISOString(),
            endTime: getTimeZonedDate(
                editor.end.toJSDate(),
                user.timezoneOverride,
                'forward',
            ).toISOString(),
            rrule,
            cohorts: selectedCohorts(editor),
            status: EventStatus.Scheduled,
            location: editor.location.trim(),
            description: editor.description.trim(),
            maxParticipants: 0,
            coaching: {
                stripeId: user.coachInfo?.stripeId ?? '',
                fullPrice,
                currentPrice,
                bookableByFreeUsers: true,
                hideParticipants: false,
            },
        },
        errors,
    ];
}
