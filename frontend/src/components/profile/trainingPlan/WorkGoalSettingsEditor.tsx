import { useApi } from '@/api/Api';
import { RequestSnackbar, useRequest } from '@/api/Request';
import { WorkGoalSettings } from '@/database/user';
import { WeekDays } from '@aldabil/react-scheduler/views/Month';
import { Help, Settings } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import {
    Button,
    ButtonBase,
    Dialog,
    DialogActions,
    DialogContent,
    FormLabel,
    Grid2,
    InputAdornment,
    MenuItem,
    Stack,
    TextField,
    Tooltip,
    Typography,
} from '@mui/material';
import { Fragment, useState } from 'react';
import { useLocalStorage } from 'usehooks-ts';
import { TrainingPlanView } from './TrainingPlanViewSelect';

const NUMBER_REGEX = /^[0-9]*$/;

const DAY_NAMES = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
] as const;

/** The default work goal settings if the user has not saved any. */
export const DEFAULT_WORK_GOAL: WorkGoalSettings = {
    minutesPerDay: DAY_NAMES.map(() => 60),
    minutesPerTask: 30,
} as const;

/** Renders an editor that allows the user to update their work goal settings. */
export function WorkGoalSettingsEditor({
    initialWeekStart,
    workGoal = DEFAULT_WORK_GOAL,
    disabled,
    view,
}: {
    /** The initial day the week starts on. */
    initialWeekStart?: WeekDays;
    /** The initial work goal settings. If undefined, the default settings will be used. */
    workGoal?: WorkGoalSettings;
    /** Whether the editor is disabled. */
    disabled: boolean;
    /** Whether to display the goal on the dialog trigger in daily or weekly terms. */
    view: TrainingPlanView.Daily | TrainingPlanView.Weekly;
}) {
    const [open, setOpen] = useState(false);
    const api = useApi();
    const request = useRequest();

    const [originalWeekStart, setOriginalWeekStart] = useLocalStorage<WeekDays>(
        'calendarFilters.weekStartOn',
        0,
    );

    const [weekStart, setWeekStart] = useState(initialWeekStart || originalWeekStart);
    const minTime = useTimeEditor(workGoal.minutesPerTask);
    const timePerDay = workGoal.minutesPerDay.map((minutes) => useTimeEditor(minutes));
    const minutesPerWeek = timePerDay.reduce((sum, t) => sum + t.total, 0);

    const onSave = async () => {
        let error = false;
        for (const timeEditor of timePerDay.concat(minTime)) {
            const newErrors: Record<string, string> = {};
            if (!NUMBER_REGEX.test(timeEditor.hours)) {
                newErrors.hours = 'Must be numeric';
            }
            if (!NUMBER_REGEX.test(timeEditor.minutes)) {
                newErrors.minutes = 'Must be numeric';
            }
            timeEditor.setErrors(newErrors);
            error = error || Object.keys(newErrors).length > 0;
        }

        if (error) {
            return;
        }

        try {
            request.onStart();
            await api.updateUser({
                weekStart,
                workGoal: {
                    minutesPerTask: minTime.total,
                    minutesPerDay: timePerDay.map((t) => t.total),
                },
            });
            setOriginalWeekStart(weekStart);
            request.onSuccess();
            setOpen(false);
        } catch (err) {
            request.onFailure(err);
        }
    };

    return (
        <>
            <ButtonBase
                focusRipple
                component='div'
                onClick={() => setOpen(true)}
                sx={{ width: 1 }}
                disabled={disabled}
            >
                <TextField
                    disabled={disabled}
                    select
                    label='Work Goal'
                    value='placeholder'
                    fullWidth
                    slotProps={{
                        select: {
                            open: false,
                            renderValue: () => getLabel(view, workGoal),
                        },
                        input: {
                            readOnly: true,
                            endAdornment: disabled ? undefined : (
                                <InputAdornment position='end'>
                                    <Settings
                                        color='primary'
                                        onClick={() => setOpen(true)}
                                    />
                                </InputAdornment>
                            ),
                            sx: { cursor: 'pointer !important' },
                        },
                    }}
                    sx={{
                        cursor: 'pointer !important',
                        '& .MuiSelect-icon': { display: 'none' },
                        '& .MuiInputBase-root::before': { display: 'none' },
                        '& .MuiInputBase-root::after': { display: 'none' },
                        '& .MuiInputBase-root': {
                            borderBottomLeftRadius: 'var(--mui-shape-borderRadius)',
                            borderBottomRightRadius: 'var(--mui-shape-borderRadius)',
                        },
                    }}
                    variant='filled'
                >
                    <MenuItem value='placeholder'>Placeholder</MenuItem>
                </TextField>
            </ButtonBase>

            <Dialog
                open={open}
                onClose={request.isLoading() ? undefined : () => setOpen(false)}
                fullWidth
            >
                <RequestSnackbar request={request} />

                <DialogContent>
                    <TextField
                        label='Start Week On'
                        select
                        value={weekStart}
                        onChange={(e) =>
                            setWeekStart(parseInt(e.target.value) as WeekDays)
                        }
                        fullWidth
                        sx={{ mb: 3 }}
                    >
                        <MenuItem value={0}>Sunday</MenuItem>
                        <MenuItem value={1}>Monday</MenuItem>
                        <MenuItem value={2}>Tuesday</MenuItem>
                        <MenuItem value={3}>Wednesday</MenuItem>
                        <MenuItem value={4}>Thursday</MenuItem>
                        <MenuItem value={5}>Friday</MenuItem>
                        <MenuItem value={6}>Saturday</MenuItem>
                    </TextField>

                    <Grid2 container alignItems='baseline' rowGap={2}>
                        <Grid2 size={{ xs: 4.5, sm: 3.5 }} alignSelf='center'>
                            <Typography>
                                Minimum Time Per Task{' '}
                                <Tooltip title='The minimum amount of time to spend working on each task per day. For example, if set to 30 minutes and your work goal is 1 hour, you will be suggested two tasks each for 30 minutes. If set to 15 minutes, you will be suggested three tasks each for 20 minutes.'>
                                    <Help
                                        fontSize='small'
                                        sx={{
                                            verticalAlign: 'middle',
                                            color: 'text.secondary',
                                        }}
                                    />
                                </Tooltip>
                            </Typography>
                        </Grid2>

                        <Grid2 size={{ xs: 7.5, sm: 8.5 }}>
                            <Stack direction='row' gap={{ xs: 0.5, sm: 1 }}>
                                <TextField
                                    label='Hours'
                                    value={minTime.hours}
                                    onChange={(e) => minTime.setHours(e.target.value)}
                                    error={!!minTime.errors.hours}
                                    helperText={minTime.errors.hours}
                                />
                                <TextField
                                    label='Minutes'
                                    value={minTime.minutes}
                                    onChange={(e) => minTime.setMinutes(e.target.value)}
                                    error={!!minTime.errors.minutes}
                                    helperText={minTime.errors.minutes}
                                />
                            </Stack>
                        </Grid2>

                        <Grid2 size={12} mt={1}>
                            <FormLabel>Work Goal</FormLabel>
                        </Grid2>

                        {new Array(7).fill(0).map((_, i) => {
                            const dayIndex = (weekStart + i) % 7;
                            const day = DAY_NAMES[dayIndex];
                            const time = timePerDay[dayIndex];
                            return (
                                <Fragment key={day}>
                                    <Grid2 size={{ xs: 4.5, sm: 3 }}>
                                        <Typography>{day}</Typography>
                                    </Grid2>

                                    <Grid2 size={{ xs: 7.5, sm: 9 }}>
                                        <Stack direction='row' gap={{ xs: 0.5, sm: 1 }}>
                                            <TextField
                                                label='Hours'
                                                value={time.hours}
                                                onChange={(e) =>
                                                    time.setHours(e.target.value)
                                                }
                                                error={!!time.errors.hours}
                                                helperText={time.errors.hours}
                                            />
                                            <TextField
                                                label='Minutes'
                                                value={time.minutes}
                                                onChange={(e) =>
                                                    time.setMinutes(e.target.value)
                                                }
                                                error={!!time.errors.minutes}
                                                helperText={time.errors.minutes}
                                            />
                                        </Stack>
                                    </Grid2>
                                </Fragment>
                            );
                        })}

                        <Grid2 size={12} mt={1}>
                            <Typography>
                                Total Per Week: {formatTime(minutesPerWeek)}
                            </Typography>
                        </Grid2>
                    </Grid2>
                </DialogContent>
                <DialogActions>
                    <Button disabled={request.isLoading()} onClick={() => setOpen(false)}>
                        Cancel
                    </Button>
                    <LoadingButton loading={request.isLoading()} onClick={onSave}>
                        Save
                    </LoadingButton>
                </DialogActions>
            </Dialog>
        </>
    );
}

