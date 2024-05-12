import { WeekDays } from '@aldabil/react-scheduler/views/Month';
import {
    FormControl,
    FormControlLabel,
    FormLabel,
    MenuItem,
    Radio,
    RadioGroup,
    Stack,
    TextField,
} from '@mui/material';
import { TimePicker } from '@mui/x-date-pickers';
import { useApi } from '../../api/Api';
import { useAuth } from '../../auth/Auth';
import { TimeFormat } from '../../database/user';
import { DefaultTimezone, Filters } from './CalendarFilters';
import Icon from '../../style/Icon';

function getTimezoneOptions() {
    const options = [];
    for (let i = -12; i <= 14; i++) {
        const displayLabel = i < 0 ? `UTC${i}` : `UTC+${i}`;
        const value = i <= 0 ? `Etc/GMT+${Math.abs(i)}` : `Etc/GMT-${i}`;
        options.push(
            <MenuItem key={i} value={value}>
                {displayLabel}
            </MenuItem>,
        );
    }
    return options;
}

interface TimezoneFilterProps {
    filters: Filters;
}

const TimezoneFilter: React.FC<TimezoneFilterProps> = ({ filters }) => {
    const api = useApi();
    const auth = useAuth();

    const {
        timezone,
        setTimezone,
        timeFormat,
        setTimeFormat,
        weekStartOn,
        setWeekStartOn,
        minHour,
        setMinHour,
        maxHour,
        setMaxHour,
    } = filters;

    const onChangeTimezone = (tz: string) => {
        setTimezone(tz);
        if (auth.user) {
            api.updateUser({ timezoneOverride: tz });
        }
    };

    const onChangeTimeFormat = (format: TimeFormat) => {
        setTimeFormat(format);
        if (auth.user) {
            api.updateUser({ timeFormat: format });
        }
    };

    const timezoneOffset = new Date().getTimezoneOffset() / 60;
    const browserDefaultLabel =
        timezoneOffset > 0 ? `UTC-${timezoneOffset}` : `UTC+${Math.abs(timezoneOffset)}`;

    let minHourNum = minHour?.hour || 0;
    let maxHourNum = (maxHour?.hour || 23) + 1;

    return (
        <Stack spacing={2.5}>
            <FormControl data-cy='time-format'>
                
                <FormLabel sx={{ fontSize: '1rem' }} > Time Format </FormLabel>
                <RadioGroup
                    row
                    value={timeFormat}
                    onChange={(e) => onChangeTimeFormat(e.target.value as TimeFormat)}
                >
                    <FormControlLabel
                        value={TimeFormat.TwelveHour}
                        control={<Radio sx={{ py: 0.50 }} size='small' />}
                        label='12 Hour'
                        slotProps={{
                            typography: {
                                fontSize: '0.9rem',
                            },
                        }}
                    />
                    <FormControlLabel
                        value={TimeFormat.TwentyFourHour}
                        control={<Radio sx={{ py: 0.25 }} size='small' />}
                        label='24 Hour'
                        slotProps={{
                            typography: {
                                fontSize: '0.9rem',
                            },
                        }}
                    />
                </RadioGroup>
            </FormControl>

            <TextField
                label='Timezone'
                select
                data-cy='timezone-selector'
                value={timezone}
                onChange={(e) => onChangeTimezone(e.target.value)}
                size='small'
            >
                <MenuItem value={DefaultTimezone}>
                    Browser Default ({browserDefaultLabel})
                </MenuItem>
                {getTimezoneOptions()}
            </TextField>

            <TextField
                label='Week Start'
                select
                value={weekStartOn}
                onChange={(e) => setWeekStartOn(parseInt(e.target.value) as WeekDays)}
                size='small'
            >
                <MenuItem value={0}>Sunday</MenuItem>
                <MenuItem value={1}>Monday</MenuItem>
                <MenuItem value={2}>Tuesday</MenuItem>
                <MenuItem value={3}>Wednesday</MenuItem>
                <MenuItem value={4}>Thursday</MenuItem>
                <MenuItem value={5}>Friday</MenuItem>
                <MenuItem value={6}>Saturday</MenuItem>
            </TextField>

            <TimePicker
                label='Min Hour'
                views={['hours']}
                ampm={timeFormat === TimeFormat.TwelveHour}
                value={minHour}
                onChange={(v) => setMinHour(v)}
                maxTime={maxHour}
                slotProps={{
                    textField: {
                        size: 'small',
                        helperText:
                            minHourNum >= maxHourNum
                                ? 'Min hour cannot be greater than max hour'
                                : undefined,
                    },
                }}
            />
            <TimePicker
                label='Max Hour'
                views={['hours']}
                ampm={timeFormat === TimeFormat.TwelveHour}
                value={maxHour}
                onChange={(v) => setMaxHour(v)}
                minTime={minHour}
                slotProps={{
                    textField: {
                        size: 'small',
                        helperText:
                            maxHourNum <= minHourNum
                                ? 'Max hour cannot be less than min hour'
                                : undefined,
                    },
                }}
            />
        </Stack>
    );
};

export default TimezoneFilter;
