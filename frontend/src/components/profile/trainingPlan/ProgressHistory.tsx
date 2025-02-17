import { EventType, trackEvent } from '@/analytics/events';
import { useApi } from '@/api/Api';
import { RequestSnackbar, useRequest } from '@/api/Request';
import {
    CustomTask,
    Requirement,
    RequirementProgress,
    ScoreboardDisplay,
    getCurrentScore,
    isRequirement,
} from '@/database/requirement';
import { TimelineEntry } from '@/database/timeline';
import { ALL_COHORTS, User } from '@/database/user';
import LoadingPage from '@/loading/LoadingPage';
import { useTimelineContext } from '@/profile/activity/useTimeline';
import DeleteIcon from '@mui/icons-material/Delete';
import { LoadingButton } from '@mui/lab';
import {
    Box,
    Button,
    DialogActions,
    DialogContent,
    DialogContentText,
    Divider,
    Grid2,
    IconButton,
    Stack,
    TextField,
    Tooltip,
    Typography,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import { AxiosResponse } from 'axios';
import { DateTime } from 'luxon';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { TaskDialogView } from './TaskDialog';

const NUMBER_REGEX = /^[0-9]*$/;

interface HistoryItem {
    date: DateTime | null;
    count: string;
    hours: string;
    minutes: string;
    notes: string;
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
    notes,
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

    const onChange = (
        key: 'date' | 'count' | 'hours' | 'minutes' | 'notes',
        value: string | DateTime | null,
    ) => {
        const newItem = {
            date,
            count,
            hours,
            minutes,
            notes,
            entry,
            index,
            deleted,
            [key]: value,
        };
        updateItem(newItem);
    };

    return (
        <Box>
            <Stack
                direction='row'
                spacing={{ sm: 1 }}
                width={1}
                alignItems='center'
                flexWrap={{ xs: 'wrap', sm: 'nowrap' }}
                rowGap={2}
            >
                <Grid2 container columnGap={2} rowGap={3} alignItems='center'>
                    <Grid2 size={{ xs: 12, sm: 'grow' }} sx={{ minWidth: '145px' }}>
                        <DatePicker
                            label='Date'
                            value={date}
                            onChange={(v) => onChange('date', v)}
                            slotProps={{
                                textField: {
                                    error: !!error.date,
                                    helperText: error.date,
                                    fullWidth: true,
                                },
                            }}
                        />
                    </Grid2>

                    {!isTimeOnly && (
                        <Grid2 size={{ xs: 12, sm: 'grow' }}>
                            <TextField
                                data-cy='task-history-count'
                                label='Count'
                                value={count}
                                onChange={(event) =>
                                    onChange('count', event.target.value)
                                }
                                fullWidth
                                error={!!error.count}
                                helperText={error.count}
                            />
                        </Grid2>
                    )}

                    <Grid2 size={{ xs: 12, sm: 'grow' }}>
                        <TextField
                            label='Hours'
                            value={hours}
                            slotProps={{
                                htmlInput: {
                                    inputMode: 'numeric',
                                    pattern: '[0-9]*',
                                },
                            }}
                            onChange={(event) => onChange('hours', event.target.value)}
                            fullWidth
                            error={!!error.hours}
                            helperText={error.hours}
                        />
                    </Grid2>

                    <Grid2 size={{ xs: 12, sm: 'grow' }}>
                        <TextField
                            label='Minutes'
                            value={minutes}
                            slotProps={{
                                htmlInput: {
                                    inputMode: 'numeric',
                                    pattern: '[0-9]*',
                                },
                            }}
                            onChange={(event) => onChange('minutes', event.target.value)}
                            fullWidth
                            error={!!error.minutes}
                            helperText={error.minutes}
                        />
                    </Grid2>

                    <Grid2 size={12}>
                        <TextField
                            label='Comments'
                            placeholder='Optional comments about your progress or the task itself. Visible to others on the newsfeed.'
                            multiline={true}
                            maxRows={3}
                            value={notes}
                            onChange={(e) => onChange('notes', e.target.value)}
                            fullWidth
                        />
                    </Grid2>
                </Grid2>

                <Tooltip title='Delete entry'>
                    <IconButton
                        data-cy='task-history-delete-button'
                        aria-label='delete'
                        onClick={deleteItem}
                    >
                        <DeleteIcon />
                    </IconButton>
                </Tooltip>
            </Stack>

            <Divider sx={{ mt: 3, mb: 1 }} />
        </Box>
    );
};

interface HistoryItemError {
    date?: string;
    count?: string;
    hours?: string;
    minutes?: string;
}

function getTimelineUpdate(
    cohort: string,
    requirement: Requirement | CustomTask,
    items: HistoryItem[],
): {
    updated: TimelineEntry[];
    deleted: TimelineEntry[];
    errors: Record<number, HistoryItemError>;
} {
    const errors: Record<number, HistoryItemError> = {};

    items.forEach((item, idx) => {
        if (item.deleted) {
            return;
        }

        const itemErrors: HistoryItemError = {};
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
        totalMinutesSpent += minutesSpent;

        const previousCount =
            updated.length === 0 ? 0 : updated[updated.length - 1].newCount;
        const newCount =
            item.entry.scoreboardDisplay === ScoreboardDisplay.Minutes
                ? previousCount + minutesSpent
                : previousCount + parseInt(item.count);

        let previousScore = 0;
        let newScore = 0;
        if (isRequirement(requirement)) {
            previousScore = getCurrentScore(cohort, requirement, {
                counts: { [ALL_COHORTS]: previousCount, [cohort]: previousCount },
            } as unknown as RequirementProgress);
            newScore = getCurrentScore(cohort, requirement, {
                counts: { [ALL_COHORTS]: newCount, [cohort]: newCount },
            } as unknown as RequirementProgress);
        }

        updated.push({
            ...item.entry,
            notes: item.notes,
            date: item.date?.toUTC().toISO() || item.entry.createdAt,
            previousCount,
            newCount,
            dojoPoints: newScore - previousScore,
            totalDojoPoints: newScore,
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
    setView?: (view: TaskDialogView) => void;
}

const ProgressHistory: React.FC<ProgressHistoryProps> = ({
    requirement,
    cohort,
    onClose,
    setView,
}) => {
    const api = useApi();
    const request = useRequest<AxiosResponse<User>>();

    const [errors, setErrors] = useState<Record<number, HistoryItemError>>({});
    const { entries, request: timelineRequest, resetRequest } = useTimelineContext();

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
                notes: t.notes,
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
        const update = getTimelineUpdate(cohort, requirement, items);

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
                resetRequest();
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
                        {items.map((_, idx, array) => {
                            const reversedIdx = array.length - 1 - idx;
                            const item = array[reversedIdx];
                            return (
                                <ProgressHistoryItem
                                    key={item.entry.id}
                                    {...item}
                                    error={errors[reversedIdx] || {}}
                                    updateItem={getUpdateItem(reversedIdx)}
                                    deleteItem={getDeleteItem(reversedIdx)}
                                />
                            );
                        })}

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
                {setView && (
                    <>
                        <Button
                            onClick={() => setView(TaskDialogView.Details)}
                            disabled={request.isLoading()}
                        >
                            Task Details
                        </Button>
                        <Button
                            onClick={() => setView(TaskDialogView.Progress)}
                            disabled={request.isLoading()}
                        >
                            Update Progress
                        </Button>
                    </>
                )}
                <LoadingButton
                    data-cy='task-updater-save-button'
                    loading={request.isLoading()}
                    onClick={onSubmit}
                >
                    Save
                </LoadingButton>
            </DialogActions>
            <RequestSnackbar request={request} />
            <RequestSnackbar request={timelineRequest} />
        </>
    );
};

export default ProgressHistory;
