import { dojoCohorts, formatRatingSystem, RatingSystem } from '@/database/user';
import { Timeline } from '@mui/icons-material';
import {
    Checkbox,
    Divider,
    FormControlLabel,
    Grid,
    Link,
    MenuItem,
    Stack,
    TextField,
    Typography,
} from '@mui/material';

export interface RatingEditor {
    username: string;
    hideUsername: boolean;
    startRating: string;
    currentRating: string;
    name: string;
}

interface RatingsEditorProps {
    /** The cohort the user has selected in the profile editor. */
    dojoCohort: string;
    /** A callback function to set the cohort in the profile editor. */
    setDojoCohort: (dojoCohort: string) => void;
    /** The rating system the user has selected as their preferred system in the profile editor. */
    ratingSystem: RatingSystem;
    /** A callback function to set the preferred rating system. */
    setRatingSystem: (ratingSystem: RatingSystem) => void;
    /** The rating system information as currently set in the profile editor. */
    ratingEditors: Record<RatingSystem, RatingEditor>;
    /** A callback to set the rating editor information. */
    setRatingEditors: (ratingEditors: Record<RatingSystem, RatingEditor>) => void;
    /** Whether zen mode is enabled in the profile editor. */
    enableZenMode: boolean;
    /** A callback to set whether zen mode is enabled. */
    setEnableZenMode: (enabled: boolean) => void;
    /** The errors in the profile editor. */
    errors: Record<string, string>;
}

export function RatingsEditor({
    dojoCohort,
    setDojoCohort,
    ratingSystem,
    setRatingSystem,
    ratingEditors,
    setRatingEditors,
    enableZenMode,
    setEnableZenMode,
    errors,
}: RatingsEditorProps) {
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

    const setRatingName = (ratingSystem: RatingSystem, value: string) => {
        setRatingEditors({
            ...ratingEditors,
            [ratingSystem]: {
                ...ratingEditors[ratingSystem],
                name: value,
            },
        });
    };

    const ratingSystems = RATING_SYSTEM_FORMS.map((rsf) => ({
        required: ratingSystem === rsf.system,
        label: rsf.label,
        hideLabel: rsf.hideLabel,
        username: ratingEditors[rsf.system].username,
        setUsername: (value: string) => setUsername(rsf.system, value),
        startRating: ratingEditors[rsf.system].startRating,
        setStartRating: (value: string) => setStartRating(rsf.system, value),
        hidden: ratingEditors[rsf.system].hideUsername,
        setHidden: (value: boolean) => setHidden(rsf.system, value),
        usernameError: errors[`${rsf.system}Username`],
        startRatingError: errors[`${rsf.system}StartRating`],
    }));

    return (
        <Stack spacing={4}>
            <Stack
                id='ratings'
                sx={{
                    scrollMarginTop: 'calc(var(--navbar-height) + 8px)',
                }}
            >
                <Typography variant='h5'>
                    <Timeline
                        style={{
                            verticalAlign: 'middle',
                            marginRight: '0.1em',
                        }}
                    />{' '}
                    Ratings
                </Typography>
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
                onChange={(event) => setRatingSystem(event.target.value as RatingSystem)}
                error={!!errors.ratingSystem}
                helperText={errors.ratingSystem}
            >
                {Object.values(RatingSystem).map((option) => (
                    <MenuItem key={option} value={option}>
                        {formatRatingSystem(option)}
                        {option === RatingSystem.Custom2 && ' (2)'}
                        {option === RatingSystem.Custom3 && ' (3)'}
                    </MenuItem>
                ))}
            </TextField>

            {ratingSystems.map((rs) => (
                <Grid key={rs.label} container columnGap={2} alignItems='start'>
                    <Grid size='grow'>
                        <TextField
                            required={rs.required}
                            label={rs.label}
                            value={rs.username}
                            onChange={(event) => rs.setUsername(event.target.value)}
                            error={!!rs.usernameError}
                            helperText={
                                rs.usernameError || rs.label === 'DWZ ID' ? (
                                    <>
                                        Learn how to find your DWZ ID{' '}
                                        <Link href='/help#How%20do%20I%20find%20my%20DWZ%20ID?'>
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

                    <Grid size='grow'>
                        <TextField
                            label='Start Rating'
                            value={rs.startRating}
                            onChange={(event) => rs.setStartRating(event.target.value)}
                            error={!!rs.startRatingError}
                            helperText={
                                rs.startRatingError || 'Your rating when you first joined the Dojo'
                            }
                            sx={{ width: 1 }}
                        />
                    </Grid>

                    <Grid size='grow'>
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={rs.hidden}
                                    onChange={(event) => rs.setHidden(event.target.checked)}
                                />
                            }
                            label={rs.hideLabel}
                        />
                    </Grid>
                </Grid>
            ))}

            {CUSTOM_RATING_SYSTEMS.map((rs, idx) => (
                <Grid key={rs} container columnGap={2} alignItems='start'>
                    <Grid size='grow'>
                        <TextField
                            label={`Custom ${idx + 1} Rating Name`}
                            value={ratingEditors[rs].name}
                            onChange={(event) => setRatingName(rs, event.target.value)}
                            sx={{ width: 1 }}
                            error={!!errors[`${rs}Name`]}
                            helperText={errors[`${rs}Name`] || 'Manually track your rating'}
                        />
                    </Grid>

                    <Grid size='grow'>
                        <TextField
                            required={ratingSystem === rs}
                            label='Current Rating'
                            value={ratingEditors[rs].currentRating}
                            onChange={(event) => setCurrentRating(rs, event.target.value)}
                            error={!!errors[`${rs}CurrentRating`]}
                            helperText={
                                errors[`${rs}CurrentRating`] || 'Your most up to date rating'
                            }
                            sx={{ width: 1 }}
                        />
                    </Grid>

                    <Grid size='grow'>
                        <TextField
                            required={ratingSystem === rs}
                            label='Start Rating'
                            value={ratingEditors[rs].startRating}
                            onChange={(event) => setStartRating(rs, event.target.value)}
                            error={!!errors[`${rs}StartRating`]}
                            helperText={
                                errors[`${rs}StartRating`] ||
                                'Your rating when you first joined the Dojo'
                            }
                            sx={{ width: 1 }}
                        />
                    </Grid>
                </Grid>
            ))}

            <FormControlLabel
                label='Enable Zen Mode (hide ratings when viewing your own profile)'
                control={
                    <Checkbox
                        checked={enableZenMode}
                        onChange={(e) => setEnableZenMode(e.target.checked)}
                    />
                }
            />
        </Stack>
    );
}

const CUSTOM_RATING_SYSTEMS = [RatingSystem.Custom, RatingSystem.Custom2, RatingSystem.Custom3];

const RATING_SYSTEM_FORMS = [
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
    {
        system: RatingSystem.Knsb,
        label: 'KNSB ID',
        hideLabel: 'Hide ID',
    },
];
