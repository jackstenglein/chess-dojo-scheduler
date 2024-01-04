import {
    FormControl,
    FormControlLabel,
    FormLabel,
    MenuItem,
    Radio,
    RadioGroup,
    Select,
    Stack,
    Typography,
} from '@mui/material';

import { useApi } from '../../api/Api';
import { useAuth } from '../../auth/Auth';
import { DefaultTimezone } from './CalendarFilters';
import { TimeFormat } from '../../database/user';
import { LocalizationProvider, TimePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

function getTimezoneOptions() {
    const options = [];
    for (let i = -12; i <= 14; i++) {
        const displayLabel = i < 0 ? `UTC${i}` : `UTC+${i}`;
        const value = i <= 0 ? `Etc/GMT+${Math.abs(i)}` : `Etc/GMT-${i}`;
        options.push(
            <MenuItem key={i} value={value}>
                {displayLabel}
            </MenuItem>
        );
    }
    return options;
}

interface TimezoneFilterProps {
    timezone: string;
    setTimezone: (tz: string) => void;

    timeFormat: string;
    setTimeFormat: (format: TimeFormat) => void;

    minHour: Date | null;
    setMinHour: (d: Date | null) => void;

    maxHour: Date | null;
    setMaxHour: (d: Date | null) => void;
}

const TimezoneFilter: React.FC<TimezoneFilterProps> = ({
    timezone,
    setTimezone,
    timeFormat,
    setTimeFormat,
    minHour,
    setMinHour,
    maxHour,
    setMaxHour,
}) => {
    const api = useApi();
    const auth = useAuth();

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

    return (
        <Stack spacing={2}>
            <Stack id='current-timezone'>
                <Typography variant='h6' color='text.secondary' ml={1}>
                    Current Timezone
                </Typography>
                <FormControl size='small'>
                    <Select
                        data-cy='timezone-selector'
                        value={timezone}
                        onChange={(e) => onChangeTimezone(e.target.value)}
                    >
                        <MenuItem value={DefaultTimezone}>
                            Browser Default ({browserDefaultLabel})
                        </MenuItem>
                        {getTimezoneOptions()}
                    </Select>
                </FormControl>
            </Stack>

            <FormControl data-cy='time-format'>
                <FormLabel>Time Format</FormLabel>
                <RadioGroup
                    row
                    value={timeFormat}
                    onChange={(e) => onChangeTimeFormat(e.target.value as TimeFormat)}
                >
                    <FormControlLabel
                        value={TimeFormat.TwelveHour}
                        control={<Radio />}
                        label='12 Hour'
                    />
                    <FormControlLabel
                        value={TimeFormat.TwentyFourHour}
                        control={<Radio />}
                        label='24 Hour'
                    />
                </RadioGroup>
            </FormControl>

            <LocalizationProvider dateAdapter={AdapterDateFns}>
                <TimePicker
                    label='Min Hour'
                    views={['hours']}
                    ampm={timeFormat === TimeFormat.TwelveHour}
                    value={minHour}
                    onChange={(v) => setMinHour(v)}
                />
                <TimePicker
                    label='Max Hour'
                    views={['hours']}
                    ampm={timeFormat === TimeFormat.TwelveHour}
                    value={maxHour}
                    onChange={(v) => setMaxHour(v)}
                />
            </LocalizationProvider>
        </Stack>
    );
};

export default TimezoneFilter;
