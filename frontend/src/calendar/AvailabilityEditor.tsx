import { SchedulerHelpers } from '@aldabil/react-scheduler/types';
import {
    DialogTitle,
    DialogContent,
    Stack,
    TextField,
    DialogContentText,
    DialogActions,
    Button,
    FormControlLabel,
    Checkbox,
    FormHelperText,
    FormControl,
    Typography,
} from '@mui/material';
import LoadingButton from '@mui/lab/LoadingButton';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { useEffect, useState } from 'react';

import { useApi } from '../api/Api';
import {
    Availability,
    AvailabilityType,
    getDisplayString,
} from '../database/availability';
import { RequestSnackbar, RequestStatus, useRequest } from '../api/Request';
import { useAuth } from '../auth/Auth';
import { dojoCohorts } from '../database/user';

interface AvailabilityEditorProps {
    scheduler: SchedulerHelpers;
    onConfirm: (availability: Availability) => void;
}

const ONE_HOUR = 60 * 60 * 1000;

function isValidDate(d: any) {
    return d instanceof Date && !isNaN(d.getTime());
}

const AvailabilityEditor: React.FC<AvailabilityEditorProps> = ({
    scheduler,
    onConfirm,
}) => {
    const originalEvent = scheduler.edited;
    const defaultStart = scheduler.state.start.value as Date;
    const defaultEnd = scheduler.state.end.value as Date;

    const api = useApi();
    const user = useAuth().user!;

    const request = useRequest();
    const [start, setStart] = useState<Date | null>(defaultStart || null);
    const [end, setEnd] = useState<Date | null>(defaultEnd || null);

    const [allTypes, setAllTypes] = useState(false);
    const [types, setTypes] = useState<Record<AvailabilityType, boolean>>(
        Object.values(AvailabilityType).reduce((map, type) => {
            map[type] = false;
            return map;
        }, {} as Record<AvailabilityType, boolean>)
    );

    const [allCohorts, setAllCohorts] = useState(false);
    const [cohorts, setCohorts] = useState<Record<string, boolean>>(
        dojoCohorts.reduce((map, cohort) => {
            map[cohort] = cohort === user.dojoCohort;
            return map;
        }, {} as Record<string, boolean>)
    );

    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        const originalTypes: AvailabilityType[] = originalEvent?.availability?.types;
        if (originalTypes) {
            setTypes((t) =>
                originalTypes.reduce((map, type) => {
                    map[type] = true;
                    return map;
                }, Object.assign({}, t))
            );
        }

        const originalCohorts: string[] = originalEvent?.availability?.cohorts;
        if (originalCohorts) {
            setCohorts((c) =>
                originalCohorts.reduce((map, cohort) => {
                    map[cohort] = true;
                    return map;
                }, Object.assign({}, c))
            );
        }
    }, [originalEvent, setTypes, setCohorts]);

    const onChangeType = (type: AvailabilityType, value: boolean) => {
        setTypes({
            ...types,
            [type]: value,
        });
    };

    const onChangeCohort = (cohort: string, value: boolean) => {
        setCohorts({
            ...cohorts,
            [cohort]: value,
        });
    };

    let minEnd = null;
    if (start !== null) {
        minEnd = new Date();
        minEnd.setTime(start.getTime() + ONE_HOUR);
    }

    const onSubmit = async () => {
        const errors: Record<string, string> = {};

        if (start === null) {
            errors.start = 'This field is required';
        } else if (!isValidDate(start)) {
            errors.start = 'Start time must be a valid time';
        }
        if (end === null) {
            errors.end = 'This field is required';
        } else if (!isValidDate(end)) {
            errors.end = 'End time must be a valid time';
        }

        const selectedTypes: AvailabilityType[] = allTypes
            ? Object.values(AvailabilityType)
            : (Object.keys(types).filter(
                  (t) => types[t as AvailabilityType]
              ) as AvailabilityType[]);
        if (selectedTypes.length === 0) {
            errors.types = 'At least one type is required';
        }

        const selectedCohorts = allCohorts
            ? dojoCohorts
            : Object.keys(cohorts).filter((c) => cohorts[c]);
        if (selectedCohorts.length === 0) {
            errors.cohorts = 'At least one cohort is required';
        }

        setErrors(errors);
        if (Object.entries(errors).length > 0) {
            return;
        }

        request.onStart();
        const startIso = start!.toISOString();
        const endIso = end!.toISOString();

        try {
            scheduler.loading(true);

            const response = await api.setAvailability({
                ...(originalEvent?.availability ?? {}),
                owner: user.username,
                ownerCohort: user.dojoCohort,
                startTime: startIso,
                endTime: endIso,
                types: selectedTypes,
                cohorts: selectedCohorts,
            });
            console.log('Got setAvailability response: ', response);
            const availability = response.data;
            const event = {
                event_id: availability.id,
                title: 'Available',
                start: start!,
                end: end!,
                availability,
            };

            request.onSuccess();
            onConfirm(availability);
            scheduler.onConfirm(event, originalEvent ? 'edit' : 'create');
            scheduler.close();
        } catch (err) {
            console.error(err);
            request.onFailure(err);
        } finally {
            scheduler.loading(false);
        }
    };

    return (
        <>
            <RequestSnackbar request={request} />

            <DialogTitle>
                {defaultStart.toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'short',
                    day: 'numeric',
                })}
            </DialogTitle>

            <DialogContent>
                <DialogContentText>
                    Availabilities must be at least one hour long.
                </DialogContentText>
                <Stack
                    spacing={3}
                    sx={{
                        mt: 4,
                    }}
                >
                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                        <TimePicker
                            label='Start Time'
                            value={start}
                            onChange={(value) => {
                                console.log(value);
                                setStart(value);
                            }}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    fullWidth
                                    error={!!errors.start}
                                    helperText={errors.start}
                                />
                            )}
                        />

                        <TimePicker
                            label='End Time'
                            value={end}
                            onChange={(value) => setEnd(value)}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    fullWidth
                                    error={!!errors.end}
                                    helperText={errors.end}
                                />
                            )}
                            minTime={minEnd}
                        />
                    </LocalizationProvider>

                    <Stack>
                        <Typography variant='h6'>Availability Types</Typography>
                        <Typography variant='subtitle1' color='text.secondary'>
                            Choose the meeting types you are available for.
                        </Typography>
                        <FormControl error={!!errors.types}>
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={allTypes}
                                        onChange={(event) =>
                                            setAllTypes(event.target.checked)
                                        }
                                    />
                                }
                                label='All Types'
                            />
                            <Stack
                                direction='row'
                                sx={{ flexWrap: 'wrap', columnGap: 2.5 }}
                            >
                                {Object.values(AvailabilityType).map((type) => (
                                    <FormControlLabel
                                        key={type}
                                        control={
                                            <Checkbox
                                                checked={allTypes || types[type]}
                                                onChange={(event) =>
                                                    onChangeType(
                                                        type,
                                                        event.target.checked
                                                    )
                                                }
                                            />
                                        }
                                        disabled={allTypes}
                                        label={getDisplayString(type)}
                                    />
                                ))}
                            </Stack>
                            <FormHelperText>{errors.types}</FormHelperText>
                        </FormControl>
                    </Stack>

                    <Stack>
                        <Typography variant='h6'>Cohorts</Typography>
                        <Typography variant='subtitle1' color='text.secondary'>
                            Choose the cohorts that can book your availability.
                        </Typography>
                        <FormControl error={!!errors.cohorts}>
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={allCohorts}
                                        onChange={(event) =>
                                            setAllCohorts(event.target.checked)
                                        }
                                    />
                                }
                                label='All Cohorts'
                            />
                            <Stack
                                direction='row'
                                sx={{ flexWrap: 'wrap', columnGap: 2.5 }}
                            >
                                {dojoCohorts.map((cohort) => (
                                    <FormControlLabel
                                        key={cohort}
                                        control={
                                            <Checkbox
                                                checked={allCohorts || cohorts[cohort]}
                                                onChange={(event) =>
                                                    onChangeCohort(
                                                        cohort,
                                                        event.target.checked
                                                    )
                                                }
                                            />
                                        }
                                        disabled={allCohorts}
                                        label={cohort}
                                    />
                                ))}
                            </Stack>
                            <FormHelperText>{errors.cohorts}</FormHelperText>
                        </FormControl>
                    </Stack>
                </Stack>
            </DialogContent>
            <DialogActions>
                <Button
                    disabled={request.status === RequestStatus.Loading}
                    onClick={scheduler.close}
                >
                    Cancel
                </Button>
                <LoadingButton
                    loading={request.status === RequestStatus.Loading}
                    onClick={onSubmit}
                >
                    Save
                </LoadingButton>
            </DialogActions>
        </>
    );
};

export default AvailabilityEditor;
