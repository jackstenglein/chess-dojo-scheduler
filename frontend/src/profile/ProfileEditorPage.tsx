import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Alert,
    Button,
    Checkbox,
    Container,
    Divider,
    FormControlLabel,
    Grid,
    MenuItem,
    Stack,
    TextField,
    Typography,
} from '@mui/material';
import { LoadingButton } from '@mui/lab';

import { useAuth } from '../auth/Auth';
import { dojoCohorts, formatRatingSystem, RatingSystem, User } from '../database/user';
import { useApi } from '../api/Api';
import { RequestSnackbar, RequestStatus, useRequest } from '../api/Request';

function getStartRating(rating: string): number {
    rating = rating.trim();
    if (!rating) {
        return 0;
    }
    rating = rating.replace(/^0+/, '') || '0';
    let n = Math.floor(Number(rating));
    if (n === Infinity) {
        return -1;
    }
    if (String(n) === rating && n >= 0) {
        return n;
    }
    return -1;
}

function getUpdate(user: User, formFields: Partial<User>): Partial<User> | undefined {
    const update: Partial<User> = {};

    for (const [key, value] of Object.entries(formFields)) {
        if ((user as any)[key] !== value) {
            (update as any)[key] = value;
        }
    }

    if (Object.entries(update).length === 0) {
        return undefined;
    }

    return update;
}

interface ProfileEditorPageProps {
    hideCancel?: boolean;
}

