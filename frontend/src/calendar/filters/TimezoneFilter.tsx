import { FormControl, MenuItem, Select, Stack, Typography } from '@mui/material';

import { useApi } from '../../api/Api';
import { useAuth } from '../../auth/Auth';
import { DefaultTimezone } from './CalendarFilters';

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
}

const TimezoneFilter: React.FC<TimezoneFilterProps> = ({ timezone, setTimezone }) => {
    const api = useApi();
    const auth = useAuth();

    const onChangeTimezone = (tz: string) => {
        setTimezone(tz);
        if (auth.user) {
            api.updateUser({ timezoneOverride: tz });
        }
    };

    const timezoneOffset = new Date().getTimezoneOffset() / 60;
    const browserDefaultLabel =
        timezoneOffset > 0 ? `UTC-${timezoneOffset}` : `UTC+${Math.abs(timezoneOffset)}`;

    return (
        <Stack id='current-timezone'>
            <Typography variant='h6' color='text.secondary' ml={1}>
                Current Timezone
            </Typography>
            <FormControl size='small'>
                <Select
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
    );
};

export default TimezoneFilter;
