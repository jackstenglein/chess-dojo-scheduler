import { EventType, trackEvent } from '@/analytics/events';
import { useApi } from '@/api/Api';
import { RequestSnackbar, useRequest } from '@/api/Request';
import { useTimelineContext } from '@/components/profile/activity/useTimeline';
import {
    CustomTask,
    Requirement,
    RequirementProgress,
    ScoreboardDisplay,
    getCurrentCount,
    isRequirement,
} from '@/database/requirement';
import { LoadingButton } from '@mui/lab';
import {
    Alert,
    Button,
    Checkbox,
    DialogActions,
    DialogContent,
    DialogContentText,
    FormControlLabel,
    Grid,
    Stack,
    TextField,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import { DateTime } from 'luxon';
import { useState } from 'react';
import InputSlider from './InputSlider';
import { TaskDialogView } from './TaskDialog';

const NUMBER_REGEX = /^[0-9]*$/;

const TIME_WARNING_THRESHOLD_MINS = 60 * 5;

function getIncrementalCount(
    alreadyComplete: boolean,
    isSlider: boolean,
    isNonDojo: boolean,
    markComplete: boolean,
    value: number,
    currentCount: number,
    totalCount: number,
): number {
    if (isNonDojo) {
        return 0;
    }
    if (isSlider) {
        return value - currentCount;
    }

    if (alreadyComplete) {
        if (!markComplete) {
            // Reset to 0
            return -currentCount;
        }
        // No change
        return 0;
    }

    if (!markComplete) {
        // The user is just changing the time
        return 0;
    }

    return totalCount - currentCount;
}

interface ProgressUpdaterProps {
    requirement: Requirement | CustomTask;
    progress?: RequirementProgress;
    cohort: string;
    onClose: () => void;
    setView?: (view: TaskDialogView) => void;
}

const ProgressUpdater: React.FC<ProgressUpdaterProps> = ({
    requirement,
    progress,
    cohort,
    onClose,
    setView,
}) => {
    const api = useApi();
    const { entries, onNewEntry } = useTimelineContext();

    const totalCount = requirement.counts[cohort] || 0;
    const currentCount = getCurrentCount({ cohort, requirement, progress, timeline: entries });

    const [value, setValue] = useState<number>(currentCount);
    const [markComplete, setMarkComplete] = useState(true);
    const [date, setDate] = useState<DateTime | null>(DateTime.now());

    const [hours, setHours] = useState('');
    const [minutes, setMinutes] = useState('');

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [notes, setNotes] = useState('');
    const request = useRequest();

    const isComplete = currentCount >= totalCount;

    const isCheckbox =
        requirement.scoreboardDisplay === ScoreboardDisplay.Hidden ||
        requirement.scoreboardDisplay === ScoreboardDisplay.Checkbox;
    const isSlider =
        requirement.scoreboardDisplay === ScoreboardDisplay.ProgressBar ||
        requirement.scoreboardDisplay === ScoreboardDisplay.Unspecified ||
        requirement.scoreboardDisplay === ScoreboardDisplay.Yearly;
    const isNonDojo = requirement.scoreboardDisplay === ScoreboardDisplay.NonDojo;
    const isMinutes = requirement.scoreboardDisplay === ScoreboardDisplay.Minutes;

    const hoursInt = parseInt(hours) || 0;
    const minutesInt = parseInt(minutes) || 0;
    const totalTime = 60 * hoursInt + minutesInt + (progress?.minutesSpent[cohort] ?? 0);
    const addedTime = 60 * hoursInt + minutesInt;

    const onSubmit = () => {
        const errors: Record<string, string> = {};
        if (hours !== '') {
            if (!NUMBER_REGEX.test(hours)) {
                errors.hours = 'Only numeric characters are accepted';
            }
        }
        if (minutes !== '') {
            if (!NUMBER_REGEX.test(minutes)) {
                errors.minutes = 'Only numeric characters are accepted';
            }
        }
        setErrors(errors);

        if (Object.keys(errors).length > 0) {
            return;
        }

        const incrementalCount = isMinutes
            ? addedTime
            : getIncrementalCount(
                  isComplete,
                  isSlider,
                  isNonDojo,
                  markComplete,
                  value,
                  currentCount,
                  totalCount,
              );

        request.onStart();
        api.updateUserProgress(
            cohort,
            requirement.id,
            incrementalCount,
            hoursInt * 60 + minutesInt,
            date,
            notes,
        )
            .then((resp) => {
                trackEvent(EventType.UpdateProgress, {
                    requirement_id: requirement.id,
                    requirement_name: requirement.name,
                    is_custom_requirement: !isRequirement(requirement),
                    dojo_cohort: cohort,
                    incremental_count: incrementalCount,
                    incremental_minutes: hoursInt * 60 + minutesInt,
                });
                onNewEntry(resp.data.timelineEntry);
                onClose();
                setHours('');
                setMinutes('');
                request.reset();
            })
            .catch((err) => {
                console.error('updateUserProgress: ', err);
                request.onFailure(err);
            });
    };

    return (
        <>
            <DialogContent>
                <Stack spacing={3} sx={{ mt: isMinutes ? 1 : undefined }}>
                    {isSlider && (
                        <InputSlider
                            value={value}
                            setValue={setValue}
                            max={totalCount}
                            min={requirement.startCount || 0}
                            suffix={requirement.progressBarSuffix}
                        />
                    )}

                    {isCheckbox && (
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={markComplete}
                                    onChange={(event) => setMarkComplete(event.target.checked)}
                                />
                            }
                            label='Mark as Completed?'
                        />
                    )}

                    <TextField
                        label='Comments'
                        placeholder='Optional comments about your progress or the task itself. Visible to others on the newsfeed.'
                        multiline={true}
                        maxRows={3}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                    />

                    <Stack spacing={2}>
                        <Grid container width={1} gap={2}>
                            <Grid size={{ xs: 12, sm: 'grow' }}>
                                <DatePicker
                                    label='Date'
                                    disableFuture
                                    value={date}
                                    onChange={setDate}
                                    slotProps={{ textField: { fullWidth: true } }}
                                />
                            </Grid>
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
                                    error={!!errors.hours}
                                    helperText={errors.hours}
                                    fullWidth
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
                                    error={!!errors.minutes}
                                    helperText={errors.minutes}
                                    fullWidth
                                />
                            </Grid>
                        </Grid>
                        <DialogContentText>
                            Total Time: {`${Math.floor(totalTime / 60)}h ${totalTime % 60}m`}
                        </DialogContentText>
                        {addedTime > TIME_WARNING_THRESHOLD_MINS && (
                            <Alert severity='warning' variant='filled'>
                                You're adding a lot of time! Please double-check your input before
                                saving.
                            </Alert>
                        )}
                    </Stack>
                </Stack>
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
                            data-cy='task-updater-show-history-button'
                            onClick={() => setView(TaskDialogView.History)}
                            disabled={request.isLoading()}
                        >
                            Show History
                        </Button>
                    </>
                )}
                <LoadingButton
                    data-cy='task-updater-save-button'
                    loading={request.isLoading()}
                    onClick={onSubmit}
                >
                    Update
                </LoadingButton>
            </DialogActions>

            <RequestSnackbar request={request} />
        </>
    );
};

export default ProgressUpdater;
