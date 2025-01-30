import { formatTime } from '@/database/requirement';
import { WeekDays } from '@aldabil/react-scheduler/views/Month';
import { Settings } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    FormLabel,
    Grid2,
    IconButton,
    MenuItem,
    Stack,
    TextField,
    Tooltip,
    Typography,
} from '@mui/material';
import { Fragment, useState } from 'react';
import { useLocalStorage } from 'usehooks-ts';

const DAY_NAMES = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
] as const;

export function WorkGoalSettings() {
    const [open, setOpen] = useState(false);

    const [weekStartOn, setWeekStartOn] = useLocalStorage<WeekDays>(
        'calendarFilters.weekStartOn',
        0,
    );

    const minTime = useTimeEditor();
    const timePerDay = DAY_NAMES.map(useTimeEditor);
    const minutesPerWeek = timePerDay.reduce((sum, t) => sum + t.total, 0);

    return (
        <>
            <Tooltip title='Goal Settings'>
                <IconButton color='primary' size='large' onClick={() => setOpen(true)}>
                    <Settings fontSize='inherit' />
                </IconButton>
            </Tooltip>

            <Dialog open={open} onClose={() => setOpen(false)} fullWidth>
                <DialogContent>
                    <TextField
                        label='Start Week On'
                        select
                        value={weekStartOn}
                        onChange={(e) =>
                            setWeekStartOn(parseInt(e.target.value) as WeekDays)
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

                    <Grid2 container alignItems='center' rowGap={2}>
                        <Grid2 size={{ xs: 4.5, sm: 3.5 }}>
                            <Typography>Min Time Per Task</Typography>
                        </Grid2>

                        <Grid2 size={{ xs: 7.5, sm: 8.5 }}>
                            <Stack direction='row' gap={{ xs: 0.5, sm: 1 }}>
                                <TextField
                                    label='Hours'
                                    value={minTime.hours}
                                    onChange={(e) => minTime.setHours(e.target.value)}
                                />
                                <TextField
                                    label='Minutes'
                                    value={minTime.minutes}
                                    onChange={(e) => minTime.setMinutes(e.target.value)}
                                />
                            </Stack>
                        </Grid2>

                        <Grid2 size={12}>
                            <FormLabel>Work Goal</FormLabel>
                        </Grid2>

                        {new Array(7).fill(0).map((_, i) => {
                            const dayIndex = (weekStartOn + i) % 7;
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
                                            />
                                            <TextField
                                                label='Minutes'
                                                value={time.minutes}
                                                onChange={(e) =>
                                                    time.setMinutes(e.target.value)
                                                }
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
                    <Button onClick={() => setOpen(false)}>Cancel</Button>
                    <LoadingButton>Save</LoadingButton>
                </DialogActions>
            </Dialog>
        </>
    );
}

function useTimeEditor() {
    const [hours, setHours] = useState('');
    const [minutes, setMinutes] = useState('');
    const total = 60 * (parseInt(hours) || 0) + (parseInt(minutes) || 0);

    return {
        hours,
        setHours,
        minutes,
        setMinutes,
        total,
    };
}
