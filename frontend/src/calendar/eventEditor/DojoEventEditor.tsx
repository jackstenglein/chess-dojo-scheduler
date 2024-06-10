import { ProcessedEvent } from '@aldabil/react-scheduler/types';
import { Checkbox, FormControlLabel } from '@mui/material';
import { Event, EventStatus } from '../../database/event';
import { User, dojoCohorts } from '../../database/user';
import { getTimeZonedDate } from '../displayDate';
import CohortsFormSection from './form/CohortsFormSection';
import DescriptionFormSection from './form/DescriptionFormSection';
import LocationFormSection from './form/LocationFormSection';
import TimesFormSection from './form/TimesFormSection';
import TitleFormSection from './form/TitleFormSection';
import { UseEventEditorResponse } from './useEventEditor';

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
        hideFromPublicDiscord,
        setHideFromPublicDiscord,
        errors,
    } = editor;

    return (
        <>
            <FormControlLabel
                label='Hide from public Discord server? If checked, no event will be created in the public Discord.'
                control={
                    <Checkbox
                        checked={hideFromPublicDiscord}
                        onChange={(e) => setHideFromPublicDiscord(e.target.checked)}
                    />
                }
            />

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
