import { useState } from 'react';
import {
    Stack,
    TextField,
    DialogContentText,
    Grid,
    DialogContent,
    DialogActions,
    Button,
} from '@mui/material';
import { LoadingButton } from '@mui/lab';

import {
    Requirement,
    RequirementProgress,
    ScoreboardDisplay,
    getCurrentCount,
} from '../../database/requirement';
import InputSlider from './InputSlider';
import { useRequest } from '../../api/Request';
import { useApi } from '../../api/Api';

const NUMBER_REGEX = /^[0-9]*$/;

interface ProgressUpdaterProps {
    requirement: Requirement;
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
    const [hours, setHours] = useState('');
    const [minutes, setMinutes] = useState('');
    const [errors, setErrors] = useState<Record<string, string>>({});
    const request = useRequest();

    const isComplete = currentCount >= totalCount;

    const isSlider =
        requirement.scoreboardDisplay === ScoreboardDisplay.ProgressBar ||
        requirement.scoreboardDisplay === ScoreboardDisplay.Unspecified;

    let hoursInt = parseInt(hours) || 0;
    let minutesInt = parseInt(minutes) || 0;
    const totalTime = 60 * hoursInt + minutesInt + (progress?.minutesSpent[cohort] ?? 0);

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

        const updatedValue = isSlider
            ? value - currentCount
            : isComplete
            ? -totalCount
            : totalCount;

        request.onStart();
        api.updateUserProgress(
            cohort,
            requirement.id,
            updatedValue,
            hoursInt * 60 + minutesInt
        )
            .then((response) => {
                console.log('updateUserProgress: ', response);
                onClose();
                setHours('');
                setMinutes('');
                request.reset();
            })
            .catch((err) => {
                console.error('updateUserProgress: ', err);
            });
    };

    return (
        <>
            <DialogContent>
                <Stack spacing={2}>
                    {isSlider && (
                        <InputSlider
                            value={value}
                            setValue={setValue}
                            max={totalCount}
                            min={requirement.startCount}
                        />
                    )}
                    {isComplete ? (
                        <DialogContentText>
                            Your progress on this requirement will be{' '}
                            {isSlider ? 'updated' : 'reset'}, but any time you previously
                            entered and associated activity entries for this requirement
                            will remain.
                        </DialogContentText>
                    ) : (
                        <>
                            <DialogContentText>
                                Optionally add how long it took to{' '}
                                {isSlider ? 'update' : 'complete'} this requirement in
                                order for it to be added to your activity breakdown. This
                                time will be added to any time you previously entered for
                                this requirement.
                            </DialogContentText>
                            <Grid container width={1}>
                                <Grid item xs={12} sm>
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
                                <Grid
                                    item
                                    xs={12}
                                    sm
                                    pl={{ sm: 2 }}
                                    pt={{ xs: 2, sm: 0 }}
                                >
                                    <TextField
                                        label='Minutes'
                                        value={minutes}
                                        inputProps={{
                                            inputMode: 'numeric',
                                            pattern: '[0-9]*',
                                        }}
                                        onChange={(event) =>
                                            setMinutes(event.target.value)
                                        }
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
                        </>
                    )}
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
                <LoadingButton
                    loading={request.isLoading()}
                    onClick={onSubmit}
                    disabled={isSlider ? value === currentCount : false}
                >
                    {isSlider ? 'Update' : isComplete ? 'Uncheck' : 'Complete'}
                </LoadingButton>
            </DialogActions>
        </>
    );
};

export default ProgressUpdater;
