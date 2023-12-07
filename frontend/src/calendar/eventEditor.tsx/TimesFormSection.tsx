import { Stack, Typography } from '@mui/material';
import { DateTimePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

interface TimesFormSectionProps {
    description?: string;

    start: Date | null;
    setStart: (value: Date | null) => void;
    startError?: string;

    end: Date | null;
    setEnd: (value: Date | null) => void;
    endError?: string;

    minEnd: Date | null;
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
    return (
        <Stack>
            <Typography variant='h6'>Times</Typography>
            {description && (
                <Typography variant='subtitle1' color='text.secondary'>
                    {description}
                </Typography>
            )}
            <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DateTimePicker
                    label='Start Time'
                    value={start}
                    onChange={(value) => {
                        console.log(value);
                        setStart(value);
                    }}
                    slotProps={{
                        textField: {
                            id: 'start-time',
                            fullWidth: true,
                            error: Boolean(startError),
                            helperText: startError,
                            sx: { mt: 2, mb: 3 },
                        },
                    }}
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
                />
            </LocalizationProvider>
        </Stack>
    );
};

export default TimesFormSection;
