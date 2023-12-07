import { ProcessedEvent } from '@aldabil/react-scheduler/types';
import { Stack, TextField, Typography } from '@mui/material';

import { UseEventEditorResponse, isValidDate } from './useEventEditor';
import CohortsFormSection from './CohortsFormSection';
import TimesFormSection from './TimesFormSection';
import LocationFormSection from './LocationFormSection';
import DescriptionFormSection from './DescriptionFormSection';
import { User, dojoCohorts } from '../../database/user';
import { AvailabilityStatus, Event } from '../../database/event';

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

    const startTime = editor.start!.toISOString();
    const endTime = editor.end!.toISOString();
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
            status: AvailabilityStatus.Scheduled,
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

            <Stack>
                <Typography variant='h6'>Event Title</Typography>
                <Typography variant='subtitle1' color='text.secondary' sx={{ mb: 2 }}>
                    This title will be used in the calendar and in the Discord events.
                </Typography>
                <TextField
                    fullWidth
                    label='Title'
                    variant='outlined'
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    error={!!errors.title}
                    helperText={errors.title}
                />
            </Stack>

            <DescriptionFormSection
                subtitle='This description will be visible in the calendar and the Discord events.'
                description={description}
                setDescription={setDescription}
            />

            <LocationFormSection
                location={location}
                setLocation={setLocation}
                helperText='Defaults to "No Location Provided" if left blank.'
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
