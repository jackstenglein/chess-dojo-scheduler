import { useState } from 'react';
import { LoadingButton } from '@mui/lab';
import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Stack,
    TextField,
} from '@mui/material';
import { RequestSnackbar, useRequest } from '../api/Request';
import { useApi } from '../api/Api';
import { EventType, trackEvent, setUserCohort } from '../analytics/events';

interface GraduationDialogProps {
    open: boolean;
    onClose: () => void;
    cohort: string;
}

const GraduationDialog: React.FC<GraduationDialogProps> = ({ open, onClose, cohort }) => {
    const [comments, setComments] = useState('');
    const request = useRequest();
    const api = useApi();

    const onGraduate = () => {
        request.onStart();
        api.graduate(comments)
            .then((response) => {
                console.log('graduate: ', response);
                request.onSuccess('Congratulations! You have successfully graduated!');
                trackEvent(EventType.Graduate, {
                    previous_cohort: response.data.graduation.previousCohort,
                    new_cohort: response.data.graduation.newCohort,
                    dojo_score: response.data.graduation.score,
                });
                setUserCohort(response.data.userUpdate.dojoCohort);
                onClose();
            })
            .catch((err) => {
                console.error('graduate: ', err);
                request.onFailure(err);
            });
    };

    return (
        <>
            <RequestSnackbar request={request} showSuccess />
            <Dialog open={open} onClose={request.isLoading() ? undefined : onClose}>
                <DialogTitle>Graduate from {cohort}?</DialogTitle>
                <DialogContent>
                    <Stack spacing={2}>
                        <DialogContentText>
                            Optionally add comments on what was most helpful about the
                            program, what could be improved, etc. This will be visible to
                            the sensei and other members of the dojo.
                        </DialogContentText>
                        <TextField
                            label='Comments'
                            value={comments}
                            onChange={(event) => setComments(event.target.value)}
                            multiline
                            minRows={3}
                            maxRows={3}
                            fullWidth
                        />
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={onClose} disabled={request.isLoading()}>
                        Cancel
                    </Button>
                    <LoadingButton loading={request.isLoading()} onClick={onGraduate}>
                        Graduate
                    </LoadingButton>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default GraduationDialog;
