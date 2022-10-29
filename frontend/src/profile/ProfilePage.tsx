import { useState } from 'react';
import { Container, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { LoadingButton } from '@mui/lab';

import { useAuth } from '../auth/Auth';
import { dojoCohorts } from '../database/user';
import { useApi } from '../api/Api';
import { RequestSnackbar, RequestStatus, useRequest } from '../api/Request';

const ProfilePage = () => {
    const user = useAuth().user!;
    const api = useApi();

    const [dojoCohort, setDojoCohort] = useState(user.dojoCohort);
    const [discordUsername, setDiscordUsername] = useState(user.discordUsername);
    const [chesscomUsername, setChesscomUsername] = useState(user.chesscomUsername);
    const [lichessUsername, setLichessUsername] = useState(user.lichessUsername);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const request = useRequest();

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

        request.onStart();

        api.updateUser({
            dojoCohort,
            discordUsername,
            chesscomUsername,
            lichessUsername,
        })
            .then(() => {
                request.onSuccess('Profile updated');
            })
            .catch((err) => {
                console.error(err);
                request.onFailure(err);
            });
    };

    const changesMade =
        dojoCohort !== user.dojoCohort ||
        discordUsername !== user.discordUsername ||
        chesscomUsername !== user.chesscomUsername ||
        lichessUsername !== user.lichessUsername;

    return (
        <Container maxWidth='md' sx={{ pt: 6, pb: 4 }}>
            <RequestSnackbar request={request} showSuccess />

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
                    loading={request.status === RequestStatus.Loading}
                    disabled={!changesMade}
                >
                    Save
                </LoadingButton>
            </Stack>
        </Container>
    );
};

export default ProfilePage;
