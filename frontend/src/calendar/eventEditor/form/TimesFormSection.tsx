import { useAuth } from '@/auth/Auth';
import { TimeFormat } from '@/database/user';
import Icon from '@/style/Icon';
import {
    FormControl,
    FormControlLabel,
    FormHelperText,
    FormLabel,
    Input,
    InputAdornment,
    MenuItem,
    Radio,
    RadioGroup,
    Stack,
    TextField,
    Typography,
} from '@mui/material';
import { DatePicker, DateTimePicker } from '@mui/x-date-pickers';
import { DateTime } from 'luxon';
import { Frequency, RRule } from 'rrule';
import { getDefaultRRuleCount, RRuleEnds, RRuleOptions } from '../useEventEditor';

interface TimesFormSectionProps {
    description?: string;

    start: DateTime | null;
    setStart: (value: DateTime | null) => void;
    startError?: string;

    end: DateTime | null;
    setEnd: (value: DateTime | null) => void;
    endError?: string;

    minEnd: DateTime | null;

    enableRecurrence?: boolean;
    rruleOptions: RRuleOptions;
    setRRuleOptions: (value: RRuleOptions) => void;
    countError?: string;
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
    enableRecurrence,
    rruleOptions,
    setRRuleOptions,
    countError,
}) => {
    const timeFormat = useAuth().user?.timeFormat || TimeFormat.TwelveHour;

    const onChangeFreq = (value: string | Frequency) => {
        if (value === 'never') {
            setRRuleOptions({ ...rruleOptions, freq: undefined });
        } else if (typeof value !== 'string') {
            setRRuleOptions({ ...rruleOptions, freq: value });
        }
    };

    const onChangeEnds = (value: RRuleEnds) => {
        setRRuleOptions({ ...rruleOptions, ends: value });
    };

    const onChangeCount = (value: string) => {
        let count = value === '' ? 0 : parseInt(value);
        if (isNaN(count) || count < 0) {
            count = 0;
        }
        setRRuleOptions({ ...rruleOptions, count });
    };

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
                minDateTime={minEnd === null ? undefined : minEnd}
                ampm={timeFormat === TimeFormat.TwelveHour}
            />

            {enableRecurrence && (
                <>
                    <TextField
                        select
                        value={rruleOptions.freq ?? 'never'}
                        onChange={(event) => onChangeFreq(event.target.value)}
                        sx={{ mt: 3 }}
                    >
                        <MenuItem value='never'>Does not repeat</MenuItem>
                        <MenuItem value={RRule.DAILY}>Daily</MenuItem>
                        <MenuItem value={RRule.WEEKLY}>Weekly</MenuItem>
                        <MenuItem value={RRule.MONTHLY}>Monthly</MenuItem>
                    </TextField>

                    {rruleOptions.freq && (
                        <FormControl sx={{ mt: 3 }}>
                            <FormLabel>Ends</FormLabel>
                            <RadioGroup
                                value={rruleOptions.ends}
                                onChange={(e) =>
                                    onChangeEnds(e.target.value as RRuleEnds)
                                }
                                sx={{ rowGap: 1.5 }}
                            >
                                <FormControlLabel
                                    value={RRuleEnds.Never}
                                    control={<Radio />}
                                    label='Never'
                                />

                                <Stack
                                    direction='row'
                                    columnGap={2.4}
                                    alignItems='center'
                                >
                                    <FormControlLabel
                                        value={RRuleEnds.Until}
                                        control={<Radio />}
                                        label='On'
                                    />

                                    <DatePicker
                                        disabled={rruleOptions.ends !== RRuleEnds.Until}
                                        value={
                                            rruleOptions.until ||
                                            start?.plus({ months: 1 }) ||
                                            null
                                        }
                                        onChange={(value) =>
                                            setRRuleOptions({
                                                ...rruleOptions,
                                                until: value,
                                            })
                                        }
                                        slotProps={{
                                            textField: {
                                                variant: 'standard',
                                                sx: { maxWidth: '130px' },
                                            },
                                        }}
                                        minDate={minEnd === null ? undefined : minEnd}
                                    />
                                </Stack>

                                <Stack
                                    direction='row'
                                    columnGap={1}
                                    alignItems='flex-start'
                                >
                                    <FormControlLabel
                                        value={RRuleEnds.Count}
                                        control={<Radio />}
                                        label='After'
                                    />

                                    <FormControl
                                        disabled={rruleOptions.ends !== RRuleEnds.Count}
                                        error={!!countError}
                                    >
                                        <Input
                                            id='input-slider'
                                            value={
                                                rruleOptions.count ??
                                                getDefaultRRuleCount(rruleOptions.freq)
                                            }
                                            size='small'
                                            onChange={(e) =>
                                                onChangeCount(e.target.value)
                                            }
                                            endAdornment={
                                                <InputAdornment position='end'>
                                                    Occurrences
                                                </InputAdornment>
                                            }
                                            sx={{ maxWidth: '130px' }}
                                        />
                                        {countError && (
                                            <FormHelperText>{countError}</FormHelperText>
                                        )}
                                    </FormControl>
                                </Stack>
                            </RadioGroup>
                        </FormControl>
                    )}
                </>
            )}
        </Stack>
    );
};

export default TimesFormSection;
