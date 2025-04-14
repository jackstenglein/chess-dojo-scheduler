import { useAuth } from '@/auth/Auth';
import MultipleSelectChip from '@/components/ui/MultipleSelectChip';
import {
    AvailabilityType,
    Event,
    EventStatus,
    getDefaultNumberOfParticipants,
    getDisplayString,
} from '@/database/event';
import { User, dojoCohorts } from '@/database/user';
import Icon from '@/style/Icon';
import { ProcessedEvent } from '@jackstenglein/react-scheduler/types';
import { Stack, Typography } from '@mui/material';
import { getTimeZonedDate } from '../displayDate';
import CohortsFormSection from './form/CohortsFormSection';
import DescriptionFormSection from './form/DescriptionFormSection';
import { InviteFormSection } from './form/InviteFormSection';
import LocationFormSection from './form/LocationFormSection';
import MaxParticipantsFormSection from './form/MaxParticipantsFormSection';
import TimesFormSection from './form/TimesFormSection';
import TitleFormSection from './form/TitleFormSection';
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

interface AvailabilityEditorProps {
    editor: UseEventEditorResponse;
}

const AvailabilityEditor: React.FC<AvailabilityEditorProps> = ({ editor }) => {
    const { user } = useAuth();

    const {
        start,
        setStart,
        end,
        setEnd,
        title,
        setTitle,
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
        rruleOptions,
        setRRuleOptions,
        invited,
        setInvited,
        inviteOnly,
        setInviteOnly,
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
                    getDefaultNumberOfParticipants(type as AvailabilityType),
                );
            }
        });
    }

    const minEnd = getMinEnd(start);

    const selectedTypes = allAvailabilityTypes
        ? [AllTypes]
        : Object.keys(availabilityTypes).filter((t) => availabilityTypes[t as AvailabilityType]);

    const onChangeType = (newTypes: string[]) => {
        const addedTypes = newTypes.filter((t) => !selectedTypes.includes(t));
        if (addedTypes.includes(AllTypes)) {
            setAllAvailabilityTypes(true);
            Object.values(AvailabilityTypes).forEach((t) => setAvailabilityType(t, false));
        } else {
            setAllAvailabilityTypes(false);
            Object.values(AvailabilityTypes).forEach((t) => setAvailabilityType(t, false));
            newTypes.forEach((t) => {
                if (t !== AllTypes) {
                    setAvailabilityType(t as AvailabilityType, true);
                }
            });
        }
    };

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
                rruleOptions={rruleOptions}
                setRRuleOptions={setRRuleOptions}
            />

            <TitleFormSection
                label='Title (Optional)'
                title={title}
                setTitle={setTitle}
                error={errors.title}
            />

            <LocationFormSection
                location={location}
                setLocation={setLocation}
                helperText='Defaults to "Discord" if left blank.'
                subtitle='Add a Zoom link, specify a Discord classroom, etc.'
            />

            <DescriptionFormSection
                subtitle='Add a sparring position or any other notes for your opponent.'
                description={description}
                setDescription={setDescription}
            />

            <Stack data-cy='availability-types-section'>
                <Typography variant='h6'>
                    <Icon
                        name='meet'
                        color='primary'
                        sx={{ marginRight: '0.4rem', verticalAlign: 'middle' }}
                        fontSize='medium'
                    />
                    Availability Types
                </Typography>
                <Typography variant='subtitle1' color='text.secondary' mb={0.5}>
                    Choose the meeting types you are available for.
                </Typography>

                <MultipleSelectChip
                    selected={selectedTypes}
                    setSelected={onChangeType}
                    options={Object.values(AvailabilityType).map((t) => ({
                        value: t,
                        label: getDisplayString(t),
                        icon: <Icon name={t} color='primary' />,
                    }))}
                    error={Boolean(errors.types)}
                    helperText={errors.types}
                    data-cy='availability-type-selector'
                />
            </Stack>

            <MaxParticipantsFormSection
                maxParticipants={maxParticipants}
                setMaxParticipants={setMaxParticipants}
                subtitle='The number of people that can book your availability (not including yourself).'
                helperText={`Defaults to ${defaultMaxParticipants} if left blank.`}
            />

            <InviteFormSection
                owner={user?.username || ''}
                invited={invited}
                setInvited={setInvited}
                inviteOnly={inviteOnly}
                setInviteOnly={setInviteOnly}
                errors={errors}
            />

            {!inviteOnly && (
                <CohortsFormSection
                    description='Choose the cohorts that can book your availability.'
                    allCohorts={allCohorts}
                    setAllCohorts={setAllCohorts}
                    cohorts={cohorts}
                    setCohort={setCohort}
                    error={errors.cohorts}
                />
            )}
        </>
    );
};

export default AvailabilityEditor;
