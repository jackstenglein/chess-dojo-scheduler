import { useAuth } from '@/auth/Auth';
import { Event, EventStatus } from '@/database/event';
import { User, dojoCohorts } from '@/database/user';
import { ProcessedEvent } from '@aldabil/react-scheduler/types';
import {
    Alert,
    Button,
    Checkbox,
    FormControlLabel,
    InputAdornment,
    Stack,
    TextField,
    Typography,
} from '@mui/material';
import NextLink from 'next/link';
import { getTimeZonedDate } from '../displayDate';
import CohortsFormSection from './form/CohortsFormSection';
import DescriptionFormSection from './form/DescriptionFormSection';
import LocationFormSection from './form/LocationFormSection';
import MaxParticipantsFormSection from './form/MaxParticipantsFormSection';
import TimesFormSection from './form/TimesFormSection';
import TitleFormSection from './form/TitleFormSection';
import { UseEventEditorResponse } from './useEventEditor';

function validatePrice(priceStr: string): [number, string] {
    const price = 100 * parseFloat(priceStr.trim());
    if (isNaN(price)) {
        return [-1, 'You must specify a number'];
    }
    if (!Number.isInteger(price)) {
        return [-1, 'You must specify a valid dollar amount with up to 2 decimal places'];
    }
    if (price < 500) {
        return [-1, 'Price must be at least $5'];
    }
    return [price, ''];
}

export function validateCoachingEditor(
    user: User,
    originalEvent: ProcessedEvent | undefined,
    editor: UseEventEditorResponse,
): [Event | null, Record<string, string>] {
    const errors: Record<string, string> = {};

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

    if (!editor.title.trim()) {
        errors.title = 'This field is required';
    }

    if (!editor.description.trim()) {
        errors.description = 'This field is required';
    }

    if (!editor.location.trim()) {
        errors.location = 'This field is required';
    }

    let maxParticipants = -1;
    if (!editor.maxParticipants.trim()) {
        errors.maxParticipants = 'This field is required';
    } else {
        maxParticipants = parseFloat(editor.maxParticipants);
        if (
            isNaN(maxParticipants) ||
            !Number.isInteger(maxParticipants) ||
            maxParticipants < 1
        ) {
            errors.maxParticipants = 'You must specify an integer greater than 0';
        } else {
            maxParticipants = Math.round(maxParticipants);
        }
    }

    let fullPrice = -1;
    if (!editor.fullPrice.trim()) {
        errors.fullPrice = 'This field is required';
    } else {
        const [price, error] = validatePrice(editor.fullPrice);
        fullPrice = price;
        if (error) {
            errors.fullPrice = error;
        }
    }

    let currentPrice = -1;
    if (editor.currentPrice.trim()) {
        const [price, error] = validatePrice(editor.currentPrice);
        currentPrice = price;
        if (error) {
            errors.currentPrice = error;
        } else if (currentPrice >= fullPrice) {
            errors.currentPrice = 'This must be less than the full price';
        }
    }

    if (Object.entries(errors).length > 0) {
        return [null, errors];
    }
    if (!editor.start || !editor.end) {
        return [null, errors];
    }

    const selectedCohorts = editor.allCohorts
        ? dojoCohorts
        : dojoCohorts.filter((c) => editor.cohorts[c]);

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
            location: editor.location.trim(),
            description: editor.description.trim(),
            maxParticipants,
            coaching: {
                stripeId: user.coachInfo?.stripeId || '',
                fullPrice,
                currentPrice,
                bookableByFreeUsers: editor.bookableByFreeUsers,
                hideParticipants: editor.hideParticipants,
            },
        },
        errors,
    ];
}

interface CoachingEditorProps {
    editor: UseEventEditorResponse;
}

