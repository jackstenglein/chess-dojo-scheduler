'use client';

import { EventType, setUserCohort, trackEvent } from '@/analytics/events';
import { useApi } from '@/api/Api';
import { RequestSnackbar, RequestStatus, useRequest } from '@/api/Request';
import { useCache } from '@/api/cache/Cache';
import { DefaultTimezone } from '@/components/calendar/filters/TimezoneSelector';
import { Link } from '@/components/navigation/Link';
import NotificationSettingsEditor from '@/components/profile/edit/NotificationSettingsEditor';
import { PersonalInfoEditor } from '@/components/profile/edit/PersonalInfoEditor';
import { RatingEditor, RatingsEditor } from '@/components/profile/edit/RatingsEditor';
import SubscriptionManager from '@/components/profile/edit/SubscriptionManager';
import {
    Rating,
    RatingSystem,
    User,
    dojoCohorts,
    formatRatingSystem,
    isCustom,
} from '@/database/user';
import { useRouter } from '@/hooks/useRouter';
import InfoIcon from '@mui/icons-material/Info';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import NotInterestedIcon from '@mui/icons-material/NotInterested';
import NotificationsIcon from '@mui/icons-material/Notifications';
import SaveIcon from '@mui/icons-material/Save';
import TimelineIcon from '@mui/icons-material/Timeline';
import { LoadingButton } from '@mui/lab';
import {
    Alert,
    Button,
    Card,
    CardContent,
    Container,
    Grid,
    Stack,
    Typography,
} from '@mui/material';
import React, { useState } from 'react';

export const MAX_PROFILE_PICTURE_SIZE_MB = 9;

type UserUpdate = Partial<User & { profilePictureData: string }>;

function getRatingEditors(ratings: Partial<Record<RatingSystem, Rating>>) {
    const ratingEditors: Record<RatingSystem, RatingEditor> = Object.values(RatingSystem).reduce<
        Record<string, RatingEditor>
    >((m, rs) => {
        m[rs] = {
            username: ratings[rs]?.username || '',
            hideUsername: ratings[rs]?.hideUsername || false,
            startRating: `${ratings[rs]?.startRating || 0}`,
            currentRating: `${ratings[rs]?.currentRating || 0}`,
            name: ratings[rs]?.name || '',
        };
        return m;
    }, {});
    return ratingEditors;
}

