import { useApi } from '@/api/Api';
import { RequestSnackbar, useRequest } from '@/api/Request';
import { User } from '@/database/user';
import { RoundRobin } from '@jackstenglein/chess-dojo-common/src/roundRobin/api';
import { LoadingButton } from '@mui/lab';
import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    TextField,
} from '@mui/material';
import { useState } from 'react';

interface GameModalProps {
    cohort: string;
    startsAt: string;
    open: boolean;
    onClose: () => void;
    user: User | undefined;
    onUpdateTournaments: (props: {
        waitlist?: RoundRobin;
        tournament?: RoundRobin;
    }) => void;
}

export function GameModal({
    cohort,
    startsAt,
    open,
    onClose,
    user,
    onUpdateTournaments,
}: GameModalProps) {
    const [gameUrl, setGameUrl] = useState('');
    const [errors, setErrors] = useState<Record<string, string>>({});
    const request = useRequest<string>();
    const api = useApi();

    if (!user) {
        return null;
    }

    const handleSubmit = async () => {
        if (gameUrl.trim() === '') {
            setErrors({ gameUrl: 'This field is required ' });
            return;
        }
        setErrors({});

        try {
            request.onStart();
            const resp = await api.submitRoundRobinGame({
                cohort,
                startsAt,
                url: gameUrl,
            });
            onUpdateTournaments({ tournament: resp.data });
            request.onSuccess('Game submitted');
            onClose();
        } catch (err) {
            console.error('submitRoundRobinGame: ', err);
            request.onFailure(err);
        }
    };

    const handleClose = () => {
        onClose();
    };

    return (
        <>
            <Dialog open={open} onClose={handleClose}>
                <DialogTitle>Submit Round Robin Game</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Input your Lichess or Chess.com game URL.
                    </DialogContentText>
                    <TextField
                        fullWidth
                        label='Game URL'
                        value={gameUrl}
                        onChange={(e) => setGameUrl(e.target.value)}
                        error={!!errors.gameUrl}
                        helperText={errors.gameUrl}
                    />
                </DialogContent>
                <DialogActions>
                    <Button disabled={request.isLoading()} onClick={onClose}>
                        Cancel
                    </Button>
                    <LoadingButton loading={request.isLoading()} onClick={handleSubmit}>
                        Submit
                    </LoadingButton>
                </DialogActions>
            </Dialog>

            <RequestSnackbar request={request} showSuccess />
        </>
    );
}

export default GameModal;
