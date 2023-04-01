import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Alert,
    Button,
    Checkbox,
    Container,
    Divider,
    FormControlLabel,
    MenuItem,
    Stack,
    TextField,
    Typography,
} from '@mui/material';
import { LoadingButton } from '@mui/lab';

import { useAuth } from '../auth/Auth';
import { dojoCohorts, formatRatingSystem, RatingSystem } from '../database/user';
import { useApi } from '../api/Api';
import { RequestSnackbar, RequestStatus, useRequest } from '../api/Request';

interface ProfileEditorPageProps {
    hideCancel?: boolean;
}

const ProfileEditorPage: React.FC<ProfileEditorPageProps> = ({ hideCancel }) => {
    const user = useAuth().user!;
    const api = useApi();
    const navigate = useNavigate();

    const [discordUsername, setDiscordUsername] = useState(user.discordUsername);
    const [dojoCohort, setDojoCohort] = useState(
        user.dojoCohort !== 'NO_COHORT' ? user.dojoCohort : ''
    );
    const [bio, setBio] = useState(user.bio);
    const [ratingSystem, setRatingSystem] = useState(user.ratingSystem);
    const [chesscomUsername, setChesscomUsername] = useState(user.chesscomUsername);
    const [lichessUsername, setLichessUsername] = useState(user.lichessUsername);
    const [fideId, setFideId] = useState(user.fideId);
    const [uscfId, setUscfId] = useState(user.uscfId);

    const [disableBookingNotifications, setDisableBookingNotifications] = useState(
        user.disableBookingNotifications
    );
    const [disableCancellationNotifications, setDisableCancellationNotifications] =
        useState(user.disableCancellationNotifications);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const request = useRequest();

    const onSave = () => {
        const newErrors: Record<string, string> = {};
        if (discordUsername === '') {
            newErrors.discordUsername = 'This field is required';
        }
        if (dojoCohort === '') {
            newErrors.dojoCohort = 'This field is required';
        }
        if ((ratingSystem as string) === '') {
            newErrors.ratingSystem = 'This field is required';
        }
        if (chesscomUsername === '') {
            newErrors.chesscomUsername = 'This field is required';
        }
        if (lichessUsername === '') {
            newErrors.lichessUsername = 'This field is required';
        }
        if (ratingSystem === RatingSystem.Fide && fideId === '') {
            newErrors.fideId = 'This field is required when using FIDE rating system.';
        }
        if (ratingSystem === RatingSystem.Uscf && uscfId === '') {
            newErrors.uscfId = 'This field is required when using USCF rating system.';
        }

        setErrors(newErrors);
        if (Object.entries(newErrors).length > 0) {
            return;
        }

        request.onStart();

        api.updateUser({
            discordUsername,
            dojoCohort,
            bio,
            ratingSystem,
            chesscomUsername,
            lichessUsername,
            fideId,
            uscfId,
            disableBookingNotifications,
            disableCancellationNotifications,
        })
            .then(() => {
                request.onSuccess('Profile updated');
                navigate('..');
            })
            .catch((err) => {
                console.error(err);
                request.onFailure(err);
            });
    };

    const changesMade =
        discordUsername !== user.discordUsername ||
        dojoCohort !== user.dojoCohort ||
        bio !== user.bio ||
        ratingSystem !== user.ratingSystem ||
        chesscomUsername !== user.chesscomUsername ||
        lichessUsername !== user.lichessUsername ||
        fideId !== user.fideId ||
        uscfId !== user.uscfId ||
        disableBookingNotifications !== user.disableBookingNotifications ||
        disableCancellationNotifications !== user.disableCancellationNotifications;

    return (
        <Container maxWidth='md' sx={{ pt: 6, pb: 4 }}>
            <RequestSnackbar request={request} showSuccess />

            {user.dojoCohort !== 'NO_COHORT' &&
                user.dojoCohort !== '' &&
                !dojoCohorts.includes(user.dojoCohort) && (
                    <Alert severity='error' sx={{ mb: 3 }}>
                        Invalid cohort: The dojo is phasing out the 0-400 and 400-600
                        cohorts in favor of more specific cohorts. Please choose a new
                        cohort below.
                    </Alert>
                )}

            <Stack spacing={5}>
                <Stack
                    direction='row'
                    alignItems='center'
                    justifyContent='space-between'
                    flexWrap='wrap'
                    rowGap={2}
                >
                    <Typography variant='h4' mr={2}>
                        Edit Profile
                    </Typography>

                    <Stack direction='row' spacing={2}>
                        <LoadingButton
                            variant='contained'
                            onClick={onSave}
                            loading={request.status === RequestStatus.Loading}
                            disabled={!changesMade}
                        >
                            Save
                        </LoadingButton>

                        {!hideCancel && (
                            <Button
                                variant='contained'
                                color='error'
                                disableElevation
                                onClick={() => navigate('..')}
                            >
                                Cancel
                            </Button>
                        )}
                    </Stack>
                </Stack>

                <Stack spacing={4}>
                    <Stack>
                        <Typography variant='h6'>Personal</Typography>
                        <Divider />
                    </Stack>

                    <TextField
                        required
                        label='Discord Username (with # number)'
                        value={discordUsername}
                        onChange={(event) => setDiscordUsername(event.target.value)}
                        error={!!errors.discordUsername}
                        helperText={errors.discordUsername}
                    />

                    <TextField
                        label='Bio'
                        multiline
                        minRows={3}
                        maxRows={6}
                        value={bio}
                        onChange={(event) => setBio(event.target.value)}
                        error={!!errors.bio}
                        helperText={errors.bio}
                    />
                </Stack>

                <Stack spacing={4}>
                    <Stack>
                        <Typography variant='h6'>Ratings</Typography>
                        <Divider />
                    </Stack>

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
                        select
                        label='Preferred Rating System'
                        value={ratingSystem}
                        onChange={(event) =>
                            setRatingSystem(event.target.value as RatingSystem)
                        }
                        error={!!errors.ratingSystem}
                        helperText={errors.ratingSystem}
                    >
                        {Object.values(RatingSystem).map((option) => (
                            <MenuItem key={option} value={option}>
                                {formatRatingSystem(option)}
                            </MenuItem>
                        ))}
                    </TextField>

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

                    <TextField
                        label='FIDE ID'
                        value={fideId}
                        onChange={(event) => setFideId(event.target.value)}
                        error={!!errors.fideId}
                        helperText={errors.fideId}
                    />

                    <TextField
                        label='USCF ID'
                        value={uscfId}
                        onChange={(event) => setUscfId(event.target.value)}
                        error={!!errors.uscfId}
                        helperText={errors.uscfId}
                    />
                </Stack>

                <Stack spacing={2}>
                    <Stack>
                        <Typography variant='h6'>Notifications</Typography>
                        <Divider />
                    </Stack>

                    <Stack>
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={!disableBookingNotifications}
                                    onChange={(event) =>
                                        setDisableBookingNotifications(
                                            !event.target.checked
                                        )
                                    }
                                />
                            }
                            label='Notify me via a Discord DM when my availability is booked'
                            sx={{ mb: 1.5 }}
                        />

                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={!disableCancellationNotifications}
                                    onChange={(event) =>
                                        setDisableCancellationNotifications(
                                            !event.target.checked
                                        )
                                    }
                                />
                            }
                            label='Notify me via a Discord DM when my meeting is cancelled'
                        />
                    </Stack>
                </Stack>
            </Stack>
        </Container>
    );
};

export default ProfileEditorPage;