function useTimeEditor(initialMinutes: number) {
    const initialHours = Math.floor(initialMinutes / 60);
    initialMinutes = initialMinutes % 60;

    const [hours, setHours] = useState(`${initialHours}`);
    const [minutes, setMinutes] = useState(`${initialMinutes}`);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const total = 60 * (parseInt(hours) || 0) + (parseInt(minutes) || 0);

    return {
        hours,
        setHours,
        minutes,
        setMinutes,
        errors,
        setErrors,
        total,
    };
}

function getLabel(
    view: TrainingPlanView.Daily | TrainingPlanView.Weekly,
    workGoal: WorkGoalSettings,
): string {
    if (view === TrainingPlanView.Daily) {
        const dayIndex = new Date().getDay();
        const time = formatTime(workGoal.minutesPerDay[dayIndex]);
        return `${DAY_NAMES[dayIndex]}: ${time}`;
    }

    const total = workGoal.minutesPerDay.reduce((sum, t) => sum + t, 0);
    return `${formatTime(total)} / week`;
}

function formatTime(timeMinutes: number): string {
    const hours = Math.floor(timeMinutes / 60);
    const minutes = timeMinutes % 60;

    let time = '';
    if (hours !== 0) {
        time = `${hours} hour${hours !== 1 ? 's' : ''}`;
    }
    if (minutes !== 0) {
        time += ` ${minutes} minute${minutes !== 1 ? 's' : ''}`;
    }
    return time.trimStart();
}
