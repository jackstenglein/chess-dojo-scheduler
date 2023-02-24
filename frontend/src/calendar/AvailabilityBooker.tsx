import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
    TextField,
    Slide,
    Container,
    CircularProgress,
    Snackbar,
    Alert,
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { TransitionProps } from '@mui/material/transitions';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, TimePicker } from '@mui/x-date-pickers';

import { useApi } from '../api/Api';
import { useCache } from '../api/Cache';
import { RequestSnackbar, RequestStatus, useRequest } from '../api/Request';
import {
    Availability,
    AvailabilityType,
    getDisplayString,
} from '../database/availability';
import { Meeting } from '../database/meeting';

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

    const availability = cache.getAvailability(id!);

    useEffect(() => {
        if (availability) {
            setStartTime(new Date(availability.startTime));
        }
    }, [availability, setStartTime]);

    console.log('Availability: ', availability);

    if (!availability) {
        if (cache.isLoading) {
            return (
                <Container sx={{ pt: 6, pb: 4 }}>
                    <CircularProgress />
                </Container>
            );
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
        api.bookAvailability(availability, startTime!, selectedType!)
            .then((response) => {
                console.log('Book response: ', response);
                request.onSuccess();
                cache.putMeeting(response.data as Meeting);
                cache.removeAvailability(availability.id);
                navigate(`/meeting/${response.data.id}`);
            })
            .catch((err) => {
                console.error(err);
                request.onFailure(err);
            });
    };

    const confirmGroupBooking = () => {
        request.onStart();
        api.bookAvailability(availability)
            .then((response) => {
                console.log('Book response: ', response);
                request.onSuccess();
                cache.putAvailability(response.data as Availability);
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
                        <Typography variant='body1'>
                            {availability.ownerDiscord} ({availability.ownerCohort})
                        </Typography>
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
                                    <Typography variant='body1'>
                                        {p.discord} ({p.cohort})
                                    </Typography>
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
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            fullWidth
                                            error={!!errors.time}
                                            helperText={
                                                errors.time ||
                                                `Must be between ${minStartTime.toLocaleTimeString()} and ${maxStartTime.toLocaleTimeString()}`
                                            }
                                        />
                                    )}
                                    minTime={availability.startTime}
                                    maxTime={availability.endTime}
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
