import { DefaultTimezone } from '@/components/calendar/filters/TimezoneSelector';
import AccessAlarmIcon from '@mui/icons-material/AccessAlarm';
import { Chip, Tooltip } from '@mui/material';

const timezoneDisplayLabels: Record<string, string> = {
    'Etc/GMT+12': 'UTC-12',
    'Etc/GMT+11': 'UTC-11',
    'Etc/GMT+10': 'UTC-10',
    'Etc/GMT+9': 'UTC-9',
    'Etc/GMT+8': 'UTC-8',
    'Etc/GMT+7': 'UTC-7',
    'Etc/GMT+6': 'UTC-6',
    'Etc/GMT+5': 'UTC-5',
    'Etc/GMT+4': 'UTC-4',
    'Etc/GMT+3': 'UTC-3',
    'Etc/GMT+2': 'UTC-2',
    'Etc/GMT+1': 'UTC-1',
    'Etc/GMT+0': 'UTC+0',
    'Etc/GMT-1': 'UTC+1',
    'Etc/GMT-2': 'UTC+2',
    'Etc/GMT-3': 'UTC+3',
    'Etc/GMT-4': 'UTC+4',
    'Etc/GMT-5': 'UTC+5',
    'Etc/GMT-6': 'UTC+6',
    'Etc/GMT-7': 'UTC+7',
    'Etc/GMT-8': 'UTC+8',
    'Etc/GMT-9': 'UTC+9',
    'Etc/GMT-10': 'UTC+10',
    'Etc/GMT-11': 'UTC+11',
    'Etc/GMT-12': 'UTC+12',
    'Etc/GMT-13': 'UTC+13',
    'Etc/GMT-14': 'UTC+14',
};

interface TimezoneChipProps {
    timezone?: string;
}

const TimezoneChip: React.FC<TimezoneChipProps> = ({ timezone }) => {
    if (!timezone || timezone === DefaultTimezone) {
        return null;
    }

    return (
        <Tooltip title="The user's timezone">
            <Chip
                icon={<AccessAlarmIcon fontSize='small' />}
                label={timezoneDisplayLabels[timezone]}
                variant='outlined'
                color='secondary'
            />
        </Tooltip>
    );
};

export default TimezoneChip;
