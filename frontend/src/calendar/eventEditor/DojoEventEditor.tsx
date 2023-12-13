import { ProcessedEvent } from '@aldabil/react-scheduler/types';

import { UseEventEditorResponse, isValidDate } from './useEventEditor';
import CohortsFormSection from './form/CohortsFormSection';
import TimesFormSection from './form/TimesFormSection';
import LocationFormSection from './form/LocationFormSection';
import DescriptionFormSection from './form/DescriptionFormSection';
import { User, dojoCohorts } from '../../database/user';
import { EventStatus, Event } from '../../database/event';
import { getTimeZonedDate } from '../displayDate';
import TitleFormSection from './form/TitleFormSection';

export function validateDojoEventEditor(
    user: User,
    originalEvent: ProcessedEvent | undefined,
    editor: UseEventEditorResponse
): [Event | null, Record<string, string>] {
    const errors: Record<string, string> = {};

    if (editor.title.trim() === '') {
        errors.title = 'This field is required';
    }

    if (editor.start === null) {
        errors.start = 'This field is required';
    } else if (!isValidDate(editor.start)) {
        errors.start = 'Start time must be a valid time';
    }

    if (editor.end === null) {
        errors.end = 'This field is required';
    } else if (!isValidDate(editor.end)) {
        errors.end = 'End time must be a valid time';
    }

    const selectedCohorts = editor.allCohorts
        ? dojoCohorts
        : dojoCohorts.filter((c) => editor.cohorts[c]);

    if (Object.entries(errors).length > 0) {
        return [null, errors];
    }

    const startTime = getTimeZonedDate(
        editor.start!,
        user.timezoneOverride,
        'forward'
    ).toISOString();
    const endTime = getTimeZonedDate(
        editor.end!,
        user.timezoneOverride,
        'forward'
    ).toISOString();

    return [
        {
            ...(originalEvent?.event ?? {}),
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
        },
        errors,
    ];
}

interface DojoEventEditorProps {
    editor: UseEventEditorResponse;
}

const DojoEventEditor: React.FC<DojoEventEditorProps> = ({ editor }) => {
    const {
        title,
        setTitle,
        start,
        setStart,
        end,
        setEnd,
        location,
        setLocation,
        description,
        setDescription,
        allCohorts,
        setAllCohorts,
        cohorts,
        setCohort,
        errors,
    } = editor;

    return (
        <>
            <TimesFormSection
                start={start}
                setStart={setStart}
                startError={errors.start}
                end={end}
                setEnd={setEnd}
                endError={errors.end}
                minEnd={null}
            />

            <TitleFormSection
                title={title}
                subtitle='This title will be used in the calendar and in the Discord events.'
                setTitle={setTitle}
                error={errors.title}
            />

            <DescriptionFormSection
                subtitle='This description will be visible in the calendar and the Discord events.'
                description={description}
                setDescription={setDescription}
            />

            <LocationFormSection
                location={location}
                setLocation={setLocation}
                helperText='Defaults to "No Location Provided" if left blank.'
                subtitle='Add a Zoom link, specify a Discord classroom, etc.'
            />

            <CohortsFormSection
                description='Choose the cohorts that can see this event. If no cohorts are selected, all cohorts will be able to view the event.'
                allCohorts={allCohorts}
                setAllCohorts={setAllCohorts}
                cohorts={cohorts}
                setCohort={setCohort}
                error={errors.cohorts}
            />
        </>
    );
};

export default DojoEventEditor;
