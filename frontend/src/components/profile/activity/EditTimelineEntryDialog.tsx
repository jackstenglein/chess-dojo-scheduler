import { EventType, trackEvent } from '@/analytics/events';
import { useApi } from '@/api/Api';
import { useRequirement } from '@/api/cache/requirements';
import { RequestSnackbar, useRequest } from '@/api/Request';
import { useAuth } from '@/auth/Auth';
import {
    getCurrentCount,
    getCurrentScore,
    RequirementProgress,
    ScoreboardDisplay,
} from '@/database/requirement';
import { TimelineEntry } from '@/database/timeline';
import { ALL_COHORTS } from '@/database/user';
import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Grid,
    Stack,
    TextField,
    Typography,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import { DateTime } from 'luxon';
import { useState } from 'react';
import { useTimelineContext } from './useTimeline';

const NUMBER_REGEX = /^[0-9]*$/;
const NEGATIVE_NUMBER_REGEX = /^-?[0-9]*$/;

export function EditTimelinEntryDialog({
    entry,
    onClose,
}: {
    entry: TimelineEntry;
    onClose: () => void;
}) {
    const api = useApi();
    const { user, updateUser } = useAuth();
    const { requirement } = useRequirement(entry.requirementId);
    const timeline = useTimelineContext();
    const request = useRequest();

    const [date, setDate] = useState<DateTime | null>(
        DateTime.fromISO(entry.date || entry.createdAt),
    );
    const [count, setCount] = useState(`${entry.newCount - entry.previousCount}`);
    const [hours, setHours] = useState(`${Math.floor(entry.minutesSpent / 60)}`);
    const [minutes, setMinutes] = useState(`${entry.minutesSpent % 60}`);
    const [notes, setNotes] = useState(entry.notes);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const entries = timeline.entries
        .filter((e) => e.requirementId === entry.requirementId && e.cohort === entry.cohort)
        .sort((lhs, rhs) => (lhs.date || lhs.createdAt).localeCompare(rhs.date || rhs.createdAt));

    const isTimeOnly =
        entry.scoreboardDisplay === ScoreboardDisplay.NonDojo ||
        entry.scoreboardDisplay === ScoreboardDisplay.Minutes;

    const progress = user?.progress[entry.requirementId];
    const currentCount = getCurrentCount(
        entry.cohort,
        requirement || user?.customTasks?.find((t) => t.id === entry.requirementId),
        progress,
    );
    const currentMinutes = progress?.minutesSpent[entry.cohort] ?? 0;
    const totalCount =
        currentCount + (parseInt(count || '0') - (entry.newCount - entry.previousCount));
    const totalTime =
        currentMinutes +
        60 * parseInt(hours || '0') +
        parseInt(minutes || '0') -
        entry.minutesSpent;

    const onSubmit = () => {
        const newErrors: Record<string, string> = {};
        if (date === null) {
            newErrors.date = 'This field is required';
        }
        if (count !== '' && (!NEGATIVE_NUMBER_REGEX.test(count) || isNaN(parseInt(count)))) {
            newErrors.count = 'This field must be an integer';
        }
        if (hours !== '' && (!NUMBER_REGEX.test(hours) || isNaN(parseInt(hours)))) {
            newErrors.hours = 'This field must be an integer';
        }
        if (minutes !== '' && (!NUMBER_REGEX.test(minutes) || isNaN(parseInt(minutes)))) {
            newErrors.minutes = 'This field must be an integer';
        }

        setErrors(newErrors);
        if (Object.keys(newErrors).length > 0) {
            return;
        }

        const updated: TimelineEntry[] = [];
        let totalMinutesSpent = 0;
        let found = false;

        for (const e of entries) {
            if (!found && e.id !== entry.id) {
                continue;
            }

            const previousCount =
                updated.length === 0 ? entry.previousCount : (updated.at(-1)?.newCount ?? 0);
            let newCount =
                e.scoreboardDisplay === ScoreboardDisplay.Minutes
                    ? e.minutesSpent
                    : e.newCount - e.previousCount;
            let minutesSpent = e.minutesSpent;

            if (e.id === entry.id) {
                found = true;
                totalMinutesSpent = e.totalMinutesSpent - e.minutesSpent;
                minutesSpent = 60 * parseInt(hours || '0') + parseInt(minutes || '0');
                newCount =
                    e.scoreboardDisplay === ScoreboardDisplay.Minutes
                        ? minutesSpent
                        : parseInt(count || '0');
            }
            totalMinutesSpent += minutesSpent;
            newCount += previousCount;

            let previousScore = 0;
            let newScore = 0;
            if (requirement) {
                previousScore = getCurrentScore(entry.cohort, requirement, {
                    counts: { [ALL_COHORTS]: previousCount, [entry.cohort]: previousCount },
                } as unknown as RequirementProgress);
                newScore = getCurrentScore(entry.cohort, requirement, {
                    counts: { [ALL_COHORTS]: newCount, [entry.cohort]: newCount },
                } as unknown as RequirementProgress);
            }

            updated.push({
                ...e,
                notes: e.id === entry.id ? notes : e.notes,
                date:
                    e.id === entry.id
                        ? (date?.toUTC().toISO() ?? e.createdAt)
                        : e.date || e.createdAt,
                previousCount,
                newCount,
                dojoPoints: newScore - previousScore,
                totalDojoPoints: newScore,
                minutesSpent,
                totalMinutesSpent,
            });
        }

        request.onStart();
        api.updateUserTimeline(
            entry.requirementId,
            entry.cohort,
            updated,
            [],
            entry.scoreboardDisplay === ScoreboardDisplay.Minutes ? totalTime : totalCount,
            totalTime,
        )
            .then((response) => {
                trackEvent(EventType.UpdateTimeline, {
                    requirement_id: entry.requirementId,
                    requirement_name: entry.requirementName,
                    is_custom_requirement: entry.isCustomRequirement,
                    dojo_cohort: entry.cohort,
                    total_count:
                        entry.scoreboardDisplay === ScoreboardDisplay.Minutes
                            ? totalTime
                            : totalCount,
                    total_minutes: totalTime,
                });
                updateUser(response.data);
                timeline.onEditEntries(updated);
                onClose();
            })
            .catch((err) => {
                console.error('updateUserTimeline: ', err);
                request.onFailure(err);
            });
    };

    return (
        <Dialog open onClose={request.isLoading() ? undefined : onClose} fullWidth maxWidth='md'>
            <DialogTitle>Update {entry.requirementName}?</DialogTitle>
            <DialogContent>
                <Grid container columnGap={2} rowGap={3} alignItems='center' mt={1}>
                    <Grid size={{ xs: 12, sm: 'grow' }} sx={{ minWidth: '145px' }}>
                        <DatePicker
                            label='Date'
                            value={date}
                            onChange={(v) => setDate(v)}
                            slotProps={{
                                textField: {
                                    error: !!errors.date,
                                    helperText: errors.date,
                                    fullWidth: true,
                                },
                            }}
                        />
                    </Grid>

                    {!isTimeOnly && (
                        <Grid size={{ xs: 12, sm: 'grow' }}>
                            <TextField
                                data-cy='task-history-count'
                                label='Count'
                                value={count}
                                onChange={(event) => setCount(event.target.value)}
                                fullWidth
                                error={!!errors.count}
                                helperText={errors.count}
                            />
                        </Grid>
                    )}

                    <Grid size={{ xs: 12, sm: 'grow' }}>
                        <TextField
                            label='Hours'
                            value={hours}
                            slotProps={{
                                htmlInput: {
                                    inputMode: 'numeric',
                                    pattern: '[0-9]*',
                                },
                            }}
                            onChange={(event) => setHours(event.target.value)}
                            fullWidth
                            error={!!errors.hours}
                            helperText={errors.hours}
                        />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 'grow' }}>
                        <TextField
                            label='Minutes'
                            value={minutes}
                            slotProps={{
                                htmlInput: {
                                    inputMode: 'numeric',
                                    pattern: '[0-9]*',
                                },
                            }}
                            onChange={(event) => setMinutes(event.target.value)}
                            fullWidth
                            error={!!errors.minutes}
                            helperText={errors.minutes}
                        />
                    </Grid>

                    <Grid size={12}>
                        <TextField
                            label='Comments'
                            placeholder='Optional comments about your progress or the task itself. Visible to others on the newsfeed.'
                            multiline={true}
                            maxRows={3}
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            fullWidth
                        />
                    </Grid>
                </Grid>

                <Stack mt={2}>
                    {!isTimeOnly && (
                        <Typography color='text.secondary'>
                            New Total Count:{' '}
                            {currentCount +
                                (parseInt(count || '0') - (entry.newCount - entry.previousCount))}
                        </Typography>
                    )}
                    <Typography color='text.secondary'>
                        New Total Time: {`${Math.floor(totalTime / 60)}h ${totalTime % 60}m`}
                    </Typography>
                </Stack>
            </DialogContent>
            <DialogActions>
                <Button disabled={request.isLoading()} onClick={onClose}>
                    Cancel
                </Button>
                <Button loading={request.isLoading()} onClick={onSubmit}>
                    Save
                </Button>
            </DialogActions>

            <RequestSnackbar request={request} />
        </Dialog>
    );
}
