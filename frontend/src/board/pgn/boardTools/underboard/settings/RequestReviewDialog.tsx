import { LoadingButton } from '@mui/lab';
import {
    Button,
    Checkbox,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    FormControl,
    FormControlLabel,
    FormHelperText,
    FormLabel,
    Link,
    Radio,
    RadioGroup,
    Stack,
    Typography,
} from '@mui/material';
import { AxiosResponse } from 'axios';
import { useEffect, useState } from 'react';
import { useApi } from '../../../../../api/Api';
import { ListGamesResponse } from '../../../../../api/gameApi';
import { RequestSnackbar, useRequest } from '../../../../../api/Request';
import { useAuth } from '../../../../../auth/Auth';
import { toDojoDateString, toDojoTimeString } from '../../../../../calendar/displayDate';
import {
    displayGameReviewType,
    Game,
    GameReviewType,
} from '../../../../../database/game';
import { ONE_WEEK } from '../../../../../games/review/ReviewQueuePage';

const estimatedReviewDate = new Date(new Date().getTime() + ONE_WEEK);

interface RequestReviewDialogProps {
    /** The game to request a review for. */
    game: Game;

    /** Whether the dialog is open. */
    open: boolean;

    /** Called to close the dialog. */
    onClose: () => void;
}

const RequestReviewDialog: React.FC<RequestReviewDialogProps> = ({
    open,
    onClose,
    game,
}) => {
    const user = useAuth().user;
    const [reviewType, setReviewType] = useState<GameReviewType>();
    const [isConfirmed, setIsConfirmed] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const request = useRequest();
    const queueRequest = useRequest<{ length: number; index: number }>();
    const api = useApi();

    const cohort = game.cohort;
    const id = game.id;

    useEffect(() => {
        async function getQueueLength() {
            try {
                let startKey = undefined;
                let length = 0;
                let index = -1;

                do {
                    const response: AxiosResponse<ListGamesResponse> =
                        await api.listGamesForReview(startKey);

                    if (index < 0) {
                        const i = response.data.games.findIndex(
                            (g) => g.cohort === cohort && g.id === id,
                        );
                        if (i >= 0) {
                            index = length + i + 1;
                        }
                    }
                    length += response.data.games.length;
                    startKey = response.data.lastEvaluatedKey;
                } while (startKey);

                queueRequest.onSuccess({ length, index });
            } catch (err) {
                console.error('listGamesForReview: ', err);
                queueRequest.onFailure(err);
            }
        }

        if (!queueRequest.isSent()) {
            queueRequest.onStart();
            getQueueLength();
        }
    }, [queueRequest, api, cohort, id]);

    const onPurchase = () => {
        const newErrors: Record<string, string> = {};
        if (!reviewType) {
            newErrors.reviewType = 'This field is required';
        }
        if (!isConfirmed) {
            newErrors.isConfirmed = 'This field is required';
        }

        setErrors(newErrors);
        if (Object.keys(newErrors).length > 0) {
            return;
        }

        request.onStart();
        api.requestReview(game.cohort, game.id, reviewType!)
            .then((resp) => {
                console.log('requestReview: ', resp);
                window.location.href = resp.data.url;
            })
            .catch((err) => {
                console.error('requestReview: ', err);
                request.onFailure(err);
            });
    };

    if (!game.review) {
        return (
            <Dialog
                open={open}
                onClose={request.isLoading() ? undefined : onClose}
                fullWidth
            >
                <DialogTitle>Submit Game for Review?</DialogTitle>
                <DialogContent>
                    <DialogContentText mb={3}>
                        One of the senseis will review this game on a future{' '}
                        <Link
                            href='https://www.twitch.tv/chessdojolive'
                            target='_blank'
                            rel='noreferrer'
                        >
                            Twitch stream
                        </Link>
                        . If you miss the live stream, you can watch the review in the{' '}
                        <Link
                            href='https://www.twitch.tv/chessdojolive/videos?filter=archives&sort=time'
                            target='_blank'
                            rel='noreferrer'
                        >
                            Twitch VODs
                        </Link>{' '}
                        or on the{' '}
                        <Link
                            href='https://www.youtube.com/@ChessDojoLive'
                            target='_blank'
                            rel='noreferrer'
                        >
                            ChessDojoLive Youtube channel
                        </Link>
                        .
                    </DialogContentText>

                    <FormControl error={Boolean(errors.reviewType)}>
                        <FormLabel>Review Type</FormLabel>
                        <RadioGroup
                            value={reviewType}
                            onChange={(e) =>
                                setReviewType(e.target.value as GameReviewType)
                            }
                        >
                            <FormControlLabel
                                value={GameReviewType.Quick}
                                control={<Radio />}
                                label='Quick - $50 (~15-20 min, recommended for U1600)'
                            />
                            <FormControlLabel
                                value={GameReviewType.Deep}
                                control={<Radio />}
                                label='Deep Dive - $100 (~30-45 min, recommended for 1600+)'
                            />
                        </RadioGroup>
                        <FormHelperText>{errors.reviewType}</FormHelperText>
                    </FormControl>

                    <FormControl error={Boolean(errors.isConfirmed)}>
                        <FormControlLabel
                            sx={{ mt: 3 }}
                            control={
                                <Checkbox
                                    checked={isConfirmed}
                                    onChange={(e) => setIsConfirmed(e.target.checked)}
                                    sx={{
                                        color:
                                            errors.isConfirmed && !isConfirmed
                                                ? 'error.dark'
                                                : undefined,
                                    }}
                                />
                            }
                            slotProps={{
                                typography: {
                                    color:
                                        errors.isConfirmed && !isConfirmed
                                            ? 'error'
                                            : undefined,
                                },
                            }}
                            label='I confirm that this game is annotated and that the senseis will skip reviewing unannotated games'
                        />
                    </FormControl>

                    <Stack mt={5}>
                        <Typography>
                            Current Queue Length:{' '}
                            {queueRequest.isLoading() ? (
                                <CircularProgress size={16} sx={{ ml: 0.5 }} />
                            ) : (
                                queueRequest.data?.length
                            )}
                        </Typography>
                        <Typography>
                            Estimated Review Date: by{' '}
                            {toDojoDateString(
                                estimatedReviewDate,
                                user?.timezoneOverride,
                            )}
                        </Typography>
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button disabled={request.isLoading()} onClick={onClose}>
                        Cancel
                    </Button>
                    <LoadingButton loading={request.isLoading()} onClick={onPurchase}>
                        Purchase Review
                    </LoadingButton>
                </DialogActions>

                <RequestSnackbar request={request} />
            </Dialog>
        );
    }

    const date = new Date(game.reviewRequestedAt || '');
    const dateStr = toDojoDateString(date, user?.timezoneOverride);
    const timeStr = toDojoTimeString(date, user?.timezoneOverride, user?.timeFormat);
    const reviewDeadline = toDojoDateString(
        new Date(date.getTime() + ONE_WEEK),
        user?.timezoneOverride,
    );

    return (
        <Dialog open={open} onClose={onClose} fullWidth>
            <DialogTitle>Game Review Pending</DialogTitle>
            <DialogContent>
                <DialogContentText>
                    Your game review is still in the queue. One of the senseis will review
                    this game on a future{' '}
                    <Link
                        href='https://www.twitch.tv/chessdojolive'
                        target='_blank'
                        rel='noreferrer'
                    >
                        Twitch stream
                    </Link>
                    . If you miss the live stream, you can watch the review in the{' '}
                    <Link
                        href='https://www.twitch.tv/chessdojolive/videos?filter=archives&sort=time'
                        target='_blank'
                        rel='noreferrer'
                    >
                        Twitch VODs
                    </Link>{' '}
                    or on the{' '}
                    <Link
                        href='https://www.youtube.com/@ChessDojoLive'
                        target='_blank'
                        rel='noreferrer'
                    >
                        ChessDojoLive Youtube channel
                    </Link>
                    .
                </DialogContentText>

                <Stack mt={3}>
                    <Typography>
                        Review Requested: {dateStr} • {timeStr}
                    </Typography>
                    <Typography>
                        Review Type: {displayGameReviewType(game.review.type)}
                    </Typography>
                    <Typography>
                        Current Position in Queue:{' '}
                        {queueRequest.isLoading() ? (
                            <CircularProgress size={16} sx={{ ml: 0.5 }} />
                        ) : (
                            queueRequest.data?.index
                        )}
                    </Typography>
                    <Typography>Estimated Review Date: by {reviewDeadline}</Typography>
                </Stack>
            </DialogContent>
        </Dialog>
    );
};

export default RequestReviewDialog;
