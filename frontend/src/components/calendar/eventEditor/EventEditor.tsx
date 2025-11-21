import { EventType as AnalyticsEventType, trackEvent } from '@/analytics/events';
import { useApi } from '@/api/Api';
import { RequestSnackbar, useRequest } from '@/api/Request';
import { useCache } from '@/api/cache/Cache';
import { useRequiredAuth } from '@/auth/Auth';
import MultipleSelectChip from '@/components/ui/MultipleSelectChip';
import {
    AvailabilityType,
    Event,
    EventType,
    getDefaultNumberOfParticipants,
    getDisplayString,
} from '@/database/event';
import Icon from '@/style/Icon';
import { SchedulerHelpers } from '@jackstenglein/react-scheduler/types';
import LoadingButton from '@mui/lab/LoadingButton';
import {
    AppBar,
    Button,
    Dialog,
    DialogContent,
    DialogTitle,
    FormControl,
    FormControlLabel,
    Radio,
    RadioGroup,
    Slide,
    Stack,
    Toolbar,
    Typography,
} from '@mui/material';
import { TransitionProps } from '@mui/material/transitions';
import { DateTime } from 'luxon';
import { forwardRef, JSX } from 'react';
import { validateAvailabilityEditor } from './AvailabilityEditor';
import { validateCoachingEditor } from './CoachingEditor';
import { validateDojoEventEditor } from './DojoEventEditor';
import { validateClassEditor } from './classEditor';
import CohortsFormSection from './form/CohortsFormSection';
import DescriptionFormSection from './form/DescriptionFormSection';
import { InviteFormSection } from './form/InviteFormSection';
import LocationFormSection from './form/LocationFormSection';
import MaxParticipantsFormSection from './form/MaxParticipantsFormSection';
import { PricingFormSection } from './form/PricingFormSection';
import TimesFormSection from './form/TimesFormSection';
import TitleFormSection from './form/TitleFormSection';
import useEventEditor, {
    EditableEventType,
    getMinEnd,
    UseEventEditorResponse,
} from './useEventEditor';

const Transition = forwardRef(function Transition(
    props: TransitionProps & {
        children: React.ReactElement;
    },
    ref: React.Ref<unknown>,
) {
    return <Slide direction='up' ref={ref} {...props} />;
});

const editorValidators = {
    [EventType.Availability]: validateAvailabilityEditor,
    [EventType.Dojo]: validateDojoEventEditor,
    [EventType.Coaching]: validateCoachingEditor,
    [EventType.LectureTier]: validateClassEditor,
    [EventType.GameReviewTier]: validateClassEditor,
};

interface EventEditorProps {
    scheduler: SchedulerHelpers;
}

