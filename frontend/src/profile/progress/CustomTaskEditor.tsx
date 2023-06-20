import { useState } from 'react';
import {
    Button,
    Checkbox,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    FormControl,
    FormControlLabel,
    FormHelperText,
    Stack,
    TextField,
    Typography,
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { v4 as uuidv4 } from 'uuid';

import { CustomTask, ScoreboardDisplay } from '../../database/requirement';
import { dojoCohorts } from '../../database/user';
import { RequestSnackbar, useRequest } from '../../api/Request';
import { useApi } from '../../api/Api';
import { useAuth } from '../../auth/Auth';
import { EventType, trackEvent } from '../../analytics/events';

interface CustomTaskEditorProps {
    task?: CustomTask;
    open: boolean;
    onClose: () => void;
}

const CustomTaskEditor: React.FC<CustomTaskEditorProps> = ({ task, open, onClose }) => {
    const request = useRequest();
    const api = useApi();
    const user = useAuth().user!;

    const [name, setName] = useState(task?.name ?? '');
    const [description, setDescription] = useState(task?.description ?? '');
    const [allCohorts, setAllCohorts] = useState(
        task ? Object.values(task.counts).length === dojoCohorts.length : true
    );
    const [cohorts, setCohorts] = useState<Record<string, boolean>>(
        dojoCohorts.reduce((map, cohort) => {
            map[cohort] = task?.counts[cohort] !== undefined ?? false;
            return map;
        }, {} as Record<string, boolean>)
    );
    const [errors, setErrors] = useState<Record<string, string>>({});

    const onChangeCohort = (cohort: string, value: boolean) => {
        setCohorts({
            ...cohorts,
            [cohort]: value,
        });
    };

    const onCreate = () => {
        const newErrors: Record<string, string> = {};
        if (name.trim() === '') {
            newErrors.name = 'This field is required and must be non-empty';
        }
        if (!allCohorts && Object.values(cohorts).every((v) => !v)) {
            newErrors.cohorts = 'At least one cohort is required';
        }
        setErrors(newErrors);

        if (Object.values(newErrors).length > 0) {
            return;
        }

        const includedCohorts = allCohorts
            ? dojoCohorts
            : Object.keys(cohorts).filter((c) => cohorts[c]);
        const newCounts = includedCohorts.reduce((map, c) => {
            map[c] = 1;
            return map;
        }, {} as Record<string, number>);

        const newTask = {
            id: task ? task.id : uuidv4(),
            name,
            description,
            counts: newCounts,
            scoreboardDisplay: ScoreboardDisplay.NonDojo,
            category: 'Non-Dojo',
            updatedAt: new Date().toISOString(),
            owner: user.username,
        };

        let newTasks: CustomTask[] = [];
        if (task && user.customTasks) {
            const index = user.customTasks.findIndex((t) => t.id === task.id);
            newTasks = [
                ...user.customTasks.slice(0, index),
                newTask,
                ...user.customTasks.slice(index + 1),
            ];
        } else {
            newTasks = [...(user.customTasks || []), newTask];
        }

        request.onStart();
        api.updateUser({
            customTasks: newTasks,
        })
            .then((resp) => {
                console.log('updateUser: ', resp);
                trackEvent(EventType.CreateNondojoTask, {
                    name: name,
                    dojo_cohort: user.dojoCohort,
                });
                request.onSuccess();
                onClose();
            })
            .catch((err) => {
                console.error(err);
                request.onFailure(err);
            });
    };

    const title = task ? `Update ${task.name}?` : 'Create Custom Activity?';

    return (
        <Dialog
            open={open}
            onClose={request.isLoading() ? undefined : onClose}
            maxWidth='md'
        >
            <RequestSnackbar request={request} />

            <DialogTitle>{title}</DialogTitle>
            <DialogContent>
                {task === undefined && (
                    <DialogContentText>
                        This will create a new custom activity which you can use to track
                        your time. You will not be able to update progress or mark this
                        task as complete.
                    </DialogContentText>
                )}

                <Stack spacing={2} mt={2}>
                    <TextField
                        label='Activity Name'
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        error={!!errors.name}
                        helperText={errors.name}
                        fullWidth
                    />

                    <TextField
                        label='Description (Optional)'
                        multiline
                        minRows={3}
                        maxRows={3}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        fullWidth
                    />

                    <Stack>
                        <Typography variant='subtitle2' color='text.secondary'>
                            Choose the cohorts this activity will be added to. Your time
                            will be tracked individually across each cohort.
                        </Typography>
                        <FormControl error={!!errors.cohorts}>
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={allCohorts}
                                        onChange={(event) =>
                                            setAllCohorts(event.target.checked)
                                        }
                                    />
                                }
                                label='All Cohorts'
                            />
                            {!allCohorts && (
                                <Stack
                                    direction='row'
                                    sx={{ flexWrap: 'wrap', columnGap: 2.5 }}
                                >
                                    {dojoCohorts.map((cohort) => (
                                        <FormControlLabel
                                            key={cohort}
                                            control={
                                                <Checkbox
                                                    checked={
                                                        allCohorts || cohorts[cohort]
                                                    }
                                                    onChange={(event) =>
                                                        onChangeCohort(
                                                            cohort,
                                                            event.target.checked
                                                        )
                                                    }
                                                />
                                            }
                                            disabled={allCohorts}
                                            label={cohort}
                                        />
                                    ))}
                                </Stack>
                            )}
                            <FormHelperText>{errors.cohorts}</FormHelperText>
                        </FormControl>
                    </Stack>
                </Stack>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} disabled={request.isLoading()}>
                    Cancel
                </Button>

                <LoadingButton loading={request.isLoading()} onClick={onCreate}>
                    {task ? 'Update' : 'Create'}
                </LoadingButton>
            </DialogActions>
        </Dialog>
    );
};

export default CustomTaskEditor;
