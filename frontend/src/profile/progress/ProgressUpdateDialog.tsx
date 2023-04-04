import { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    Stack,
    DialogContentText,
    Grid,
    TextField,
    DialogActions,
    Button,
    MenuItem,
} from '@mui/material';
import { LoadingButton } from '@mui/lab';

import { useApi } from '../../api/Api';
import { useRequest } from '../../api/Request';
import {
    getCurrentCount,
    Requirement,
    RequirementProgress,
    ScoreboardDisplay,
} from '../../database/requirement';
import InputSlider from './InputSlider';
import { compareCohorts, dojoCohorts } from '../../database/user';

const NUMBER_REGEX = /^[0-9]*$/;

interface ProgressUpdateDialogProps {
    open: boolean;
    onClose: () => void;
    requirement: Requirement;
    progress?: RequirementProgress;
    cohort: string;
    selectCohort?: boolean;
}

const ProgressUpdateDialog: React.FC<ProgressUpdateDialogProps> = ({
    open,
    onClose,
    requirement,
    progress,
    cohort,
    selectCohort,
}) => {
    const cohortOptions = requirement.counts.ALL_COHORTS
        ? dojoCohorts
        : Object.keys(requirement.counts).sort(compareCohorts);
    const initialCohort = cohortOptions.includes(cohort) ? cohort : cohortOptions[0];

    const api = useApi();
    const [selectedCohort, setSelectedCohort] = useState(initialCohort);

    const totalCount = requirement.counts[selectedCohort] || 0;
    const currentCount = getCurrentCount(selectedCohort, requirement, progress);

    const [value, setValue] = useState<number>(currentCount);
    const [hours, setHours] = useState('');
    const [minutes, setMinutes] = useState('');
    const [errors, setErrors] = useState<Record<string, string>>({});
    const request = useRequest();

    const isSlider =
        requirement.scoreboardDisplay === ScoreboardDisplay.ProgressBar ||
        requirement.scoreboardDisplay === ScoreboardDisplay.Unspecified;

    const onSubmit = () => {
        let hoursInt = 0;
        let minutesInt = 0;
        const errors: Record<string, string> = {};
        if (hours !== '') {
            if (NUMBER_REGEX.test(hours)) {
                hoursInt = parseInt(hours);
            } else {
                errors.hours = 'Only numeric characters are accepted';
            }
        }
        if (minutes !== '') {
            if (NUMBER_REGEX.test(minutes)) {
                minutesInt = parseInt(minutes);
            } else {
                errors.minutes = 'Only numeric characters are accepted';
            }
        }
        setErrors(errors);

        if (Object.keys(errors).length > 0) {
            return;
        }

        const updatedValue = isSlider ? value - currentCount : totalCount;

        request.onStart();
        api.updateUserProgress(
            selectedCohort,
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
        <Dialog open={open} onClose={request.isLoading() ? undefined : onClose}>
            <DialogTitle>
                {isSlider ? 'Update' : 'Complete'} {requirement.name}?
            </DialogTitle>
            <DialogContent>
                <Stack spacing={2}>
                    {selectCohort && (
                        <TextField
                            select
                            label='Cohort'
                            value={selectedCohort}
                            onChange={(event) => setSelectedCohort(event.target.value)}
                            sx={{ mt: 1 }}
                        >
                            {cohortOptions.map((option) => (
                                <MenuItem key={option} value={option}>
                                    {option}
                                </MenuItem>
                            ))}
                        </TextField>
                    )}
                    {isSlider && (
                        <InputSlider
                            value={value}
                            setValue={setValue}
                            max={totalCount}
                            min={requirement.startCount}
                        />
                    )}
                    <DialogContentText>
                        Optionally add how long it took to{' '}
                        {isSlider ? 'update' : 'complete'} this requirement in order for
                        it to be added to your activity breakdown.
                    </DialogContentText>
                    <Grid container width={1}>
                        <Grid item xs={12} sm>
                            <TextField
                                label='Hours'
                                value={hours}
                                inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
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
                                inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
                                onChange={(event) => setMinutes(event.target.value)}
                                error={!!errors.minutes}
                                helperText={errors.minutes}
                                fullWidth
                            />
                        </Grid>
                    </Grid>
                </Stack>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} disabled={request.isLoading()}>
                    Cancel
                </Button>
                <LoadingButton
                    loading={request.isLoading()}
                    onClick={onSubmit}
                    disabled={isSlider ? value === currentCount : false}
                >
                    {isSlider ? 'Update' : 'Complete'}
                </LoadingButton>
            </DialogActions>
        </Dialog>
    );
};

export default ProgressUpdateDialog;