const CoachingEditor: React.FC<CoachingEditorProps> = ({ editor }) => {
    const { user } = useAuth();

    if (!user?.coachInfo?.onboardingComplete || !user.coachInfo.stripeId) {
        return (
            <Alert
                severity='error'
                variant='filled'
                action={
                    <Button
                        component={NextLink}
                        color='inherit'
                        size='small'
                        href='/coach'
                    >
                        Open Portal
                    </Button>
                }
            >
                Your coach account has missing or outdated information. You cannot create
                coaching sessions until you have updated your information in the coach
                portal.
            </Alert>
        );
    }

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
        allCohorts,
        setAllCohorts,
        cohorts,
        setCohort,
        fullPrice,
        setFullPrice,
        currentPrice,
        setCurrentPrice,
        bookableByFreeUsers,
        setBookableByFreeUsers,
        hideParticipants,
        setHideParticipants,
        rruleOptions,
        setRRuleOptions,
        errors,
    } = editor;

    const percentOff = Math.round(
        ((parseFloat(fullPrice) - parseFloat(currentPrice)) / parseFloat(fullPrice)) *
            100,
    );

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
                rruleOptions={rruleOptions}
                setRRuleOptions={setRRuleOptions}
            />

            <TitleFormSection title={title} setTitle={setTitle} error={errors.title} />

            <DescriptionFormSection
                required
                subtitle='This description will be visible in the calendar and should describe what your coaching session will cover.'
                description={description}
                setDescription={setDescription}
                error={errors.description}
            />

            <LocationFormSection
                required
                location={location}
                setLocation={setLocation}
                subtitle='Add a Zoom link, specify a Discord classroom, etc. This is how your students will access your lesson and will only be visible after they pay.'
                error={errors.location}
            />

            <MaxParticipantsFormSection
                maxParticipants={maxParticipants}
                setMaxParticipants={setMaxParticipants}
                subtitle='The maximum number of students that can book your coaching session.'
                error={errors.maxParticipants}
            />

            <Stack>
                <Typography variant='h6'>Hide Participants when Booking?</Typography>
                <FormControlLabel
                    control={
                        <Checkbox
                            checked={hideParticipants}
                            onChange={(e) => setHideParticipants(e.target.checked)}
                        />
                    }
                    label='Hide participant list when booking? If checked, users will only see other participants after they have booked.'
                />
            </Stack>

            <CohortsFormSection
                description='Choose the cohorts that can see and book this event. If no cohorts are selected, all cohorts will be able to book the event.'
                allCohorts={allCohorts}
                setAllCohorts={setAllCohorts}
                cohorts={cohorts}
                setCohort={setCohort}
                error={errors.cohorts}
            />

            <Stack>
                <Typography variant='h6'>Free-Tier Visibility</Typography>
                <FormControlLabel
                    control={
                        <Checkbox
                            checked={bookableByFreeUsers}
                            onChange={(e) => setBookableByFreeUsers(e.target.checked)}
                        />
                    }
                    label='Allow free-tier users to see and book this event'
                />
            </Stack>

            <Stack>
                <Typography variant='h6'>Pricing</Typography>
                <Stack spacing={3} mt={2} mb={6}>
                    <TextField
                        fullWidth
                        label='Full Price'
                        variant='outlined'
                        value={fullPrice}
                        onChange={(e) => setFullPrice(e.target.value)}
                        error={Boolean(errors.fullPrice)}
                        helperText={errors.fullPrice}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position='start'>$</InputAdornment>
                            ),
                        }}
                    />
                    <TextField
                        fullWidth
                        label='Sale Price'
                        variant='outlined'
                        value={currentPrice}
                        onChange={(e) => setCurrentPrice(e.target.value)}
                        error={Boolean(errors.currentPrice)}
                        helperText={
                            errors.currentPrice ||
                            'If you want your coaching session to display as being on sale, enter a sale price and it will be shown as a discount off the full price. If left blank, students must pay the full price.'
                        }
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position='start'>$</InputAdornment>
                            ),
                        }}
                    />

                    {fullPrice !== '' && currentPrice !== '' && !isNaN(percentOff) && (
                        <Typography>Percent Off: {percentOff}%</Typography>
                    )}
                </Stack>
            </Stack>
        </>
    );
};

export default CoachingEditor;
