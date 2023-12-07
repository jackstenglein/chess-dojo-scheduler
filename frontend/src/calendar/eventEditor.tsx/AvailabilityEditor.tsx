import { ProcessedEvent } from '@aldabil/react-scheduler/types';
import {
    Stack,
    TextField,
    FormControlLabel,
    Checkbox,
    FormHelperText,
    FormControl,
    Typography,
} from '@mui/material';

import {
    AvailabilityStatus,
    AvailabilityType,
    Event,
    getDefaultNumberOfParticipants,
    getDisplayString,
} from '../../database/event';
import { UseEventEditorResponse, getMinEnd, isValidDate } from './useEventEditor';
import CohortsFormSection from './CohortsFormSection';
import TimesFormSection from './TimesFormSection';
import LocationFormSection from './LocationFormSection';
import DescriptionFormSection from './DescriptionFormSection';
import { User, dojoCohorts } from '../../database/user';
import { getTimeZonedDate } from '../displayDate';

function getDefaultMaxParticipants(
    allAvailabilityTypes: boolean,
    availabilityTypes: Record<string, boolean>
): number {
    if (allAvailabilityTypes) {
        return 100;
    } else {
        let defaultMaxParticipants = 1;
        Object.entries(availabilityTypes).forEach(([type, enabled]) => {
            if (enabled) {
                defaultMaxParticipants = Math.max(
                    defaultMaxParticipants,
                    getDefaultNumberOfParticipants(type as AvailabilityType)
                );
            }
        });
        return defaultMaxParticipants;
    }
}

export function validateAvailabilityEditor(
    user: User,
    originalEvent: ProcessedEvent | undefined,
    editor: UseEventEditorResponse
): [Event | null, Record<string, string>] {
    const errors: Record<string, string> = {};
    const minEnd = getMinEnd(editor.start);

    if (editor.start === null) {
        errors.start = 'This field is required';
    } else if (!isValidDate(editor.start)) {
        errors.start = 'Start time must be a valid time';
    }

    if (editor.end === null) {
        errors.end = 'This field is required';
    } else if (!isValidDate(editor.end)) {
        errors.end = 'End time must be a valid time';
    } else if (minEnd !== null && editor.end < minEnd) {
        errors.end = 'End time must be at least one hour after start time';
    }

    const selectedTypes: AvailabilityType[] = editor.allAvailabilityTypes
        ? Object.values(AvailabilityType)
        : (Object.keys(editor.availabilityTypes).filter(
              (t) => editor.availabilityTypes[t as AvailabilityType]
          ) as AvailabilityType[]);
    if (selectedTypes.length === 0) {
        errors.types = 'At least one type is required';
    }
    const selectedCohorts = editor.allCohorts
        ? dojoCohorts
        : dojoCohorts.filter((c) => editor.cohorts[c]);
    if (selectedCohorts.length === 0) {
        errors.cohorts = 'At least one cohort is required';
    }

    let maxParticipants = getDefaultMaxParticipants(
        editor.allAvailabilityTypes,
        editor.availabilityTypes
    );
    if (editor.maxParticipants !== '') {
        maxParticipants = parseInt(editor.maxParticipants);
        if (isNaN(maxParticipants)) {
            errors.maxParticipants = 'You must specify a number';
        }
    }

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
            title: '',
            startTime,
            endTime,
            types: selectedTypes,
            cohorts: selectedCohorts,
            status: AvailabilityStatus.Scheduled,
            location: editor.location,
            description: editor.description,
            maxParticipants,
        },
        errors,
    ];
}

interface AvailabilityEditorProps {
    editor: UseEventEditorResponse;
}

const AvailabilityEditor: React.FC<AvailabilityEditorProps> = ({ editor }) => {
    const {
        start,
        setStart,
        end,
        setEnd,
        location,
        setLocation,
        description,
        setDescription,
        maxParticipants,
        setMaxParticipants,
        allAvailabilityTypes,
        setAllAvailabilityTypes,
        availabilityTypes,
        setAvailabilityType,
        allCohorts,
        setAllCohorts,
        cohorts,
        setCohort,
        errors,
    } = editor;

    let defaultMaxParticipants = 1;
    if (allAvailabilityTypes) {
        defaultMaxParticipants = 100;
    } else {
        Object.entries(availabilityTypes).forEach(([type, enabled]) => {
            if (enabled) {
                defaultMaxParticipants = Math.max(
                    defaultMaxParticipants,
                    getDefaultNumberOfParticipants(type as AvailabilityType)
                );
            }
        });
    }

    const minEnd = getMinEnd(start);

    return (
        <>
            <TimesFormSection
                description='Availabilities must be at least one hour long'
                start={start}
                setStart={setStart}
                startError={errors.start}
                end={end}
                setEnd={setEnd}
                endError={errors.end}
                minEnd={minEnd}
            />

            <LocationFormSection
                location={location}
                setLocation={setLocation}
                helperText='Defaults to "Discord" if left blank.'
            />

            <DescriptionFormSection
                subtitle='Add a sparring position or any other notes for your opponent.'
                description={description}
                setDescription={setDescription}
            />

            <Stack data-cy='availability-types-section'>
                <Typography variant='h6'>Availability Types</Typography>
                <Typography variant='subtitle1' color='text.secondary'>
                    Choose the meeting types you are available for.
                </Typography>
                <FormControl error={!!errors.types}>
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={allAvailabilityTypes}
                                onChange={(event) =>
                                    setAllAvailabilityTypes(event.target.checked)
                                }
                            />
                        }
                        label='All Types'
                    />
                    <Stack direction='row' sx={{ flexWrap: 'wrap', columnGap: 2.5 }}>
                        {Object.values(AvailabilityType).map((type) => (
                            <FormControlLabel
                                key={type}
                                control={
                                    <Checkbox
                                        checked={
                                            allAvailabilityTypes ||
                                            availabilityTypes[type]
                                        }
                                        onChange={(event) =>
                                            setAvailabilityType(
                                                type,
                                                event.target.checked
                                            )
                                        }
                                    />
                                }
                                disabled={allAvailabilityTypes}
                                label={getDisplayString(type)}
                            />
                        ))}
                    </Stack>
                    <FormHelperText>{errors.types}</FormHelperText>
                </FormControl>
            </Stack>

            <Stack>
                <Typography variant='h6'>Max Participants</Typography>
                <Typography variant='subtitle1' color='text.secondary' sx={{ mb: 1.5 }}>
                    The number of people that can book your availability (not including
                    yourself).
                </Typography>
                <TextField
                    data-cy='participants-textfield'
                    fullWidth
                    label='Max Participants'
                    variant='outlined'
                    value={maxParticipants}
                    inputProps={{
                        inputMode: 'numeric',
                        pattern: '[0-9]*',
                    }}
                    onChange={(event) => setMaxParticipants(event.target.value)}
                    helperText={`Defaults to ${defaultMaxParticipants} if left blank.`}
                />
            </Stack>

            <CohortsFormSection
                description='Choose the cohorts that can book your availability.'
                allCohorts={allCohorts}
                setAllCohorts={setAllCohorts}
                cohorts={cohorts}
                setCohort={setCohort}
                error={errors.cohorts}
            />
        </>
    );
};

export default AvailabilityEditor;
