import { LoadingButton } from '@mui/lab';
import {
    Button,
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
import { useState } from 'react';
import { useApi } from '../../../../../api/Api';
import { RequestSnackbar, useRequest } from '../../../../../api/Request';
import { useAuth } from '../../../../../auth/Auth';
import { toDojoDateString, toDojoTimeString } from '../../../../../calendar/displayDate';
import { Game, GameReviewType } from '../../../../../database/game';

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
    const [errors, setErrors] = useState<Record<string, string>>({});
    const request = useRequest();
    const api = useApi();

    const onPurchase = () => {
        if (!reviewType) {
            setErrors({ reviewType: 'This field is required' });
            return;
        }

        setErrors({});
        request.onStart();
        api.requestReview(game.cohort, game.id, reviewType)
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
                                label='Deep Dive - $120 (~60 min, recommended for 1600+)'
                            />
                        </RadioGroup>
                        <FormHelperText>{errors.reviewType}</FormHelperText>
                    </FormControl>

                    <Stack mt={3}>
                        <Typography>Current Queue Length: 13</Typography>
                        <Typography>Estimated Review Date: March 13</Typography>
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
                    <Typography>Current Position in Queue: 13</Typography>
                    <Typography>Estimated Review Date: March 13</Typography>
                </Stack>
            </DialogContent>
        </Dialog>
    );
};

export default RequestReviewDialog;
