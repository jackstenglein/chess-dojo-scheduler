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
    InputAdornment,
    TextField,
} from '@mui/material';
import { useState } from 'react';
import { SiChessdotcom, SiDiscord, SiLichess } from 'react-icons/si';

interface RegisterModalProps {
    cohort: string;
    open: boolean;
    onClose: () => void;
    user: User | undefined;
    onUpdateTournaments: (props: {
        waitlist?: RoundRobin;
        tournament?: RoundRobin;
    }) => void;
}

export function RegisterModal({
    cohort,
    open,
    onClose,
    user,
    onUpdateTournaments,
}: RegisterModalProps) {
    const [lichessUsername, setLichessUsername] = useState(
        user?.ratings.LICHESS?.username || '',
    );
    const [chesscomUsername, setChesscomUsername] = useState(
        user?.ratings.CHESSCOM?.username || '',
    );
    const [discordUsername, setDiscordUsername] = useState(user?.discordUsername || '');
    const [errors, setErrors] = useState<Record<string, string>>({});

    const request = useRequest<string>();
    const api = useApi();

    if (!user) {
        return null;
    }

    const handleSubmit = async () => {
        const newErrors: Record<string, string> = {};
        if (lichessUsername.trim() === '') {
            newErrors.lichessUsername = 'This field is required';
        }
        if (chesscomUsername.trim() === '') {
            newErrors.chesscomUsername = 'This field is required';
        }
        setErrors(newErrors);
        if (Object.keys(newErrors).length > 0) {
            return;
        }

        request.onStart();
        try {
            const resp = await api.registerForRoundRobin({
                cohort,
                displayName: user.displayName,
                lichessUsername,
                chesscomUsername,
                discordUsername,
            });
            console.log('registerForRoundRobin: ', resp);
            request.onSuccess('Successfully registered for the tournament');
            onUpdateTournaments({
                waitlist: resp.data.waitlist as RoundRobin,
                tournament: resp.data.tournament,
            });
            onClose();
        } catch (err) {
            console.error('registerForRoundRobin: ', err);
            request.onFailure(err);
        }
    };

    return (
        <>
            <Dialog open={open} onClose={request.isLoading() ? undefined : onClose}>
                <DialogTitle>Register for the Round Robin?</DialogTitle>
                <DialogContent>
                    <DialogContentText sx={{ mb: 1 }}>
                        To prevent cheating, all games in the tournament must be played
                        using either the Lichess or Chess.com accounts entered here.
                    </DialogContentText>

                    <TextField
                        fullWidth
                        margin='normal'
                        label='Lichess Username'
                        disabled={!!user.ratings.LICHESS?.username}
                        value={lichessUsername}
                        onChange={(e) => setLichessUsername(e.target.value)}
                        slotProps={{
                            input: {
                                startAdornment: (
                                    <InputAdornment position='start'>
                                        <SiLichess fontSize={25} />
                                    </InputAdornment>
                                ),
                            },
                        }}
                        error={!!errors.lichessUsername}
                        helperText={errors.lichessUsername}
                    />

                    <TextField
                        fullWidth
                        margin='normal'
                        label='Chess.com Username'
                        disabled={!!user.ratings.CHESSCOM?.username}
                        value={chesscomUsername}
                        onChange={(e) => setChesscomUsername(e.target.value)}
                        slotProps={{
                            input: {
                                startAdornment: (
                                    <InputAdornment position='start'>
                                        <SiChessdotcom
                                            fontSize={25}
                                            style={{ color: '#81b64c' }}
                                        />
                                    </InputAdornment>
                                ),
                            },
                        }}
                        error={!!errors.chesscomUsername}
                        helperText={errors.chesscomUsername}
                    />

                    <TextField
                        fullWidth
                        margin='normal'
                        label='Discord Name'
                        value={discordUsername}
                        onChange={(e) => setDiscordUsername(e.target.value)}
                        slotProps={{
                            input: {
                                startAdornment: (
                                    <InputAdornment position='start'>
                                        <SiDiscord
                                            fontSize={25}
                                            style={{ color: '#5865f2' }}
                                        />
                                    </InputAdornment>
                                ),
                            },
                        }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button disabled={request.isLoading()} onClick={onClose}>
                        Cancel
                    </Button>
                    <LoadingButton loading={request.isLoading()} onClick={handleSubmit}>
                        Register
                    </LoadingButton>
                </DialogActions>
            </Dialog>
            <RequestSnackbar request={request} showSuccess />
        </>
    );
}
