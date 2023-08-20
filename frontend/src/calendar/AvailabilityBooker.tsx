import React, { useEffect, useState } from 'react';
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom';
import {
    Dialog,
    AppBar,
    Toolbar,
    Typography,
    Button,
    DialogContent,
    Stack,
    FormControl,
    FormLabel,
    RadioGroup,
    FormControlLabel,
    Radio,
    FormHelperText,
    Slide,
    Snackbar,
    Alert,
    Link,
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { TransitionProps } from '@mui/material/transitions';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, TimePicker } from '@mui/x-date-pickers';

import { useApi } from '../api/Api';
import { useCache } from '../api/cache/Cache';
import { RequestSnackbar, RequestStatus, useRequest } from '../api/Request';
import { AvailabilityType, getDisplayString } from '../database/event';
import GraduationIcon from '../scoreboard/GraduationIcon';
import LoadingPage from '../loading/LoadingPage';
import { EventType, trackEvent } from '../analytics/events';

const Transition = React.forwardRef(function Transition(
    props: TransitionProps & {
        children: React.ReactElement;
    },
    ref: React.Ref<unknown>
) {
    return <Slide direction='up' ref={ref} {...props} />;
});

type AvailabilityBookerProps = {
    id: string;
};

const AvailabilityBooker = () => {
    const { id } = useParams<AvailabilityBookerProps>();

    const request = useRequest();
    const api = useApi();
    const navigate = useNavigate();
    const cache = useCache();

    const [selectedType, setSelectedType] = useState<AvailabilityType | null>(null);
    const [startTime, setStartTime] = useState<Date | null>(null);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const availability = cache.events.get(id!);

    useEffect(() => {
        if (availability) {
            setStartTime(new Date(availability.startTime));
        }
    }, [availability, setStartTime]);

    console.log('Availability: ', availability);

    if (!availability) {
        if (cache.isLoading) {
            return <LoadingPage />;
        }

        return (
            <Snackbar
                open
                autoHideDuration={6000}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert
                    variant='filled'
                    severity='error'
                    sx={{ width: '100%' }}
                    onClose={() => navigate('/calendar')}
                >
                    This availability cannot be found. It is either fully booked, deleted
                    by the owner or not available to your cohort.
                </Alert>
            </Snackbar>
        );
    }

    const isGroup = availability.maxParticipants > 1;
    const minStartTime = new Date(availability.startTime);
    const maxStartTime = new Date(availability.endTime);

    const confirmSoloBooking = () => {
        const newErrors: Record<string, string> = {};

        if (selectedType === null) {
            newErrors.type = 'You must select a meeting type';
        }

        if (startTime === null) {
            newErrors.time = 'You must select a time';
        } else {
            const selectedTime = startTime!.toISOString();
            if (
                selectedTime < availability.startTime ||
                selectedTime > availability.endTime
            ) {
                newErrors.time = `Must be between ${minStartTime.toLocaleTimeString()} and ${maxStartTime.toLocaleTimeString()}`;
            }
        }

        setErrors(newErrors);
        if (Object.entries(errors).length > 0) {
            return;
        }

        console.log('Booking availability: ', availability);
        request.onStart();
        api.bookEvent(availability.id, startTime!, selectedType!)
            .then((response) => {
                console.log('Book response: ', response);
                trackEvent(EventType.BookAvailability, {
                    availability_id: availability.id,
                    is_group: false,
                    selected_type: selectedType,
                    availability_types: availability.types,
                    availability_cohorts: availability.cohorts,
                });
                request.onSuccess();
                cache.events.put(response.data);
                navigate(`/meeting/${response.data.id}`);
            })
            .catch((err) => {
                console.error(err);
                request.onFailure(err);
            });
    };

    const confirmGroupBooking = () => {
        request.onStart();
        api.bookEvent(availability.id)
            .then((response) => {
                console.log('Book response: ', response);
                trackEvent(EventType.BookAvailability, {
                    availability_id: availability.id,
                    is_group: true,
                    availability_types: availability.types,
                    availability_cohorts: availability.cohorts,
                    max_participants: availability.maxParticipants,
                });
                request.onSuccess();
                cache.events.put(response.data);
                navigate(`/group/${response.data.id}`);
            })
            .catch((err) => {
                console.error(err);
                request.onFailure(err);
            });
    };

    const confirmBooking = () => {
        if (isGroup) {
            return confirmGroupBooking();
        }
        confirmSoloBooking();
    };

    return (
        <Dialog fullScreen open={true} TransitionComponent={Transition}>
            <RequestSnackbar request={request} />

            <AppBar sx={{ position: 'relative' }}>
                <Toolbar>
                    <Typography sx={{ ml: 2, flex: 1 }} variant='h6' component='div'>
                        {isGroup ? 'Join Group Meeting' : 'Book Meeting'}
                    </Typography>
                    <Button
                        color='inherit'
                        onClick={() => navigate('/calendar')}
                        disabled={request.status === RequestStatus.Loading}
                    >
                        Cancel
                    </Button>
                    <LoadingButton
                        color='inherit'
                        loading={request.status === RequestStatus.Loading}
                        onClick={confirmBooking}
                    >
                        {isGroup ? 'Join' : 'Book'}
                    </LoadingButton>
                </Toolbar>
            </AppBar>
            <DialogContent>
                <Stack sx={{ pt: 2 }} spacing={3}>
                    <Stack>
                        <Typography variant='subtitle2' color='text.secondary'>
                            {isGroup ? 'Time' : 'Available Start Times'}
                        </Typography>
                        <Typography variant='body1'>
                            {minStartTime.toLocaleDateString()}{' '}
                            {minStartTime.toLocaleTimeString()} -{' '}
                            {maxStartTime.toLocaleTimeString()}
                        </Typography>
                    </Stack>

                    <Stack>
                        <Typography variant='subtitle2' color='text.secondary'>
                            Owner
                        </Typography>
                        <Stack direction='row' spacing={2} alignItems='center'>
                            <Link
                                component={RouterLink}
                                to={`/profile/${availability.owner}`}
                            >
                                <Typography variant='body1'>
                                    {availability.ownerDisplayName} (
                                    {availability.ownerCohort})
                                </Typography>
                            </Link>
                            <GraduationIcon
                                cohort={availability.ownerPreviousCohort}
                                size={25}
                            />
                        </Stack>
                    </Stack>

                    <Stack>
                        <Typography variant='subtitle2' color='text.secondary'>
                            Location
                        </Typography>
                        <Typography variant='body1'>
                            {availability.location || 'Discord'}
                        </Typography>
                    </Stack>

                    {availability.description && (
                        <Stack>
                            <Typography variant='subtitle2' color='text.secondary'>
                                Description
                            </Typography>
                            <Typography
                                variant='body1'
                                style={{ whiteSpace: 'pre-line' }}
                            >
                                {availability.description}
                            </Typography>
                        </Stack>
                    )}

                    {isGroup && (
                        <>
                            <Stack>
                                <Typography variant='subtitle2' color='text.secondary'>
                                    Meeting Types
                                </Typography>
                                <Typography variant='body1'>
                                    {availability.types
                                        .map((t) => getDisplayString(t))
                                        .join(', ')}
                                </Typography>
                            </Stack>

                            <Stack>
                                <Typography variant='subtitle2' color='text.secondary'>
                                    Cohorts
                                </Typography>
                                <Typography variant='body1'>
                                    {availability.cohorts.join(', ')}
                                </Typography>
                            </Stack>

                            <Stack>
                                <Typography variant='subtitle2' color='text.secondary'>
                                    Max Participants
                                </Typography>
                                <Typography variant='body1'>
                                    {availability.maxParticipants}
                                </Typography>
                            </Stack>

                            <Stack>
                                <Typography variant='subtitle2' color='text.secondary'>
                                    Current Participants
                                </Typography>

                                {(!availability.participants ||
                                    availability.participants?.length === 0) && (
                                    <Typography variant='body1'>None</Typography>
                                )}

                                {availability.participants?.map((p) => (
                                    <Stack
                                        key={p.username}
                                        direction='row'
                                        spacing={2}
                                        alignItems='center'
                                    >
                                        <Link
                                            key={p.username}
                                            component={RouterLink}
                                            to={`/profile/${p.username}`}
                                        >
                                            <Typography variant='body1'>
                                                {p.displayName} ({p.cohort})
                                            </Typography>
                                        </Link>
                                        <GraduationIcon
                                            cohort={p.previousCohort}
                                            size={25}
                                        />
                                    </Stack>
                                ))}
                            </Stack>
                        </>
                    )}

                    {!isGroup && (
                        <>
                            <FormControl error={!!errors.type}>
                                <FormLabel>Meeting Type</FormLabel>
                                <RadioGroup
                                    name='radio-buttons-group'
                                    value={selectedType}
                                    onChange={(event) =>
                                        setSelectedType(
                                            event.target.value as AvailabilityType
                                        )
                                    }
                                >
                                    {availability.types.map((t) => (
                                        <FormControlLabel
                                            key={t}
                                            control={<Radio />}
                                            value={t}
                                            label={getDisplayString(t)}
                                        />
                                    ))}
                                </RadioGroup>
                                <FormHelperText>{errors.type}</FormHelperText>
                            </FormControl>

                            <LocalizationProvider dateAdapter={AdapterDateFns}>
                                <TimePicker
                                    label='Start Time'
                                    value={startTime}
                                    onChange={(value) =>
                                        setStartTime(value as unknown as Date)
                                    }
                                    slotProps={{
                                        textField: {
                                            fullWidth: true,
                                            error: !!errors.time,
                                            helperText:
                                                errors.time ||
                                                `Must be between ${minStartTime.toLocaleTimeString()} and ${maxStartTime.toLocaleTimeString()}`,
                                        },
                                    }}
                                    minTime={new Date(availability.startTime)}
                                    maxTime={new Date(availability.endTime)}
                                />
                            </LocalizationProvider>
                        </>
                    )}
                </Stack>
            </DialogContent>
        </Dialog>
    );
};

export default AvailabilityBooker;
