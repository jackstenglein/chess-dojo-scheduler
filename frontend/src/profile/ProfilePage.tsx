import { useState } from 'react';
import { Button, Container, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { LoadingButton } from '@mui/lab';

import { useAuth } from '../auth/Auth';
import { dojoCohorts } from '../database/user';

const ProfilePage = () => {
    const user = useAuth().user!;

    const [dojoCohort, setDojoCohort] = useState(user.dojoCohort);
    const [discordUsername, setDiscordUsername] = useState(user.discordUsername);
    const [chesscomUsername, setChesscomUsername] = useState(user.chesscomUsername);
    const [lichessUsername, setLichessUsername] = useState(user.lichessUsername);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);

    const onSave = () => {
        const newErrors: Record<string, string> = {};
        if (dojoCohort === '') {
            newErrors.dojoCohort = 'This field is required';
        }
        if (discordUsername === '') {
            newErrors.discordUsername = 'This field is required';
        }
        if (chesscomUsername === '') {
            newErrors.chesscomUsername = 'This field is required';
        }
        if (lichessUsername === '') {
            newErrors.lichessUsername = 'This field is required';
        }

        setErrors(newErrors);
        if (Object.entries(newErrors).length > 0) {
            return;
        }

        setLoading(true);
    };

    const changesMade =
        dojoCohort !== user.dojoCohort ||
        discordUsername !== user.discordUsername ||
        chesscomUsername !== user.chesscomUsername ||
        lichessUsername !== user.lichessUsername;

    return (
        <Container maxWidth='md' sx={{ pt: 6, pb: 4 }}>
            <Stack spacing={4}>
                <Typography variant='h4'>Profile</Typography>

                <TextField
                    select
                    label='Chess Dojo Cohort'
                    value={dojoCohort}
                    onChange={(event) => setDojoCohort(event.target.value)}
                    error={!!errors.dojoCohort}
                    helperText={errors.dojoCohort}
                >
                    {dojoCohorts.map((option) => (
                        <MenuItem key={option} value={option}>
                            {option}
                        </MenuItem>
                    ))}
                </TextField>

                <TextField
                    required
                    label='Discord Username (with # number)'
                    value={discordUsername}
                    onChange={(event) => setDiscordUsername(event.target.value)}
                    error={!!errors.discordUsername}
                    helperText={errors.discordUsername}
                />

                <TextField
                    required
                    label='Chess.com Username'
                    value={chesscomUsername}
                    onChange={(event) => setChesscomUsername(event.target.value)}
                    error={!!errors.chesscomUsername}
                    helperText={errors.chesscomUsername}
                />

                <TextField
                    required
                    label='Lichess Username'
                    value={lichessUsername}
                    onChange={(event) => setLichessUsername(event.target.value)}
                    error={!!errors.lichessUsername}
                    helperText={errors.lichessUsername}
                />

                <LoadingButton
                    variant='contained'
                    onClick={onSave}
                    loading={loading}
                    disabled={!changesMade}
                >
                    Save
                </LoadingButton>
            </Stack>
        </Container>
    );
};

export default ProfilePage;
