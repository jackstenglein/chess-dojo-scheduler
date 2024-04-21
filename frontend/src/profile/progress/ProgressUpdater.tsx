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
import { useState } from 'react';

import { DatePicker } from '@mui/x-date-pickers';
import { DateTime } from 'luxon';
import { EventType, trackEvent } from '../../analytics/events';
import { useApi } from '../../api/Api';
import { RequestSnackbar, useRequest } from '../../api/Request';
import {
    CustomTask,
    getCurrentCount,
    isRequirement,
    Requirement,
    RequirementProgress,
    ScoreboardDisplay,
} from '../../database/requirement';
import InputSlider from './InputSlider';

const NUMBER_REGEX = /^[0-9]*$/;

const TIME_WARNING_THRESHOLD_MINS = 60 * 5; // 5 hours

function getContentText(isNonDojo: boolean, isMinutes: boolean): string {
    if (isNonDojo || isMinutes) {
        return 'This time will be added to any time you have previously entered for this activity.';
    }

    return `Optionally add time to this requirement in order for it to be added to your activity breakdown. This time will be added to any time you have previously entered for this requirement.`;
}

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
            return -totalCount;
        }
        return 0;
    }

    if (!markComplete) {
        // The user is just changing the time
        return currentCount;
    }

    return totalCount - currentCount;
}

interface ProgressUpdaterProps {
    requirement: Requirement | CustomTask;
    progress?: RequirementProgress;
    cohort: string;
    onClose: () => void;
    toggleView?: () => void;
}

const ProgressUpdater: React.FC<ProgressUpdaterProps> = ({
    requirement,
    progress,
    cohort,
    onClose,
    toggleView,
}) => {
    const api = useApi();

    const totalCount = requirement.counts[cohort] || 0;
    const currentCount = getCurrentCount(cohort, requirement, progress);

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
        requirement.scoreboardDisplay === ScoreboardDisplay.Unspecified;
    const isNonDojo = requirement.scoreboardDisplay === ScoreboardDisplay.NonDojo;
    const isMinutes = requirement.scoreboardDisplay === ScoreboardDisplay.Minutes;

    let hoursInt = parseInt(hours) || 0;
    let minutesInt = parseInt(minutes) || 0;
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
            .then((response) => {
                console.log('updateUserProgress: ', response);
                trackEvent(EventType.UpdateProgress, {
                    requirement_id: requirement.id,
                    requirement_name: requirement.name,
                    is_custom_requirement: !isRequirement(requirement),
                    dojo_cohort: cohort,
                    incremental_count: incrementalCount,
                    incremental_minutes: hoursInt * 60 + minutesInt,
                });
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
                    {isSlider && isRequirement(requirement) && (
                        <InputSlider
                            value={value}
                            setValue={setValue}
                            max={totalCount}
                            min={requirement.startCount}
                            suffix={requirement.progressBarSuffix}
                        />
                    )}

                    {isCheckbox && (
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={markComplete}
                                    onChange={(event) =>
                                        setMarkComplete(event.target.checked)
                                    }
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
                        <DialogContentText>
                            {getContentText(isNonDojo, isMinutes)}
                        </DialogContentText>

                        <Grid container width={1}>
                            <Grid item xs={12} sm>
                                <DatePicker
                                    label='Date'
                                    disableFuture
                                    value={date}
                                    onChange={setDate}
                                    slotProps={{ textField: { fullWidth: true } }}
                                />
                            </Grid>
                            <Grid item xs={12} sm pl={{ sm: 2 }} pt={{ xs: 2, sm: 0 }}>
                                <TextField
                                    label='Hours'
                                    value={hours}
                                    inputProps={{
                                        inputMode: 'numeric',
                                        pattern: '[0-9]*',
                                    }}
                                    onChange={(event) => setHours(event.target.value)}
                                    error={!!errors.hours}
                                    helperText={errors.hours}
                                    fullWidth
                                />
                            </Grid>
                            <Grid item xs={12} sm pl={{ sm: 2 }} pt={{ xs: 2, sm: 0 }}>
                                <TextField
                                    label='Minutes'
                                    value={minutes}
                                    inputProps={{
                                        inputMode: 'numeric',
                                        pattern: '[0-9]*',
                                    }}
                                    onChange={(event) => setMinutes(event.target.value)}
                                    error={!!errors.minutes}
                                    helperText={errors.minutes}
                                    fullWidth
                                />
                            </Grid>
                        </Grid>
                        <DialogContentText>
                            Total Time:{' '}
                            {`${Math.floor(totalTime / 60)}h ${totalTime % 60}m`}
                        </DialogContentText>
                        {addedTime > TIME_WARNING_THRESHOLD_MINS && (
                            <Alert severity='warning' variant='filled'>
                                You're adding a lot of time! Please double-check your
                                input before saving.
                            </Alert>
                        )}
                    </Stack>
                </Stack>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} disabled={request.isLoading()}>
                    Cancel
                </Button>
                {toggleView && (
                    <Button onClick={toggleView} disabled={request.isLoading()}>
                        Show History
                    </Button>
                )}
                <LoadingButton loading={request.isLoading()} onClick={onSubmit}>
                    Update
                </LoadingButton>
            </DialogActions>

            <RequestSnackbar request={request} />
        </>
    );
};

export default ProgressUpdater;