const EventEditor: React.FC<EventEditorProps> = ({ scheduler }) => {
    const originalEvent = scheduler.edited;
    const defaultStart = scheduler.state.start.value as Date;
    const defaultEnd = scheduler.state.end.value as Date;

    const api = useApi();
    const { user } = useRequiredAuth();

    const cache = useCache();
    const request = useRequest();

    const editor = useEventEditor(defaultStart, defaultEnd, originalEvent?.event as Event);

    const onSubmit = async () => {
        const [event, errors] = editorValidators[editor.type](user, originalEvent, editor);
        editor.setErrors(errors);
        if (Object.entries(errors).length > 0 || !event) {
            return;
        }

        request.onStart();
        try {
            scheduler.loading(true);
            const response = await api.setEvent(event);
            const newEvent = response.data;

            trackEvent(AnalyticsEventType.SetAvailability, {
                availability_id: newEvent.id,
                type: newEvent.type,
                title: newEvent.title,
                availability_types: newEvent.types,
                availability_cohorts: newEvent.cohorts,
                max_participants: newEvent.maxParticipants,
            });
            cache.events.put(newEvent);
            request.onSuccess();
            scheduler.close();
        } catch (err) {
            console.error(err);
            request.onFailure(err);
        } finally {
            scheduler.loading(false);
        }
    };

    return (
        <Dialog data-cy='event-editor' fullScreen open={true} TransitionComponent={Transition}>
            <RequestSnackbar request={request} />

            <AppBar sx={{ position: 'relative' }}>
                <Toolbar>
                    <Typography
                        data-cy='event-editor-title'
                        sx={{ ml: 2, flex: 1 }}
                        variant='h6'
                        component='div'
                    >
                        <Icon
                            name='avilb'
                            color='primary'
                            sx={{ marginRight: '0.8rem', verticalAlign: 'middle' }}
                        />
                        Edit Event
                    </Typography>
                    <Button
                        data-cy='cancel-button'
                        color='error'
                        onClick={() => scheduler.close()}
                        disabled={request.isLoading()}
                        startIcon={<Icon name='cancel' />}
                    >
                        Cancel
                    </Button>
                    <LoadingButton
                        data-cy='save-button'
                        color='success'
                        loading={request.isLoading()}
                        onClick={() => {
                            void onSubmit();
                        }}
                        startIcon={<Icon name='save' />}
                    >
                        Save
                    </LoadingButton>
                </Toolbar>
            </AppBar>

            <DialogTitle data-cy='event-editor-date'>
                {defaultStart.toLocaleDateString(undefined, {
                    weekday: 'long',
                    month: 'short',
                    day: 'numeric',
                })}
            </DialogTitle>

            <DialogContent>
                <Stack
                    spacing={4}
                    sx={{
                        mt: 4,
                    }}
                >
                    {(user.isAdmin || user.isCalendarAdmin || user.isCoach) && (
                        <Stack>
                            <Typography variant='h6'>
                                <Icon
                                    name='avilb'
                                    color='primary'
                                    sx={{
                                        marginRight: '0.4rem',
                                        verticalAlign: 'middle',
                                    }}
                                />{' '}
                                Event Type
                            </Typography>
                            <FormControl>
                                <RadioGroup
                                    value={editor.type}
                                    onChange={(e) =>
                                        editor.setType(e.target.value as EditableEventType)
                                    }
                                >
                                    <FormControlLabel
                                        value={EventType.Availability}
                                        control={<Radio />}
                                        label='Bookable Availability'
                                    />
                                    {(user.isAdmin || user.isCalendarAdmin) && (
                                        <FormControlLabel
                                            value={EventType.Dojo}
                                            control={<Radio />}
                                            label='Dojo-Wide Event'
                                        />
                                    )}
                                    {user.isCoach && (
                                        <FormControlLabel
                                            value={EventType.Coaching}
                                            control={<Radio />}
                                            label='Coaching Session'
                                        />
                                    )}
                                    {user.isAdmin && (
                                        <>
                                            <FormControlLabel
                                                value={EventType.LectureTier}
                                                control={<Radio />}
                                                label='Lecture'
                                            />
                                            <FormControlLabel
                                                value={EventType.GameReviewTier}
                                                control={<Radio />}
                                                label='Game & Profile Review'
                                            />
                                        </>
                                    )}
                                </RadioGroup>
                            </FormControl>
                        </Stack>
                    )}

                    {formConfigs[editor.type].map((config, i) => {
                        switch (config.type) {
                            case 'title':
                                return (
                                    <TitleFormSection
                                        key={i}
                                        label={config.label}
                                        title={editor.title}
                                        setTitle={editor.setTitle}
                                        error={editor.errors.title}
                                    />
                                );
                            case 'times':
                                return (
                                    <TimesFormSection
                                        key={i}
                                        enableRecurrence={config.enableRecurrence}
                                        description={config.description}
                                        start={editor.start}
                                        setStart={editor.setStart}
                                        startError={editor.errors.start}
                                        end={editor.end}
                                        setEnd={editor.setEnd}
                                        endError={editor.errors.end}
                                        minEnd={config.getMinEnd(editor.start)}
                                        rruleOptions={editor.rruleOptions}
                                        setRRuleOptions={editor.setRRuleOptions}
                                        countError={editor.errors.count}
                                    />
                                );
                            case 'location':
                                return (
                                    <LocationFormSection
                                        key={i}
                                        location={editor.location}
                                        setLocation={editor.setLocation}
                                        helperText={config.helperText}
                                        subtitle={config.subtitle}
                                    />
                                );
                            case 'description':
                                return (
                                    <DescriptionFormSection
                                        key={i}
                                        subtitle={config.subtitle ?? ''}
                                        description={editor.description}
                                        setDescription={editor.setDescription}
                                        error={editor.errors.description}
                                    />
                                );
                            case 'maxParticipants':
                                return (
                                    <MaxParticipantsFormSection
                                        key={i}
                                        maxParticipants={editor.maxParticipants}
                                        setMaxParticipants={editor.setMaxParticipants}
                                        subtitle={config.subtitle}
                                        helperText={
                                            config.getHelperText?.(editor) ?? config.helperText
                                        }
                                        error={editor.errors.maxParticipants}
                                    />
                                );
                            case 'invite':
                                return (
                                    <InviteFormSection key={i} owner={user.username} {...editor} />
                                );
                            case 'cohorts':
                                return editor.inviteOnly ? null : (
                                    <CohortsFormSection
                                        key={i}
                                        description={config.description}
                                        allCohorts={editor.allCohorts}
                                        setAllCohorts={editor.setAllCohorts}
                                        cohorts={editor.cohorts}
                                        setCohort={editor.setCohort}
                                        error={editor.errors.cohorts}
                                    />
                                );
                            case 'pricing':
                                return (
                                    <PricingFormSection
                                        key={i}
                                        editor={editor}
                                        fullPriceOpts={config.fullPriceOpts}
                                        currentPriceOpts={config.currentPriceOpts}
                                    />
                                );
                            case 'custom':
                                return <config.element key={i} editor={editor} />;
                        }
                    })}
                </Stack>
            </DialogContent>
        </Dialog>
    );
};