function getRatingsFromEditors(ratingEditors: Record<RatingSystem, RatingEditor>) {
    const ratings: Record<RatingSystem, Rating> = Object.values(RatingSystem).reduce<
        Record<string, Rating>
    >((m, rs) => {
        m[rs] = {
            username: ratingEditors[rs].username || '',
            hideUsername: ratingEditors[rs].hideUsername || false,
            startRating: parseRating(ratingEditors[rs].startRating),
            currentRating: parseRating(ratingEditors[rs].currentRating),
            name: ratingEditors[rs].name || undefined,
        };
        return m;
    }, {});
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
    const n = Math.floor(Number(rating));
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
    profilePictureData?: string,
): Partial<UserUpdate> | undefined {
    const update: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(formFields)) {
        if (user[key as keyof User] !== value) {
            update[key as keyof User] = value;
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

export function encodeFileToBase64(file: File): Promise<string> {
    return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
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

export function ProfileEditorPage({ user }: { user: User }) {
    const api = useApi();
    const { setImageBypass } = useCache();
    const router = useRouter();

    const [displayName, setDisplayName] = useState(user.displayName);
    const [dojoCohort, setDojoCohort] = useState(
        user.dojoCohort !== 'NO_COHORT' ? user.dojoCohort : '',
    );
    const [bio, setBio] = useState(user.bio);
    const [coachBio, setCoachBio] = useState(user.coachBio || '');
    const [timezone, setTimezone] = useState(user.timezoneOverride || DefaultTimezone);

    const [ratingSystem, setRatingSystem] = useState(user.ratingSystem);
    const [ratingEditors, setRatingEditors] = useState(getRatingEditors(user.ratings));
    const [enableZenMode, setEnableZenMode] = useState(user.enableZenMode);

    const [notificationSettings, setNotificationSettings] = useState(user.notificationSettings);

    const [profilePictureUrl, setProfilePictureUrl] = useState<string>();
    const [profilePictureData, setProfilePictureData] = useState<string>();

    const [errors, setErrors] = useState<Record<string, string>>({});
    const request = useRequest<string>();

    const update = getUpdate(
        user,
        {
            displayName: displayName.trim(),
            dojoCohort,
            bio,
            coachBio,
            timezoneOverride: timezone,
            ratingSystem,
            ratings: getRatingsFromEditors(ratingEditors),
            enableZenMode,
            notificationSettings,
        },
        profilePictureData,
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

        if (!isCustom(ratingSystem) && !ratingEditors[ratingSystem].username.trim()) {
            newErrors[`${ratingSystem}Username`] =
                `This field is required when using ${formatRatingSystem(
                    ratingSystem,
                )} rating system.`;
        }

        for (const rs of Object.keys(ratingEditors)) {
            const startRating = parseRating(ratingEditors[rs as RatingSystem].startRating);
            if (startRating < 0) {
                newErrors[`${rs}StartRating`] = 'Rating must be an integer >= 0';
            }
            if (isCustom(rs)) {
                const name = ratingEditors[rs as RatingSystem].name;
                const currentRating = parseRating(ratingEditors[rs as RatingSystem].currentRating);
                if ((rs === ratingSystem || currentRating > 0 || startRating > 0) && !name.trim()) {
                    newErrors[`${rs}Name`] = 'This field is required when using a custom rating';
                }
                if ((rs === ratingSystem || name.trim() || startRating > 0) && currentRating <= 0) {
                    newErrors[`${rs}CurrentRating`] =
                        'This field is required when using a custom rating system';
                }
                if (
                    (rs === ratingSystem || name.trim() || currentRating > 0) &&
                    startRating === 0
                ) {
                    newErrors[`${rs}StartRating`] =
                        'This field is required when using a custom rating system';
                }
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
                router.push('/profile');
            })
            .catch((err) => {
                console.error(err);
                request.onFailure(err);
            });
    };

    const scrollToId = (id: string) => (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView();
        }
    };

    return (
        <Container maxWidth='xl' sx={{ pt: 6, pb: 4 }}>
            <RequestSnackbar request={request} showSuccess />
            <Grid container columnSpacing={8}>
                <Grid
                    sx={{
                        display: { xs: 'none', sm: 'initial' },
                        borderRightWidth: 1,
                        borderColor: 'divider',
                    }}
                    size={{
                        xs: 0,
                        sm: 'auto',
                    }}
                >
                    <Card
                        variant='outlined'
                        sx={{
                            position: 'sticky',
                            top: 'calc(var(--navbar-height) + 8px)',
                        }}
                    >
                        <CardContent>
                            <Stack>
                                <Link href='#personal' onClick={scrollToId('personal')}>
                                    <InfoIcon
                                        fontSize='small'
                                        sx={{
                                            verticalAlign: 'middle',
                                            marginRight: '0.2em',
                                        }}
                                    />
                                    Personal Info
                                </Link>
                                <Link href='#ratings' onClick={scrollToId('ratings')}>
                                    <TimelineIcon
                                        fontSize='small'
                                        sx={{
                                            verticalAlign: 'middle',
                                            marginRight: '0.2em',
                                        }}
                                    />
                                    Ratings
                                </Link>
                                <Link href='#notifications' onClick={scrollToId('notifications')}>
                                    <NotificationsIcon
                                        fontSize='small'
                                        sx={{
                                            verticalAlign: 'middle',
                                            marginRight: '0.2em',
                                        }}
                                    />
                                    Notifications
                                </Link>
                                <Link href='#subscription' onClick={scrollToId('subscription')}>
                                    <MonetizationOnIcon
                                        fontSize='small'
                                        sx={{
                                            verticalAlign: 'middle',
                                            marginRight: '0.2em',
                                        }}
                                    />
                                    Subscription/Billing
                                </Link>
                            </Stack>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid
                    size={{
                        xs: 12,
                        sm: 'grow',
                        md: 'grow',
                        lg: 'grow',
                    }}
                >
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
                                    startIcon={<SaveIcon />}
                                >
                                    Save
                                </LoadingButton>

                                <Button
                                    component={Link}
                                    variant='contained'
                                    color='error'
                                    disableElevation
                                    href='/profile'
                                    startIcon={<NotInterestedIcon />}
                                >
                                    Cancel
                                </Button>
                            </Stack>
                        </Stack>

                        {Object.values(errors).length > 0 && (
                            <Alert severity='error' sx={{ mb: 3 }} variant='filled'>
                                Unable to save profile. Fix the errors below and retry.
                            </Alert>
                        )}

                        <PersonalInfoEditor
                            user={user}
                            displayName={displayName}
                            setDisplayName={setDisplayName}
                            bio={bio}
                            setBio={setBio}
                            coachBio={coachBio}
                            setCoachBio={setCoachBio}
                            timezone={timezone}
                            setTimezone={setTimezone}
                            profilePictureUrl={profilePictureUrl}
                            setProfilePictureUrl={setProfilePictureUrl}
                            setProfilePictureData={setProfilePictureData}
                            errors={errors}
                            request={request}
                        />

                        <RatingsEditor
                            dojoCohort={dojoCohort}
                            setDojoCohort={setDojoCohort}
                            ratingSystem={ratingSystem}
                            setRatingSystem={setRatingSystem}
                            ratingEditors={ratingEditors}
                            setRatingEditors={setRatingEditors}
                            enableZenMode={enableZenMode}
                            setEnableZenMode={setEnableZenMode}
                            errors={errors}
                        />

                        <NotificationSettingsEditor
                            notificationSettings={notificationSettings}
                            setNotificationSettings={setNotificationSettings}
                        />

                        <SubscriptionManager user={user} />
                    </Stack>
                </Grid>
            </Grid>
        </Container>
    );
}
