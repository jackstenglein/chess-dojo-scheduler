import { useState } from 'react';
import axios from 'axios';
import {
    Checkbox,
    Container,
    FormControlLabel,
    MenuItem,
    Stack,
    TextField,
    Typography,
} from '@mui/material';
import { LoadingButton } from '@mui/lab';

import { AuthStatus, useAuth } from '../../auth/Auth';
import LoadingPage from '../../loading/LoadingPage';
import { useRequest } from '../../api/Request';

const SubmitResultsPage = () => {
    const auth = useAuth();
    const user = auth.user;

    const [email, setEmail] = useState('');
    const [section, setSection] = useState('');
    const [round, setRound] = useState('');
    const [gameUrl, setGameUrl] = useState('');
    const [white, setWhite] = useState('');
    const [black, setBlack] = useState('');
    const [result, setResult] = useState('');
    const [reportOpponent, setReportOpponent] = useState(false);
    const [notes, setNotes] = useState('');

    const [errors, setErrors] = useState<Record<string, string>>({});
    const request = useRequest();

    if (auth.status === AuthStatus.Loading) {
        return <LoadingPage />;
    }

    const onBlurGameUrl = () => {
        if (!gameUrl.startsWith('https://lichess.org/')) {
            setErrors({
                ...errors,
                gameUrl: '',
            });
            return;
        }
        const gameId = gameUrl.replace('https://lichess.org/', '');

        axios
            .get(`https://lichess.org/api/game/${gameId}`)
            .then((resp) => {
                console.log('Lichess Game Resp: ', resp);
                setWhite(resp.data.players.white.userId);
                setBlack(resp.data.players.black.userId);
                const status = resp.data.status;
                if (status === 'stalemate' || status === 'draw') {
                    setResult('1/2-1/2');
                } else if (resp.data.winner === 'white') {
                    setResult('1-0');
                } else if (resp.data.winner === 'black') {
                    setResult('0-1');
                }
            })
            .catch((err) => {
                console.error(err);
                setErrors({
                    ...errors,
                    gameUrl:
                        'Unable to fetch results from Lichess. Please ensure this is the correct URL before submitting.',
                });
            });
    };

    const onSubmit = () => {
        const newErrors: Record<string, string> = {};

        if (!user && email.trim() === '') {
            newErrors.email = 'This field is required';
        }
        if (section.trim() === '') {
            newErrors.section = 'This field is required';
        }
        if (round.trim() === '') {
            newErrors.round = 'This field is required';
        }
        if (result !== '0-0' && gameUrl.trim() === '') {
            newErrors.gameUrl = 'This field is required';
        }
        if (white.trim() === '') {
            newErrors.white = 'This field is required';
        }
        if (black.trim() === '') {
            newErrors.black = 'This field is required';
        }
        if (result.trim() === '') {
            newErrors.result = 'This field is required';
        }

        setErrors(newErrors);
        if (Object.entries(newErrors).length > 0) {
            return;
        }

        request.onStart();
    };

    return (
        <Container maxWidth='md' sx={{ py: 5 }}>
            <Stack spacing={4}>
                <Typography variant='h6'>
                    Submit Results for the Open Classical
                </Typography>

                {!user && (
                    <TextField
                        label='Email'
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        error={Boolean(errors.email)}
                        helperText={errors.email}
                    />
                )}

                <TextField
                    label='Section'
                    select
                    required
                    value={section}
                    onChange={(e) => setSection(e.target.value)}
                    error={Boolean(errors.section)}
                    helperText={errors.section}
                >
                    <MenuItem value='A'>Section A (Americas)</MenuItem>
                    <MenuItem value='B'>Section B (Eurasia/Africa/Oceania)</MenuItem>
                </TextField>

                <TextField
                    label='Round'
                    select
                    required
                    value={round}
                    onChange={(e) => setRound(e.target.value)}
                    error={Boolean(errors.round)}
                    helperText={errors.round}
                >
                    {Array.from(Array(7)).map((_, i) => (
                        <MenuItem key={i} value={`${i + 1}`}>
                            {i + 1}
                        </MenuItem>
                    ))}
                </TextField>

                <TextField
                    label='Game URL'
                    value={gameUrl}
                    onChange={(e) => setGameUrl(e.target.value)}
                    onBlur={onBlurGameUrl}
                    error={Boolean(errors.gameUrl)}
                    helperText={errors.gameUrl}
                />

                <TextField
                    label='White'
                    required
                    value={white}
                    onChange={(e) => setWhite(e.target.value)}
                    error={Boolean(errors.white)}
                    helperText={errors.white}
                />
                <TextField
                    label='Black'
                    required
                    value={black}
                    onChange={(e) => setBlack(e.target.value)}
                    error={Boolean(errors.black)}
                    helperText={errors.black}
                />

                <TextField
                    label='Result'
                    select
                    required
                    value={result}
                    onChange={(e) => setResult(e.target.value)}
                    error={Boolean(errors.result)}
                    helperText={errors.result}
                >
                    <MenuItem value='1-0'>White Wins (1-0)</MenuItem>
                    <MenuItem value='0-1'>Black Wins (0-1)</MenuItem>
                    <MenuItem value='1/2-1/2'>Draw (1/2-1/2)</MenuItem>
                    <MenuItem value='0-0'>Did Not Play (0-0)</MenuItem>
                </TextField>

                {result === '0-0' && (
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={reportOpponent}
                                onChange={(event) =>
                                    setReportOpponent(event.target.checked)
                                }
                            />
                        }
                        label='Report opponent for unresponsiveness or unwillingness to schedule?'
                    />
                )}

                <TextField
                    label='Notes'
                    multiline
                    minRows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                />

                <LoadingButton
                    variant='contained'
                    loading={request.isLoading()}
                    onClick={onSubmit}
                    sx={{ alignSelf: 'center' }}
                >
                    Submit
                </LoadingButton>
            </Stack>
        </Container>
    );
};

export default SubmitResultsPage;
