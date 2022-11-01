import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Stack,
    Typography,
    Button,
    Slide,
    Dialog,
    AppBar,
    Toolbar,
    DialogContent,
    FormControl,
    FormLabel,
    RadioGroup,
    FormControlLabel,
    Radio,
    TextField,
    FormHelperText,
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { TransitionProps } from '@mui/material/transitions';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { ProcessedEvent } from '@aldabil/react-scheduler/types';

import {
    Availability,
    AvailabilityType,
    getDisplayString,
} from '../database/availability';
import { useApi } from '../api/Api';
import { RequestSnackbar, RequestStatus, useRequest } from '../api/Request';

const Transition = React.forwardRef(function Transition(
    props: TransitionProps & {
        children: React.ReactElement;
    },
    ref: React.Ref<unknown>
) {
    return <Slide direction='up' ref={ref} {...props} />;
});

interface AvailabilityViewerProps {
    event: ProcessedEvent;
}

const AvailabilityViewer: React.FC<AvailabilityViewerProps> = ({ event }) => {
    const availability: Availability = event.availability;
    const minStartTime = new Date(availability.startTime);
    const maxStartTime = new Date(availability.endTime);

    const api = useApi();
    const request = useRequest();
    const navigate = useNavigate();

    const [isBooking, setIsBooking] = useState(false);
    const [selectedType, setSelectedType] = useState<AvailabilityType | null>(null);
    const [startTime, setStartTime] = useState<Date | null>(minStartTime);
    const [errors, setErrors] = useState<Record<string, string>>({});

    if (event.isOwner) {
        return null!;
    }

    const startBooking = () => {
        setIsBooking(true);
    };

    const stopBooking = () => {
        setIsBooking(false);
    };

    const confirmBooking = () => {
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
                navigate(`/meeting/${response.data.id}`);
            })
            .catch((err) => {
                console.error(err);
                request.onFailure(err);
            });
    };

    return (
        <>
            <Stack sx={{ pt: 2 }} spacing={2}>
                <Stack>
                    <Typography variant='subtitle2' color='text.secondary'>
                        Owner Cohort
                    </Typography>
                    <Typography variant='body1'>{availability.ownerCohort}</Typography>
                </Stack>

                <Stack>
                    <Typography variant='subtitle2' color='text.secondary'>
                        Available Types
                    </Typography>
                    <Typography variant='body1'>
                        {availability.types
                            .map((t: AvailabilityType) => getDisplayString(t))
                            .join(', ')}
                    </Typography>
                </Stack>

                <Button variant='contained' onClick={startBooking}>
                    Book
                </Button>
            </Stack>

            <Dialog
                fullScreen
                open={isBooking}
                onClose={stopBooking}
                TransitionComponent={Transition}
            >
                <RequestSnackbar request={request} />

                <AppBar sx={{ position: 'relative' }}>
                    <Toolbar>
                        <Typography sx={{ ml: 2, flex: 1 }} variant='h6' component='div'>
                            Book Meeting
                        </Typography>
                        <Button
                            color='inherit'
                            onClick={stopBooking}
                            disabled={request.status === RequestStatus.Loading}
                        >
                            Cancel
                        </Button>
                        <LoadingButton
                            color='inherit'
                            loading={request.status === RequestStatus.Loading}
                            onClick={confirmBooking}
                        >
                            Book
                        </LoadingButton>
                    </Toolbar>
                </AppBar>
                <DialogContent>
                    <Stack sx={{ pt: 2 }} spacing={3}>
                        <Stack>
                            <Typography variant='subtitle2' color='text.secondary'>
                                Available Start Times
                            </Typography>
                            <Typography variant='body1'>
                                {minStartTime.toLocaleDateString()}{' '}
                                {minStartTime.toLocaleTimeString()} -{' '}
                                {maxStartTime.toLocaleTimeString()}
                            </Typography>
                        </Stack>

                        <Stack>
                            <Typography variant='subtitle2' color='text.secondary'>
                                Owner Cohort
                            </Typography>
                            <Typography variant='body1'>
                                {availability.ownerCohort}
                            </Typography>
                        </Stack>

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
                    </Stack>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default AvailabilityViewer;