const ProfileEditorPage: React.FC<ProfileEditorPageProps> = ({ hideCancel }) => {
    const user = useAuth().user!;
    const api = useApi();
    const navigate = useNavigate();

    const [displayName, setDisplayName] = useState(user.displayName);
    const [discordUsername, setDiscordUsername] = useState(user.discordUsername);
    const [dojoCohort, setDojoCohort] = useState(
        user.dojoCohort !== 'NO_COHORT' ? user.dojoCohort : ''
    );
    const [bio, setBio] = useState(user.bio);

    const [ratingSystem, setRatingSystem] = useState(user.ratingSystem);

    const [chesscomUsername, setChesscomUsername] = useState(user.chesscomUsername);
    const [startChesscomRating, setStartChesscomRating] = useState(
        `${user.startChesscomRating}`
    );
    const [hideChesscomUsername, setHideChesscomUsername] = useState(
        user.hideChesscomUsername
    );

    const [lichessUsername, setLichessUsername] = useState(user.lichessUsername);
    const [startLichessRating, setStartLichessRating] = useState(
        `${user.startLichessRating}`
    );
    const [hideLichessUsername, setHideLichessUsername] = useState(
        user.hideLichessUsername
    );

    const [fideId, setFideId] = useState(user.fideId);
    const [startFideRating, setStartFideRating] = useState(`${user.startFideRating}`);
    const [hideFideId, setHideFideId] = useState(user.hideFideId);

    const [uscfId, setUscfId] = useState(user.uscfId);
    const [startUscfRating, setStartUscfRating] = useState(`${user.startUscfRating}`);
    const [hideUscfId, setHideUscfId] = useState(user.hideUscfId);

    const [ecfId, setEcfId] = useState(user.ecfId);
    const [startEcfRating, setStartEcfRating] = useState(`${user.startEcfRating}`);
    const [hideEcfId, setHideEcfId] = useState(user.hideEcfId);

    const [disableBookingNotifications, setDisableBookingNotifications] = useState(
        user.disableBookingNotifications
    );
    const [disableCancellationNotifications, setDisableCancellationNotifications] =
        useState(user.disableCancellationNotifications);

    const [enableDarkMode, setEnableDarkMode] = useState(user.enableDarkMode);

    const [errors, setErrors] = useState<Record<string, string>>({});
    const request = useRequest();

    const update = getUpdate(user, {
        displayName: displayName.trim(),
        discordUsername: discordUsername.trim(),
        dojoCohort,
        bio,
        ratingSystem,

        chesscomUsername: chesscomUsername.trim(),
        startChesscomRating: getStartRating(startChesscomRating),
        hideChesscomUsername,

        lichessUsername: lichessUsername.trim(),
        startLichessRating: getStartRating(startLichessRating),
        hideLichessUsername,

        fideId: fideId.trim(),
        startFideRating: getStartRating(startFideRating),
        hideFideId,

        uscfId: uscfId.trim(),
        startUscfRating: getStartRating(startUscfRating),
        hideUscfId,

        ecfId: ecfId.trim(),
        startEcfRating: getStartRating(startEcfRating),
        hideEcfId,

        disableBookingNotifications,
        disableCancellationNotifications,

        enableDarkMode,
    });
    const changesMade = update !== undefined;

    const onSave = () => {
        if (update === undefined) {
            return;
        }
        const newErrors: Record<string, string> = {};
        if (!displayName.trim()) {
            newErrors.displayName = 'This field is required';
        }
        if (dojoCohort === '') {
            newErrors.dojoCohort = 'This field is required';
        }
        if ((ratingSystem as string) === '') {
            newErrors.ratingSystem = 'This field is required';
        }

        if (ratingSystem === RatingSystem.Chesscom && !chesscomUsername.trim()) {
            newErrors.chesscomUsername =
                'This field is required when using Chess.com rating system.';
        }
        if (getStartRating(startChesscomRating) < 0) {
            newErrors.startChesscomRating = 'Rating must be an integer >= 0';
        }

        if (ratingSystem === RatingSystem.Lichess && !lichessUsername.trim()) {
            newErrors.lichessUsername =
                'This field is required when using Lichess rating system.';
        }
        if (getStartRating(startLichessRating) < 0) {
            newErrors.startLichessRating = 'Rating must be an integer >= 0';
        }

        if (ratingSystem === RatingSystem.Fide && !fideId.trim()) {
            newErrors.fideId = 'This field is required when using FIDE rating system.';
        }
        if (getStartRating(startFideRating) < 0) {
            newErrors.startFideRating = 'Rating must be an integer >= 0';
        }

        if (ratingSystem === RatingSystem.Uscf && !uscfId.trim()) {
            newErrors.uscfId = 'This field is required when using USCF rating system.';
        }
        if (getStartRating(startUscfRating) < 0) {
            newErrors.startUscfRating = 'Rating must be an integer >= 0';
        }

        if (ratingSystem === RatingSystem.Ecf && !ecfId.trim()) {
            newErrors.ecfId = 'This field is required when using ECF rating system.';
        }
        if (getStartRating(startEcfRating) < 0) {
            newErrors.startEcfRating = 'Rating must be an integer >= 0';
        }

        setErrors(newErrors);
        if (Object.entries(newErrors).length > 0) {
            return;
        }

        request.onStart();

        api.updateUser(update)
            .then(() => {
                request.onSuccess('Profile updated');
                navigate('..');
            })
            .catch((err) => {
                console.error(err);
                request.onFailure(err);
            });
    };

    const ratingSystems = [
        {
            required: ratingSystem === RatingSystem.Chesscom,
            label: 'Chess.com Username',
            hideLabel: 'Hide Username',
            username: chesscomUsername,
            setUsername: setChesscomUsername,
            startRating: startChesscomRating,
            setStartRating: setStartChesscomRating,
            hidden: hideChesscomUsername,
            setHidden: setHideChesscomUsername,
            usernameError: errors.chesscomUsername,
            startRatingError: errors.startChesscomRating,
        },
        {
            required: ratingSystem === RatingSystem.Lichess,
            label: 'Lichess Username',
            hideLabel: 'Hide Username',
            username: lichessUsername,
            setUsername: setLichessUsername,
            startRating: startLichessRating,
            setStartRating: setStartLichessRating,
            hidden: hideLichessUsername,
            setHidden: setHideLichessUsername,
            usernameError: errors.lichessUsername,
            startRatingError: errors.startLichessRating,
        },
        {
            required: ratingSystem === RatingSystem.Fide,
            label: 'FIDE ID',
            hideLabel: 'Hide ID',
            username: fideId,
            setUsername: setFideId,
            startRating: startFideRating,
            setStartRating: setStartFideRating,
            hidden: hideFideId,
            setHidden: setHideFideId,
            usernameError: errors.fideId,
            startRatingError: errors.startFideRating,
        },
        {
            required: ratingSystem === RatingSystem.Uscf,
            label: 'USCF ID',
            hideLabel: 'Hide ID',
            username: uscfId,
            setUsername: setUscfId,
            startRating: startUscfRating,
            setStartRating: setStartUscfRating,
            hidden: hideUscfId,
            setHidden: setHideUscfId,
            usernameError: errors.uscfId,
            startRatingError: errors.startUscfRating,
        },
        {
            required: ratingSystem === RatingSystem.Ecf,
            label: 'ECF Rating Code',
            hideLabel: 'Hide Rating Code',
            username: ecfId,
            setUsername: setEcfId,
            startRating: startEcfRating,
            setStartRating: setStartEcfRating,
            hidden: hideEcfId,
            setHidden: setHideEcfId,
            usernameError: errors.ecfId,
            startRatingError: errors.startEcfRating,
        },
    ];

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
                        label='Display Name'
                        value={displayName}
                        onChange={(event) => setDisplayName(event.target.value)}
                        error={!!errors.displayName}
                        helperText={
                            errors.displayName ||
                            'This is how other users will identify you'
                        }
                    />

                    <TextField
                        label='Discord Username (with # number)'
                        value={discordUsername}
                        onChange={(event) => setDiscordUsername(event.target.value)}
                        error={!!errors.discordUsername}
                        helperText={errors.discordUsername || 'username#id'}
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
                        required
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

                    {ratingSystems.map((rs) => (
                        <Grid key={rs.label} container columnGap={2} alignItems='center'>
                            <Grid item xs>
                                <TextField
                                    required={rs.required}
                                    label={rs.label}
                                    value={rs.username}
                                    onChange={(event) =>
                                        rs.setUsername(event.target.value)
                                    }
                                    error={!!rs.usernameError}
                                    helperText={
                                        rs.usernameError ||
                                        "Leave blank if you don't have an account"
                                    }
                                    sx={{ width: 1 }}
                                />
                            </Grid>

                            <Grid item xs>
                                <TextField
                                    label='Start Rating'
                                    value={rs.startRating}
                                    onChange={(event) =>
                                        rs.setStartRating(event.target.value)
                                    }
                                    error={!!rs.startRatingError}
                                    helperText={
                                        rs.startRatingError ||
                                        "Leave blank if you don't have an account"
                                    }
                                    sx={{ width: 1 }}
                                />
                            </Grid>

                            <Grid item xs>
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            checked={rs.hidden}
                                            onChange={(event) =>
                                                rs.setHidden(event.target.checked)
                                            }
                                        />
                                    }
                                    label={rs.hideLabel}
                                />
                            </Grid>
                        </Grid>
                    ))}
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

                <Stack spacing={2}>
                    <Stack>
                        <Typography variant='h6'>UI</Typography>
                        <Divider />
                    </Stack>

                    <Stack>
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={enableDarkMode}
                                    onChange={(event) =>
                                        setEnableDarkMode(event.target.checked)
                                    }
                                />
                            }
                            label='Enable Dark Mode (Warning: experimental, some UI elements may be hard to view)'
                            sx={{ mb: 1.5 }}
                        />
                    </Stack>
                </Stack>
            </Stack>
        </Container>
    );
};

export default ProfileEditorPage;