export default EventEditor;

interface TimesFormConfig {
    type: 'times';
    enableRecurrence?: boolean;
    description?: string;
    getMinEnd: (start: DateTime<boolean> | null) => DateTime<boolean> | null;
}

interface TitleFormConfig {
    type: 'title';
    label?: string;
    subtitle?: string;
}

interface LocationFormConfig {
    type: 'location';
    subtitle: string;
    helperText?: string;
}

interface DescriptionFormConfig {
    type: 'description';
    subtitle?: string;
}

interface MaxParticipantsFormConfig {
    type: 'maxParticipants';
    subtitle: string;
    helperText?: string;
    getHelperText?: (editor: UseEventEditorResponse) => string;
}

interface InviteFormConfig {
    type: 'invite';
}

interface CohortsFormConfig {
    type: 'cohorts';
    description: string;
}

interface PricingFormConfig {
    type: 'pricing';
    fullPriceOpts?: { helperText?: string };
    currentPriceOpts?: { helperText?: string };
}

interface CustomFormConfig {
    type: 'custom';
    element: (props: { editor: UseEventEditorResponse }) => JSX.Element;
}

type FormConfig =
    | TimesFormConfig
    | TitleFormConfig
    | LocationFormConfig
    | DescriptionFormConfig
    | MaxParticipantsFormConfig
    | InviteFormConfig
    | CohortsFormConfig
    | PricingFormConfig
    | CustomFormConfig;

const classConfig: FormConfig[] = [
    { type: 'times', enableRecurrence: true, getMinEnd: () => null },
    { type: 'title' },
    {
        type: 'description',
        subtitle:
            'This description will be visible in the calendar and should describe what your class will cover.',
    },
    {
        type: 'location',
        subtitle:
            'Add a Zoom link, specify a Discord classroom, etc. This is how your students will access your lesson and will only be visible after they pay.',
    },
    {
        type: 'cohorts',
        description:
            'Choose the cohorts that can see this event. If no cohorts are selected, all cohorts will be able to view the event.',
    },
];

