import { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
    Alert,
    Button,
    Checkbox,
    Container,
    Divider,
    FormControlLabel,
    FormLabel,
    Grid,
    Link,
    MenuItem,
    Stack,
    TextField,
    Typography,
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import UploadIcon from '@mui/icons-material/Upload';
import DeleteIcon from '@mui/icons-material/Delete';

import { useAuth } from '../../auth/Auth';
import {
    dojoCohorts,
    formatRatingSystem,
    Rating,
    RatingSystem,
    User,
} from '../../database/user';
import { useApi } from '../../api/Api';
import { RequestSnackbar, RequestStatus, useRequest } from '../../api/Request';
import { DefaultTimezone } from '../../calendar/filters/CalendarFilters';
import { EventType, setUserCohort, trackEvent } from '../../analytics/events';
import Avatar from '../Avatar';
import { useCache } from '../../api/cache/Cache';
import NotificationSettingsEditor from './NotificationSettingsEditor';
import SubscriptionManager from './SubscriptionManager';

const MAX_PROFILE_PICTURE_SIZE_MB = 9;

type UserUpdate = Partial<User & { profilePictureData: string }>;

const ratingSystemForms = [
    {
        system: RatingSystem.Chesscom,
        label: 'Chess.com Username',
        hideLabel: 'Hide Username',
    },
    {
        system: RatingSystem.Lichess,
        label: 'Lichess Username',
        hideLabel: 'Hide Username',
    },
    {
        system: RatingSystem.Fide,
        label: 'FIDE ID',
        hideLabel: 'Hide ID',
    },
    {
        system: RatingSystem.Uscf,
        label: 'USCF ID',
        hideLabel: 'Hide ID',
    },
    {
        system: RatingSystem.Ecf,
        label: 'ECF Rating Code',
        hideLabel: 'Hide Rating Code',
    },
    {
        system: RatingSystem.Cfc,
        label: 'CFC ID',
        hideLabel: 'Hide ID',
    },
    {
        system: RatingSystem.Dwz,
        label: 'DWZ ID',
        hideLabel: 'Hide ID',
    },
    {
        system: RatingSystem.Acf,
        label: 'ACF ID',
        hideLabel: 'Hide ID',
    },
];

interface RatingEditor {
    username: string;
    hideUsername: boolean;
    startRating: string;
    currentRating: string;
}

function getRatingEditors(ratings: Partial<Record<RatingSystem, Rating>>) {
    const ratingEditors: Record<RatingSystem, RatingEditor> = Object.values(
        RatingSystem
    ).reduce((m, rs) => {
        m[rs] = {
            username: ratings[rs]?.username || '',
            hideUsername: ratings[rs]?.hideUsername || false,
            startRating: `${ratings[rs]?.startRating || 0}`,
            currentRating: `${ratings[rs]?.currentRating || 0}`,
        };
        return m;
    }, {} as Record<RatingSystem, RatingEditor>);
    return ratingEditors;
}

function getRatingsFromEditors(ratingEditors: Record<RatingSystem, RatingEditor>) {
    const ratings: Record<RatingSystem, Rating> = Object.values(RatingSystem).reduce(
        (m, rs) => {
            m[rs] = {
                username: ratingEditors[rs].username || '',
                hideUsername: ratingEditors[rs].hideUsername || false,
                startRating: parseRating(ratingEditors[rs].startRating),
                currentRating: parseRating(ratingEditors[rs].currentRating),
            };
            return m;
        },
        {} as Record<RatingSystem, Rating>
    );
    return ratings;
}

function parseRating(rating: string | undefined): number {
    if (!rating) {
        return 0;
    }

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

function getUpdate(
    user: User,
    formFields: Partial<User>,
    profilePictureData?: string
): Partial<UserUpdate> | undefined {
    const update: Partial<UserUpdate> = {};

    for (const [key, value] of Object.entries(formFields)) {
        if ((user as any)[key] !== value) {
            (update as any)[key] = value;
        }
    }

    if (profilePictureData !== undefined) {
        update.profilePictureData = profilePictureData;
    }

    if (Object.entries(update).length === 0) {
        return undefined;
    }

    return update;
}

function getTimezoneOptions() {
    const options = [];
    for (let i = -12; i <= 14; i++) {
        const displayLabel = i < 0 ? `UTC${i}` : `UTC+${i}`;
        const value = i <= 0 ? `Etc/GMT+${Math.abs(i)}` : `Etc/GMT-${i}`;
        options.push(
            <MenuItem key={i} value={value}>
                {displayLabel}
            </MenuItem>
        );
    }
    return options;
}

function encodeFileToBase64(file: File): Promise<string> {
    return new Promise<string>((resolve, reject) => {
        let reader = new FileReader();
        reader.onloadend = function () {
            const base64string = reader.result as string;
            console.log('Base 64 string: ', base64string);
            const encodedString = base64string.split(',')[1];
            resolve(encodedString);
        };
        reader.onerror = () => {
            reject(new Error('Failed to read the file.'));
        };
        reader.readAsDataURL(file);
    });
}

const ProfileEditorPage = () => {
    const user = useAuth().user!;
    const api = useApi();
    const navigate = useNavigate();
    const { setImageBypass } = useCache();

    const [displayName, setDisplayName] = useState(user.displayName);
    const [discordUsername, setDiscordUsername] = useState(user.discordUsername);
    const [dojoCohort, setDojoCohort] = useState(
        user.dojoCohort !== 'NO_COHORT' ? user.dojoCohort : ''
    );
    const [bio, setBio] = useState(user.bio);
    const [timezone, setTimezone] = useState(
        user.timezoneOverride === DefaultTimezone ? '' : user.timezoneOverride
    );

    const [ratingSystem, setRatingSystem] = useState(user.ratingSystem);
    const [ratingEditors, setRatingEditors] = useState(getRatingEditors(user.ratings));

    const setUsername = (ratingSystem: RatingSystem, username: string) => {
        setRatingEditors({
            ...ratingEditors,
            [ratingSystem]: {
                ...ratingEditors[ratingSystem],
                username,
            },
        });
    };

    const setCurrentRating = (ratingSystem: RatingSystem, value: string) => {
        setRatingEditors({
            ...ratingEditors,
            [ratingSystem]: {
                ...ratingEditors[ratingSystem],
                currentRating: value,
            },
        });
    };

    const setStartRating = (ratingSystem: RatingSystem, value: string) => {
        setRatingEditors({
            ...ratingEditors,
            [ratingSystem]: {
                ...ratingEditors[ratingSystem],
                startRating: value,
            },
        });
    };

    const setHidden = (ratingSystem: RatingSystem, value: boolean) => {
        setRatingEditors({
            ...ratingEditors,
            [ratingSystem]: {
                ...ratingEditors[ratingSystem],
                hideUsername: value,
            },
        });
    };

    const [notificationSettings, setNotificationSettings] = useState(
        user.notificationSettings
    );

    const [enableLightMode, setEnableLightMode] = useState(user.enableLightMode);

    const [profilePictureUrl, setProfilePictureUrl] = useState<string>();
    const [profilePictureData, setProfilePictureData] = useState<string>();

    const [errors, setErrors] = useState<Record<string, string>>({});
    const request = useRequest();

    const onChangeProfilePicture = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length) {
            if (files[0].size / 1024 / 1024 > MAX_PROFILE_PICTURE_SIZE_MB) {
                request.onFailure({ message: 'Profile picture must be 9MB or smaller' });
                return;
            }

            encodeFileToBase64(files[0])
                .then((encoded) => {
                    setProfilePictureData(encoded);
                    setProfilePictureUrl(URL.createObjectURL(files[0]));
                })
                .catch((err) => {
                    console.log(err);
                    request.onFailure(err);
                });
        }
    };

    const onDeleteProfilePicture = () => {
        setProfilePictureUrl('');
        setProfilePictureData('');
    };

    const update = getUpdate(
        user,
        {
            displayName: displayName.trim(),
            discordUsername: discordUsername.trim(),
            dojoCohort,
            bio,
            timezoneOverride: timezone === '' ? user.timezoneOverride : timezone,
            ratingSystem,
            ratings: getRatingsFromEditors(ratingEditors),

            notificationSettings,

            enableLightMode,
        },
        profilePictureData
    );
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

        if (
            ratingSystem !== RatingSystem.Custom &&
            !ratingEditors[ratingSystem]?.username.trim()
        ) {
            newErrors[
                `${ratingSystem}Username`
            ] = `This field is required when using ${formatRatingSystem(
                ratingSystem
            )} rating system.`;
        }

        for (const rs of Object.keys(ratingEditors)) {
            if (parseRating(ratingEditors[rs as RatingSystem]?.startRating) < 0) {
                newErrors[`${rs}StartRating`] = 'Rating must be an integer >= 0';
            }
        }

        if (ratingSystem === RatingSystem.Custom) {
            if (parseRating(ratingEditors[RatingSystem.Custom]?.currentRating) <= 0) {
                newErrors.currentCustomRating =
                    'This field is required when using Custom rating system.';
            }
            if (parseRating(ratingEditors[RatingSystem.Custom]?.startRating) <= 0) {
                newErrors.startCustomRating =
                    'This field is required when using Custom rating system.';
            }
        }

        setErrors(newErrors);
        if (Object.entries(newErrors).length > 0) {
            console.log('New Errors: ', newErrors);
            return;
        }

        request.onStart();

        api.updateUser(update)
            .then(() => {
                request.onSuccess('Profile updated');
                trackEvent(EventType.EditProfile, {
                    fields: Object.keys(update),
                });
                setUserCohort(update.dojoCohort);

                if (update.profilePictureData !== undefined) {
                    setImageBypass(Date.now());
                }
                navigate('..');
            })
            .catch((err) => {
                console.error(err);
                request.onFailure(err);
            });
    };

    const ratingSystems = ratingSystemForms.map((rsf) => ({
        required: ratingSystem === rsf.system,
        label: rsf.label,
        hideLabel: rsf.hideLabel,
        username: ratingEditors[rsf.system]?.username,
        setUsername: (value: string) => setUsername(rsf.system, value),
        startRating: ratingEditors[rsf.system]?.startRating,
        setStartRating: (value: string) => setStartRating(rsf.system, value),
        hidden: ratingEditors[rsf.system]?.hideUsername,
        setHidden: (value: boolean) => setHidden(rsf.system, value),
        usernameError: errors[`${rsf.system}Username`],
        startRatingError: errors[`${rsf.system}StartRating`],
    }));

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
                        Edit Settings
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

                        <Button
                            variant='contained'
                            color='error'
                            disableElevation
                            onClick={() => navigate('..')}
                        >
                            Cancel
                        </Button>
                    </Stack>
                </Stack>

                {Object.values(errors).length > 0 && (
                    <Alert severity='error' sx={{ mb: 3 }}>
                        Unable to save profile. Fix the errors below and retry.
                    </Alert>
                )}

                <Stack spacing={4}>
                    <Stack>
                        <Typography variant='h5'>Personal</Typography>
                        <Divider />
                    </Stack>

                    <Stack>
                        <FormLabel sx={{ mb: 1 }}>Profile Picture</FormLabel>
                        <Stack direction='row' alignItems='center' spacing={3}>
                            <Avatar user={user} size={150} url={profilePictureUrl} />
                            <Stack spacing={2} alignItems='start'>
                                <Button
                                    component='label'
                                    variant='outlined'
                                    startIcon={<UploadIcon />}
                                >
                                    Upload Photo
                                    <input
                                        type='file'
                                        accept='image/*'
                                        hidden
                                        onChange={onChangeProfilePicture}
                                    />
                                </Button>
                                <Button
                                    variant='outlined'
                                    startIcon={<DeleteIcon />}
                                    onClick={onDeleteProfilePicture}
                                >
                                    Delete Photo
                                </Button>
                            </Stack>
                        </Stack>
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
                        label='Discord Username'
                        value={discordUsername}
                        onChange={(event) => setDiscordUsername(event.target.value)}
                        error={!!errors.discordUsername}
                        helperText={
                            errors.discordUsername ||
                            'Format as username#id for older-style Discord usernames'
                        }
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

                    <TextField
                        select
                        label='Timezone'
                        value={timezone}
                        onChange={(e) => setTimezone(e.target.value)}
                    >
                        {getTimezoneOptions()}
                    </TextField>
                </Stack>

                <Stack spacing={4}>
                    <Stack>
                        <Typography variant='h5'>Ratings</Typography>
                        <Divider />
                    </Stack>

                    <TextField
                        required
                        select
                        label='ChessDojo Cohort'
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
                                        rs.usernameError || rs.label === 'DWZ ID' ? (
                                            <>
                                                Learn how to find your DWZ ID{' '}
                                                <Link
                                                    component={RouterLink}
                                                    to='/help#How%20do%20I%20find%20my%20DWZ%20ID?'
                                                >
                                                    here
                                                </Link>
                                            </>
                                        ) : (
                                            "Leave blank if you don't have an account"
                                        )
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
                                        'Your rating when you first joined the Dojo'
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

                    <Grid container columnGap={2} alignItems='center'>
                        <Grid item xs>
                            <TextField
                                required={ratingSystem === RatingSystem.Custom}
                                label='Current Rating (Custom)'
                                value={ratingEditors[RatingSystem.Custom]?.currentRating}
                                onChange={(event) =>
                                    setCurrentRating(
                                        RatingSystem.Custom,
                                        event.target.value
                                    )
                                }
                                error={!!errors.currentCustomRating}
                                helperText={
                                    errors.currentCustomRating ||
                                    'Fill in if you want to manually track your rating'
                                }
                                sx={{ width: 1 }}
                            />
                        </Grid>

                        <Grid item xs>
                            <TextField
                                required={ratingSystem === RatingSystem.Custom}
                                label='Start Rating (Custom)'
                                value={ratingEditors[RatingSystem.Custom]?.startRating}
                                onChange={(event) =>
                                    setStartRating(
                                        RatingSystem.Custom,
                                        event.target.value
                                    )
                                }
                                error={!!errors.startCustomRating}
                                helperText={
                                    errors.startCustomRating ||
                                    'Your rating when you first joined the Dojo'
                                }
                                sx={{ width: 1 }}
                            />
                        </Grid>
                    </Grid>
                </Stack>

                <NotificationSettingsEditor
                    notificationSettings={notificationSettings}
                    setNotificationSettings={setNotificationSettings}
                />

                <Stack spacing={2}>
                    <Stack>
                        <Typography variant='h5'>UI</Typography>
                        <Divider />
                    </Stack>

                    <Stack>
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={enableLightMode}
                                    onChange={(event) =>
                                        setEnableLightMode(event.target.checked)
                                    }
                                />
                            }
                            label='Enable Light Mode (Warning: experimental, some UI elements may be hard to view)'
                            sx={{ mb: 1.5 }}
                        />
                    </Stack>
                </Stack>

                <SubscriptionManager user={user} />
            </Stack>
        </Container>
    );
};

export default ProfileEditorPage;
