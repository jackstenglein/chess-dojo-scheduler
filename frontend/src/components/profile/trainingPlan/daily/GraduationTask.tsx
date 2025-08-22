import { EventType, setUserProperties, trackEvent } from '@/analytics/events';
import { useApi } from '@/api/Api';
import { RequestSnackbar, useRequest } from '@/api/Request';
import { useFreeTier } from '@/auth/Auth';
import { formatRatingSystem, getCurrentRating, shouldPromptGraduation } from '@/database/user';
import CohortIcon from '@/scoreboard/CohortIcon';
import UpsellDialog, { RestrictedAction } from '@/upsell/UpsellDialog';
import { Help, NotInterested } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import {
    Button,
    Card,
    CardActionArea,
    CardActions,
    CardContent,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Grid,
    IconButton,
    Stack,
    TextField,
    Tooltip,
    Typography,
} from '@mui/material';
import { use, useState } from 'react';
import { TrainingPlanContext } from '../TrainingPlanTab';

export function GraduationTask() {
    const { user, isCurrentUser, skippedTaskIds, toggleSkip } = use(TrainingPlanContext);
    const shouldGraduate = shouldPromptGraduation(user);

    const [comments, setComments] = useState('');
    const request = useRequest<string>();
    const api = useApi();
    const isFreeTier = useFreeTier();
    const [upsellDialogOpen, setUpsellDialogOpen] = useState(false);
    const [showGraduationDialog, setShowGraduationDialog] = useState(false);
    // const [showShareDialog, setShareDialog] = useState(false);
    // const [graduation, setGraduation] = useState<Graduation>();

    if (!shouldGraduate || skippedTaskIds?.includes('graduation')) {
        return null;
    }

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
                // setGraduation(response.data.graduation);
                request.onSuccess('Congratulations! You have successfully graduated!');
                trackEvent(EventType.Graduate, {
                    previous_cohort: response.data.graduation.previousCohort,
                    new_cohort: response.data.graduation.newCohort,
                    dojo_score: response.data.graduation.score,
                });
                setUserProperties({ ...user, ...response.data.userUpdate });
                setShowGraduationDialog(false);
                // setShareDialog(!user?.enableZenMode);
            })
            .catch((err) => {
                request.onFailure(err);
            });
    };

    return (
        <>
            <Grid size={{ xs: 12, md: 4 }}>
                <Card
                    variant='outlined'
                    sx={{ height: 1, display: 'flex', flexDirection: 'column' }}
                >
                    <CardActionArea sx={{ flexGrow: 1 }} onClick={onOpen}>
                        <CardContent sx={{ height: 1 }}>
                            <Stack spacing={1} alignItems='start'>
                                <CohortIcon cohort={user.dojoCohort} tooltip='' size={24} />

                                <Typography variant='h6' fontWeight='bold'>
                                    Graduate from {user.dojoCohort}
                                </Typography>
                            </Stack>

                            <Typography color='textSecondary' sx={{ mt: 1 }}>
                                Congrats on reaching {getCurrentRating(user)}{' '}
                                {formatRatingSystem(user.ratingSystem)}! Use this task to move to
                                the next cohort, add a badge to your profile, and get one of your
                                annotated games reviewed on stream!
                            </Typography>
                        </CardContent>
                    </CardActionArea>
                    <CardActions disableSpacing>
                        <Tooltip title='View task details'>
                            <IconButton sx={{ color: 'text.secondary' }} onClick={onOpen}>
                                <Help />
                            </IconButton>
                        </Tooltip>

                        {isCurrentUser && (
                            <Tooltip title='Skip for the rest of the week'>
                                <IconButton
                                    sx={{
                                        color: 'text.secondary',
                                        marginLeft: 'auto',
                                    }}
                                    onClick={() => toggleSkip('graduation')}
                                >
                                    <NotInterested />
                                </IconButton>
                            </Tooltip>
                        )}
                    </CardActions>
                </Card>
            </Grid>

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
                            Dojo.
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
            {/* {!!graduation && (
                <GraduationShareDialog
                    open={showShareDialog}
                    graduation={graduation}
                    onClose={() => setShareDialog(false)}
                />
            )} */}
            <UpsellDialog
                open={upsellDialogOpen}
                onClose={setUpsellDialogOpen}
                currentAction={RestrictedAction.Graduate}
            />
        </>
    );
}
