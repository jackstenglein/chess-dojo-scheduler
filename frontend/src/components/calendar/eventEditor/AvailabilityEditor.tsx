import {
    AvailabilityType,
    Event,
    EventStatus,
    getDefaultNumberOfParticipants,
} from '@/database/event';
import { User } from '@/database/user';
import { ProcessedEvent } from '@jackstenglein/react-scheduler/types';
import { getTimeZonedDate } from '../displayDate';
import { requireMaxParticipants, selectedCohorts, validateTimes } from './eventValidation';
import { UseEventEditorResponse, getMinEnd } from './useEventEditor';

const { AllTypes, ...AvailabilityTypes } = AvailabilityType;

function getDefaultMaxParticipants(
    allAvailabilityTypes: boolean,
    availabilityTypes: Record<string, boolean>,
): number {
    if (allAvailabilityTypes) {
        return 100;
    } else {
        let defaultMaxParticipants = 1;
        Object.entries(availabilityTypes).forEach(([type, enabled]) => {
            if (enabled) {
                defaultMaxParticipants = Math.max(
                    defaultMaxParticipants,
                    getDefaultNumberOfParticipants(type as AvailabilityType),
                );
            }
        });
        return defaultMaxParticipants;
    }
}

export function validateAvailabilityEditor(
    user: User,
    originalEvent: ProcessedEvent | undefined,
    editor: UseEventEditorResponse,
): [Event | null, Record<string, string>] {
    const errors: Record<string, string> = {};
    const minEnd = getMinEnd(editor.start);

    validateTimes(editor, errors, minEnd);

    const selectedTypes: AvailabilityType[] = editor.allAvailabilityTypes
        ? Object.values(AvailabilityTypes)
        : (Object.keys(editor.availabilityTypes).filter(
              (t) => editor.availabilityTypes[t as AvailabilityType],
          ) as AvailabilityType[]);
    if (selectedTypes.length === 0) {
        errors.types = 'At least one type is required';
    }
    const cohorts = selectedCohorts(editor);
    if (!editor.inviteOnly && cohorts.length === 0) {
        errors.cohorts = 'At least one cohort is required';
    }
    if (editor.inviteOnly && editor.invited.length === 0) {
        errors.invited = 'At least one user is required when the event is invite-only';
    }

    let maxParticipants = getDefaultMaxParticipants(
        editor.allAvailabilityTypes,
        editor.availabilityTypes,
    );
    if (editor.maxParticipants !== '') {
        maxParticipants = requireMaxParticipants(editor, errors);
    }

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
            types: selectedTypes,
            cohorts,
            status: EventStatus.Scheduled,
            location: editor.location.trim(),
            description: editor.description.trim(),
            maxParticipants,
            invited: editor.invited,
            inviteOnly: editor.inviteOnly,
        },
        errors,
    ];
}
