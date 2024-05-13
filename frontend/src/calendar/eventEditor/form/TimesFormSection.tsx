import { Stack, Typography } from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers';
import { DateTime } from 'luxon';
import { useAuth } from '../../../auth/Auth';
import { TimeFormat } from '../../../database/user';
import Icon from '../../../style/Icon';
interface TimesFormSectionProps {
    description?: string;

    start: DateTime | null;
    setStart: (value: DateTime | null) => void;
    startError?: string;

    end: DateTime | null;
    setEnd: (value: DateTime | null) => void;
    endError?: string;

    minEnd: DateTime | null;
}

const TimesFormSection: React.FC<TimesFormSectionProps> = ({
    description,
    start,
    setStart,
    startError,
    end,
    setEnd,
    endError,
    minEnd,
}) => {
    const timeFormat = useAuth().user?.timeFormat || TimeFormat.TwelveHour;

    return (
        <Stack>
            <Typography variant='h6'>
                <Icon
                    name='clock'
                    color='primary'
                    sx={{ marginRight: '0.4rem', verticalAlign: 'middle' }}
                    fontSize='medium'
                />
                Times
            </Typography>
            {description && (
                <Typography variant='subtitle1' color='text.secondary'>
                    {description}
                </Typography>
            )}
            <DateTimePicker
                label='Start Time'
                value={start}
                onChange={(value) => setStart(value)}
                slotProps={{
                    textField: {
                        id: 'start-time',
                        fullWidth: true,
                        error: Boolean(startError),
                        helperText: startError,
                        sx: { mt: 2, mb: 3 },
                    },
                }}
                ampm={timeFormat === TimeFormat.TwelveHour}
            />

            <DateTimePicker
                label='End Time'
                value={end}
                onChange={(value) => setEnd(value)}
                slotProps={{
                    textField: {
                        id: 'end-time',
                        fullWidth: true,
                        error: Boolean(endError),
                        helperText: endError,
                    },
                }}
                minDateTime={minEnd}
                ampm={timeFormat === TimeFormat.TwelveHour}
            />
        </Stack>
    );
};

export default TimesFormSection;