const formConfigs: Record<EditableEventType, FormConfig[]> = {
    [EventType.Availability]: [
        { type: 'times', description: 'Availabilities must be at least one hour long', getMinEnd },
        { type: 'title', label: 'Title (Optional)' },
        {
            type: 'location',
            subtitle: 'Add a Zoom link, specify a Discord classroom, etc.',
            helperText: `Defaults to "Discord" if left blank.`,
        },
        {
            type: 'description',
            subtitle: 'Add a sparring position or any other notes for your opponent.',
        },
        {
            type: 'custom',
            element({ editor }) {
                const { AllTypes, ...AvailabilityTypes } = AvailabilityType;

                const {
                    allAvailabilityTypes,
                    setAllAvailabilityTypes,
                    availabilityTypes,
                    setAvailabilityType,
                } = editor;

                const selectedTypes = allAvailabilityTypes
                    ? [AllTypes]
                    : Object.keys(availabilityTypes).filter(
                          (t) => availabilityTypes[t as AvailabilityType],
                      );

                const onChangeType = (newTypes: string[]) => {
                    const addedTypes = newTypes.filter((t) => !selectedTypes.includes(t));
                    if (addedTypes.includes(AllTypes)) {
                        setAllAvailabilityTypes(true);
                        Object.values(AvailabilityTypes).forEach((t) =>
                            setAvailabilityType(t, false),
                        );
                    } else {
                        setAllAvailabilityTypes(false);
                        Object.values(AvailabilityTypes).forEach((t) =>
                            setAvailabilityType(t, false),
                        );
                        newTypes.forEach((t) => {
                            if (t !== AllTypes) {
                                setAvailabilityType(t as AvailabilityType, true);
                            }
                        });
                    }
                };

                return (
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
                            error={Boolean(editor.errors.types)}
                            helperText={editor.errors.types}
                            data-cy='availability-type-selector'
                        />
                    </Stack>
                );
            },
        },
        {
            type: 'maxParticipants',
            subtitle:
                'The number of people that can book your availability (not including yourself).',
            getHelperText: (editor) => {
                let defaultMaxParticipants = 1;
                if (editor.allAvailabilityTypes) {
                    defaultMaxParticipants = 100;
                } else {
                    Object.entries(editor.availabilityTypes).forEach(([type, enabled]) => {
                        if (enabled) {
                            defaultMaxParticipants = Math.max(
                                defaultMaxParticipants,
                                getDefaultNumberOfParticipants(type as AvailabilityType),
                            );
                        }
                    });
                }
                return `Defaults to ${defaultMaxParticipants} if left blank.`;
            },
        },
        { type: 'invite' },
        { type: 'cohorts', description: 'Choose the cohorts that can book your availability.' },
    ],
    [EventType.Dojo]: [
        { type: 'times', enableRecurrence: true, getMinEnd: () => null },
        { type: 'title' },
        { type: 'description' },
        {
            type: 'location',
            subtitle: 'Add a Zoom link, specify a Discord classroom, etc.',
            helperText: `Defaults to "No Location Provided" if left blank.`,
        },
        {
            type: 'cohorts',
            description:
                'Choose the cohorts that can see this event. If no cohorts are selected, all cohorts will be able to view the event.',
        },
    ],
    [EventType.Coaching]: [
        { type: 'times', enableRecurrence: true, getMinEnd: () => null },
        { type: 'title' },
        {
            type: 'description',
            subtitle:
                'This description will be visible in the calendar and should describe what your coaching session will cover.',
        },
        {
            type: 'location',
            subtitle:
                'Add a Zoom link, specify a Discord classroom, etc. This is how your students will access your lesson and will only be visible after they pay.',
        },
        {
            type: 'maxParticipants',
            subtitle: 'The maximum number of students that can book your coaching session.',
        },
        {
            type: 'cohorts',
            description:
                'Choose the cohorts that can see this event. If no cohorts are selected, all cohorts will be able to view the event.',
        },
        { type: 'pricing' },
    ],
    [EventType.LectureTier]: classConfig,
    [EventType.GameReviewTier]: classConfig,
};
