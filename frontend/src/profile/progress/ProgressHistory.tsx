import { useCallback, useMemo, useState } from 'react';
import {
    Button,
    DialogActions,
    DialogContent,
    Divider,
    IconButton,
    MenuItem,
    Stack,
    TextField,
    Typography,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LoadingButton } from '@mui/lab';

import { Requirement, TimelineEntry } from '../../database/requirement';
import { useAuth } from '../../auth/Auth';
import { useRequest } from '../../api/Request';
import { dojoCohorts } from '../../database/user';

const NUMBER_REGEX = /^[0-9]*$/;

interface HistoryItem {
    date: Date | null;
    count: string;
    hours: string;
    minutes: string;
    cohort: string;
    entry: TimelineEntry;
    index: number;
}

type ProgressHistoryItemProps = HistoryItem & {
    updateItem: (item: HistoryItem) => void;
    deleteItem: () => void;
};

const ProgressHistoryItem: React.FC<ProgressHistoryItemProps> = ({
    date,
    count,
    hours,
    minutes,
    cohort,
    entry,
    index,
    updateItem,
    deleteItem,
}) => {
    const onChangeDate = (value: Date | null) => {
        updateItem({
            date: value,
            count,
            hours,
            minutes,
            cohort,
            entry,
            index,
        });
    };

    const onChangeCount = (value: string) => {
        updateItem({
            date,
            count: value,
            hours,
            minutes,
            cohort,
            entry,
            index,
        });
    };

    const onChangeHours = (value: string) => {
        updateItem({
            date,
            count,
            hours: value,
            minutes,
            cohort,
            entry,
            index,
        });
    };

    const onChangeMinutes = (value: string) => {
        updateItem({
            date,
            count,
            hours,
            minutes: value,
            cohort,
            entry,
            index,
        });
    };

    const onChangeCohort = (value: string) => {
        updateItem({
            date,
            count,
            hours,
            minutes,
            cohort: value,
            entry,
            index,
        });
    };

    return (
        <>
            <Stack
                direction='row'
                spacing={{ xs: 0, sm: 1 }}
                width={1}
                alignItems='center'
                flexWrap={{ xs: 'wrap', sm: 'nowrap' }}
                rowGap={2}
            >
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <DatePicker
                        label='Date'
                        value={date}
                        onChange={onChangeDate}
                        slotProps={{
                            textField: {
                                // error: !!errors.start,
                                // helperText: errors.start,
                            },
                        }}
                    />
                </LocalizationProvider>

                <TextField
                    select
                    label='Cohort'
                    value={cohort}
                    onChange={(event) => onChangeCohort(event.target.value)}
                >
                    {dojoCohorts.map((option) => (
                        <MenuItem key={option} value={option}>
                            {option}
                        </MenuItem>
                    ))}
                </TextField>

                <TextField
                    label='Count'
                    value={count}
                    onChange={(event) => onChangeCount(event.target.value)}
                    sx={{ maxWidth: '100px' }}
                />

                <TextField
                    label='Hours'
                    value={hours}
                    inputProps={{
                        inputMode: 'numeric',
                        pattern: '[0-9]*',
                    }}
                    onChange={(event) => onChangeHours(event.target.value)}
                    sx={{ maxWidth: '100px' }}

                    // error={!!errors.hours}
                    // helperText={errors.hours}
                    // fullWidth
                />

                <TextField
                    label='Minutes'
                    value={minutes}
                    inputProps={{
                        inputMode: 'numeric',
                        pattern: '[0-9]*',
                    }}
                    onChange={(event) => onChangeMinutes(event.target.value)}
                    sx={{ maxWidth: '100px' }}

                    // error={!!errors.minutes}
                    // helperText={errors.minutes}
                    // fullWidth
                />

                <IconButton aria-label='delete' onClick={deleteItem}>
                    <DeleteIcon />
                </IconButton>
            </Stack>
            <Divider sx={{ display: { xs: 'inherit', sm: 'none' } }} />
        </>
    );
};

interface ProgressHistoryProps {
    requirement: Requirement;
    onClose: () => void;
    toggleView?: () => void;
}

const ProgressHistory: React.FC<ProgressHistoryProps> = ({
    requirement,
    onClose,
    toggleView,
}) => {
    const user = useAuth().user!;
    const request = useRequest();

    const initialItems: HistoryItem[] = useMemo(() => {
        return user.timeline
            .map((t, idx) => ({
                date: new Date(t.createdAt),
                count: `${t.newCount - t.previousCount}`,
                hours: `${Math.floor(t.minutesSpent / 60)}`,
                minutes: `${t.minutesSpent % 60}`,
                cohort: t.cohort,
                entry: t,
                index: idx,
            }))
            .filter((item) => item.entry.requirementId === requirement.id);
    }, [requirement, user]);

    const [items, setItems] = useState(initialItems);

    const totalCount = useMemo(() => {
        return items.reduce((sum, item) => {
            if (isNaN(parseInt(item.count))) {
                return sum;
            }
            return sum + parseInt(item.count);
        }, 0);
    }, [items]);

    const totalTime = useMemo(() => {
        return items.reduce((sum, item) => {
            if (
                !NUMBER_REGEX.test(item.hours) ||
                !NUMBER_REGEX.test(item.minutes) ||
                isNaN(parseInt(item.hours)) ||
                isNaN(parseInt(item.minutes))
            ) {
                return sum;
            }
            return sum + 60 * parseInt(item.hours) + parseInt(item.minutes);
        }, 0);
    }, [items]);

    const getIpdateItem = useCallback(
        (idx: number) => (item: HistoryItem) =>
            setItems((items) => [...items.slice(0, idx), item, ...items.slice(idx + 1)]),
        [setItems]
    );

    const getDeleteItem = useCallback(
        (idx: number) => () =>
            setItems((items) => [...items.slice(0, idx), ...items.slice(idx + 1)]),
        [setItems]
    );

    return (
        <>
            <DialogContent>
                <Stack spacing={3} mt={1} width={1}>
                    {items.map((item, idx) => (
                        <ProgressHistoryItem
                            key={idx}
                            {...item}
                            updateItem={getIpdateItem(idx)}
                            deleteItem={getDeleteItem(idx)}
                        />
                    ))}

                    <Stack>
                        <Typography color='text.secondary'>
                            Total Count: {totalCount}
                        </Typography>
                        <Typography color='text.secondary'>
                            Total Time:{' '}
                            {`${Math.floor(totalTime / 60)}h ${totalTime % 60}m`}
                        </Typography>
                    </Stack>
                </Stack>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} disabled={request.isLoading()}>
                    Cancel
                </Button>
                {toggleView && (
                    <Button onClick={toggleView} disabled={request.isLoading()}>
                        Hide History
                    </Button>
                )}
                <LoadingButton
                    loading={request.isLoading()}
                    // onClick={onSubmit}
                    // disabled={isSlider ? value === currentCount : false}
                >
                    Save
                </LoadingButton>
            </DialogActions>
        </>
    );
};

export default ProgressHistory;
