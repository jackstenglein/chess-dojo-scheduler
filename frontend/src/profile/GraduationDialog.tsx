import { Graduation } from '@/database/graduation';
import SchoolIcon from '@mui/icons-material/School';
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
    Tooltip,
} from '@mui/material';
import { useState } from 'react';
import { EventType, setUserProperties, trackEvent } from '../analytics/events';
import { useApi } from '../api/Api';
import { RequestSnackbar, useRequest } from '../api/Request';
import { useAuth, useFreeTier } from '../auth/Auth';
import { isCustom, shouldPromptGraduation } from '../database/user';
import UpsellDialog, { RestrictedAction } from '../upsell/UpsellDialog';
import GraduationShareDialog from './GraduationShareDialog';

const GraduationDialog = () => {
    const [comments, setComments] = useState('');
    const request = useRequest<string>();
    const api = useApi();
    const { user } = useAuth();
    const isFreeTier = useFreeTier();
    const [upsellDialogOpen, setUpsellDialogOpen] = useState(false);
    const [showGraduationDialog, setShowGraduationDialog] = useState(false);
    const [showShareDialog, setShareDialog] = useState(false);
    const [graduation, setGraduation] = useState<Graduation>();

    const shouldGraduate = shouldPromptGraduation(user);
    const disableGraduation = !shouldGraduate && !isCustom(user?.ratingSystem);

    const onOpen = () => {
        if (isFreeTier) {
            setUpsellDialogOpen(true);
        } else {
            setShowGraduationDialog(true);
        }
    };

    const onGraduate = () => {
        if (!user) {
            return;
        }
        request.onStart();
        api.graduate(comments)
            .then((response) => {
                setGraduation(response.data.graduation);
                request.onSuccess('Congratulations! You have successfully graduated!');
                trackEvent(EventType.Graduate, {
                    previous_cohort: response.data.graduation.previousCohort,
                    new_cohort: response.data.graduation.newCohort,
                    dojo_score: response.data.graduation.score,
                });
                setUserProperties({ ...user, ...response.data.userUpdate });
                setShowGraduationDialog(false);
                setShareDialog(!user?.enableZenMode);
            })
            .catch((err) => {
                request.onFailure(err);
            });
    };

    return (
        <>
            <Tooltip
                title={
                    disableGraduation
                        ? 'Your current preferred rating is too low to graduate (note: ratings are updated every 24 hours). If you still want to switch cohorts, you can do so without graduating by editing your profile.'
                        : ''
                }
            >
                <div>
                    <Button
                        id='graduate-button'
                        variant='contained'
                        color='success'
                        onClick={onOpen}
                        disabled={disableGraduation}
                        startIcon={<SchoolIcon />}
                    >
                        Graduate
                    </Button>
                </div>
            </Tooltip>

            <RequestSnackbar request={request} showSuccess />
            <Dialog
                open={showGraduationDialog}
                onClose={request.isLoading() ? undefined : () => setShowGraduationDialog(false)}
                fullWidth
            >
                <DialogTitle>Graduate from {user?.dojoCohort}?</DialogTitle>
                <DialogContent>
                    <Stack spacing={2}>
                        <DialogContentText>
                            This will move you to the next cohort and add a badge to your profile.
                            You will also be added to the list of recent graduates, and Jesse will
                            review your profile in the next grad show on Twitch. If you just want to
                            look at tasks from other cohorts, use the dropdown in the training plan
                            instead.
                        </DialogContentText>
                        <DialogContentText>
                            Optionally add comments on what was most helpful about the program, what
                            could be improved, etc. This will be visible to all other members of the
                            dojo.
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
                    <Button
                        onClick={() => setShowGraduationDialog(false)}
                        disabled={request.isLoading()}
                    >
                        Cancel
                    </Button>
                    <LoadingButton loading={request.isLoading()} onClick={onGraduate}>
                        Graduate
                    </LoadingButton>
                </DialogActions>
            </Dialog>
            {!!graduation && (
                <GraduationShareDialog
                    open={showShareDialog}
                    graduation={graduation}
                    onClose={() => setShareDialog(false)}
                />
            )}
            <UpsellDialog
                open={upsellDialogOpen}
                onClose={setUpsellDialogOpen}
                currentAction={RestrictedAction.Graduate}
            />
        </>
    );
};

export default GraduationDialog;
