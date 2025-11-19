import {
    AvailabilityType,
    Event,
    EventStatus,
    getDefaultNumberOfParticipants,
} from '@/database/event';
import { User, dojoCohorts } from '@/database/user';
import { ProcessedEvent } from '@jackstenglein/react-scheduler/types';
import { getTimeZonedDate } from '../displayDate';
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

    if (editor.start === null) {
        errors.start = 'This field is required';
    } else if (!editor.start.isValid) {
        errors.start = 'Start time must be a valid time';
    }

    if (editor.end === null) {
        errors.end = 'This field is required';
    } else if (!editor.end.isValid) {
        errors.end = 'End time must be a valid time';
    } else if (minEnd !== null && editor.end < minEnd) {
        errors.end = 'End time must be at least one hour after start time';
    }

    const selectedTypes: AvailabilityType[] = editor.allAvailabilityTypes
        ? Object.values(AvailabilityTypes)
        : (Object.keys(editor.availabilityTypes).filter(
              (t) => editor.availabilityTypes[t as AvailabilityType],
          ) as AvailabilityType[]);
    if (selectedTypes.length === 0) {
        errors.types = 'At least one type is required';
    }
    const selectedCohorts = editor.allCohorts
        ? dojoCohorts
        : dojoCohorts.filter((c) => editor.cohorts[c]);
    if (!editor.inviteOnly && selectedCohorts.length === 0) {
        errors.cohorts = 'At least one cohort is required';
    }

    let maxParticipants = getDefaultMaxParticipants(
        editor.allAvailabilityTypes,
        editor.availabilityTypes,
    );
    if (editor.maxParticipants !== '') {
        maxParticipants = parseFloat(editor.maxParticipants);
        if (isNaN(maxParticipants) || !Number.isInteger(maxParticipants) || maxParticipants < 1) {
            errors.maxParticipants = 'You must specify an integer greater than 0';
        } else {
            maxParticipants = Math.round(maxParticipants);
        }
    }

    if (editor.inviteOnly && editor.invited.length === 0) {
        errors.invited = 'At least one user is required when the event is invite-only';
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
            title: editor.title,
            startTime,
            endTime,
            types: selectedTypes,
            cohorts: selectedCohorts,
            status: EventStatus.Scheduled,
            location: editor.location,
            description: editor.description,
            maxParticipants,
            invited: editor.invited,
            inviteOnly: editor.inviteOnly,
        },
        errors,
    ];
}
