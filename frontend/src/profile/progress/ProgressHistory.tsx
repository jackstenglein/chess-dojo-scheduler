import DeleteIcon from '@mui/icons-material/Delete';
import { LoadingButton } from '@mui/lab';
import {
    Button,
    DialogActions,
    DialogContent,
    DialogContentText,
    Divider,
    IconButton,
    Stack,
    TextField,
    Typography,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import { DateTime } from 'luxon';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { EventType, trackEvent } from '../../analytics/events';
import { useApi } from '../../api/Api';
import { RequestSnackbar, useRequest } from '../../api/Request';
import { useAuth } from '../../auth/Auth';
import {
    CustomTask,
    isRequirement,
    Requirement,
    ScoreboardDisplay,
} from '../../database/requirement';
import { TimelineEntry } from '../../database/timeline';
import LoadingPage from '../../loading/LoadingPage';
import { useTimeline } from '../activity/useTimeline';

const NUMBER_REGEX = /^[0-9]*$/;

interface HistoryItem {
    date: DateTime | null;
    count: string;
    hours: string;
    minutes: string;
    entry: TimelineEntry;
    index: number;
    deleted: boolean;
}

type ProgressHistoryItemProps = HistoryItem & {
    error: HistoryItemError;
    updateItem: (item: HistoryItem) => void;
    deleteItem: () => void;
};

const ProgressHistoryItem: React.FC<ProgressHistoryItemProps> = ({
    date,
    count,
    hours,
    minutes,
    entry,
    index,
    deleted,
    error,
    updateItem,
    deleteItem,
}) => {
    if (deleted) {
        return null;
    }

    const isTimeOnly =
        entry.scoreboardDisplay === ScoreboardDisplay.NonDojo ||
        entry.scoreboardDisplay === ScoreboardDisplay.Minutes;

    const onChangeDate = (value: DateTime | null) => {
        updateItem({
            date: value,
            count,
            hours,
            minutes,
            entry,
            index,
            deleted,
        });
    };

    const onChangeCount = (value: string) => {
        updateItem({
            date,
            count: value,
            hours,
            minutes,
            entry,
            index,
            deleted,
        });
    };

    const onChangeHours = (value: string) => {
        updateItem({
            date,
            count,
            hours: value,
            minutes,
            entry,
            index,
            deleted,
        });
    };

    const onChangeMinutes = (value: string) => {
        updateItem({
            date,
            count,
            hours,
            minutes: value,
            entry,
            index,
            deleted,
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
                <DatePicker
                    label='Date'
                    value={date}
                    onChange={onChangeDate}
                    slotProps={{
                        textField: {
                            error: !!error.date,
                            helperText: error.date,
                        },
                    }}
                />

                {!isTimeOnly && (
                    <TextField
                        label='Count'
                        value={count}
                        onChange={(event) => onChangeCount(event.target.value)}
                        sx={{ maxWidth: '100px' }}
                        error={!!error.count}
                        helperText={error.count}
                    />
                )}

                <TextField
                    label='Hours'
                    value={hours}
                    inputProps={{
                        inputMode: 'numeric',
                        pattern: '[0-9]*',
                    }}
                    onChange={(event) => onChangeHours(event.target.value)}
                    sx={{ maxWidth: '100px' }}
                    error={!!error.hours}
                    helperText={error.hours}
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
                    error={!!error.minutes}
                    helperText={error.minutes}
                />

                <IconButton aria-label='delete' onClick={deleteItem}>
                    <DeleteIcon />
                </IconButton>
            </Stack>
            <Divider sx={{ display: { xs: 'inherit', sm: 'none' } }} />
        </>
    );
};

interface HistoryItemError {
    date?: string;
    count?: string;
    hours?: string;
    minutes?: string;
}

function getTimelineUpdate(items: HistoryItem[]): {
    updated: TimelineEntry[];
    deleted: TimelineEntry[];
    errors: Record<number, HistoryItemError>;
} {
    const errors: Record<number, HistoryItemError> = {};

    items.forEach((item, idx) => {
        if (item.deleted) {
            return;
        }

        let itemErrors: HistoryItemError = {};
        if (item.date === null) {
            itemErrors.date = 'This field is required';
        }

        if (
            item.entry.scoreboardDisplay !== ScoreboardDisplay.NonDojo &&
            item.entry.scoreboardDisplay !== ScoreboardDisplay.Minutes &&
            (isNaN(parseInt(item.count)) || parseInt(item.count) < 0)
        ) {
            itemErrors.count = 'This field must be a non-negative integer';
        }

        if (
            item.hours !== '' &&
            (!NUMBER_REGEX.test(item.hours) || isNaN(parseInt(item.hours)))
        ) {
            itemErrors.hours = 'This field must be an integer';
        }

        if (
            item.minutes !== '' &&
            (!NUMBER_REGEX.test(item.minutes) || isNaN(parseInt(item.minutes)))
        ) {
            itemErrors.minutes = 'This field must be an integer';
        }

        if (Object.values(itemErrors).length > 0) {
            errors[idx] = itemErrors;
        }
    });

    if (Object.values(errors).length > 0) {
        return {
            updated: [],
            deleted: [],
            errors,
        };
    }

    const updated: TimelineEntry[] = [];
    const deleted: TimelineEntry[] = [];
    let totalMinutesSpent = 0;

    for (const item of items) {
        if (item.deleted) {
            deleted.push(item.entry);
            continue;
        }

        const minutesSpent =
            60 * parseInt(item.hours || '0') + parseInt(item.minutes || '0');

        const previousCount =
            updated.length === 0 ? 0 : updated[updated.length - 1].newCount;
        const newCount =
            item.entry.scoreboardDisplay === ScoreboardDisplay.Minutes
                ? previousCount + minutesSpent
                : previousCount + parseInt(item.count);

        totalMinutesSpent += minutesSpent;

        updated.push({
            ...item.entry,
            date: item.date?.toUTC().toISO() || item.entry.createdAt,
            previousCount,
            newCount,
            minutesSpent,
            totalMinutesSpent,
        });
    }

    return {
        updated,
        deleted,
        errors,
    };
}

interface ProgressHistoryProps {
    requirement: Requirement | CustomTask;
    cohort: string;
    onClose: () => void;
    toggleView?: () => void;
}

const ProgressHistory: React.FC<ProgressHistoryProps> = ({
    requirement,
    cohort,
    onClose,
    toggleView,
}) => {
    const user = useAuth().user!;
    const api = useApi();
    const request = useRequest();

    const [errors, setErrors] = useState<Record<number, HistoryItemError>>({});
    const { entries, request: timelineRequest } = useTimeline(user.username);

    const isTimeOnly =
        requirement.scoreboardDisplay === ScoreboardDisplay.NonDojo ||
        requirement.scoreboardDisplay === ScoreboardDisplay.Minutes;

    const initialItems: HistoryItem[] = useMemo(() => {
        return entries
            .filter((t) => t.requirementId === requirement.id && t.cohort === cohort)
            .sort((a, b) => (a.date || a.createdAt).localeCompare(b.date || b.createdAt))
            .map((t, idx) => ({
                date: DateTime.fromISO(t.date || t.createdAt),
                count: `${t.newCount - t.previousCount}`,
                hours: `${Math.floor(t.minutesSpent / 60)}`,
                minutes: `${t.minutesSpent % 60}`,
                cohort: t.cohort,
                entry: t,
                index: idx,
                deleted: false,
            }));
    }, [requirement, entries, cohort]);

    const [items, setItems] = useState(initialItems);

    useEffect(() => {
        setItems(initialItems);
    }, [initialItems]);

    const totalCount = useMemo(() => {
        return items.reduce((sum, item) => {
            if (item.deleted) {
                return sum;
            }
            if (isNaN(parseInt(item.count))) {
                return sum;
            }
            return sum + parseInt(item.count);
        }, 0);
    }, [items]);

    const totalTime = useMemo(() => {
        return items.reduce((sum, item) => {
            if (item.deleted) {
                return sum;
            }
            let newSum = sum;
            if (NUMBER_REGEX.test(item.hours) && !isNaN(parseInt(item.hours))) {
                newSum += 60 * parseInt(item.hours);
            }

            if (NUMBER_REGEX.test(item.minutes) && !isNaN(parseInt(item.minutes))) {
                newSum += parseInt(item.minutes);
            }
            return newSum;
        }, 0);
    }, [items]);

    const getUpdateItem = useCallback(
        (idx: number) => (item: HistoryItem) =>
            setItems((items) => [...items.slice(0, idx), item, ...items.slice(idx + 1)]),
        [setItems],
    );

    const getDeleteItem = useCallback(
        (idx: number) => () =>
            setItems((items) => [
                ...items.slice(0, idx),
                {
                    ...items[idx],
                    deleted: true,
                },
                ...items.slice(idx + 1),
            ]),
        [setItems],
    );

    const onSubmit = () => {
        const update = getTimelineUpdate(items);

        setErrors(update.errors);
        if (Object.values(update.errors).length > 0) {
            return;
        }

        request.onStart();

        api.updateUserTimeline(
            requirement.id,
            cohort,
            update.updated,
            update.deleted,
            requirement.scoreboardDisplay === ScoreboardDisplay.Minutes
                ? totalTime
                : totalCount,
            totalTime,
        )
            .then((response) => {
                console.log('updateUserTimeline: ', response);
                trackEvent(EventType.UpdateTimeline, {
                    requirement_id: requirement.id,
                    requirement_name: requirement.name,
                    is_custom_requirement: !isRequirement(requirement),
                    dojo_cohort: cohort,
                    total_count:
                        requirement.scoreboardDisplay === ScoreboardDisplay.Minutes
                            ? totalTime
                            : totalCount,
                    total_minutes: totalTime,
                });
                onClose();
                request.onSuccess(response);
            })
            .catch((err) => {
                console.error('updateUserTimeline: ', err);
                request.onFailure(err);
            });
    };

    if (timelineRequest.isLoading()) {
        return (
            <>
                <DialogContent>
                    <LoadingPage />
                </DialogContent>
            </>
        );
    }

    return (
        <>
            <DialogContent>
                {items.length === 0 ? (
                    <DialogContentText>
                        You have no history for this requirement in cohort {cohort}.
                        Please choose a different cohort to edit your history.
                    </DialogContentText>
                ) : (
                    <Stack spacing={3} mt={1} width={1}>
                        {items.map((item, idx) => (
                            <ProgressHistoryItem
                                key={idx}
                                {...item}
                                error={errors[idx] || {}}
                                updateItem={getUpdateItem(idx)}
                                deleteItem={getDeleteItem(idx)}
                            />
                        ))}

                        <Stack>
                            {!isTimeOnly && (
                                <Typography color='text.secondary'>
                                    Total Count: {totalCount}
                                </Typography>
                            )}
                            <Typography color='text.secondary'>
                                Total Time:{' '}
                                {`${Math.floor(totalTime / 60)}h ${totalTime % 60}m`}
                            </Typography>
                        </Stack>
                    </Stack>
                )}
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
                <LoadingButton loading={request.isLoading()} onClick={onSubmit}>
                    Save
                </LoadingButton>
            </DialogActions>
            <RequestSnackbar request={request} />
            <RequestSnackbar request={timelineRequest} />
        </>
    );
};

export default ProgressHistory;
