import { useEffect, useState } from 'react';
import { Box, Button, Container, Stack, Tab, Typography } from '@mui/material';
import { TabContext, TabList, TabPanel } from '@mui/lab';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';

import { useApi } from '../api/Api';
import { useRequest } from '../api/Request';
import { useAuth } from '../auth/Auth';
import { User } from '../database/user';
import LoadingPage from '../loading/LoadingPage';
import NotFoundPage from '../NotFoundPage';
import GamesTab from './GamesTab';
import ProgressTab from './progress/ProgressTab';
import ActivityTab from './activity/ActivityTab';
import GraduationDialog from './GraduationDialog';
import GraduationIcon from '../scoreboard/GraduationIcon';
import StatsTab from './stats/StatsTab';
import { DefaultTimezone } from '../calendar/CalendarFilters';

const timezoneDisplayLabels: Record<string, string> = {
    'Etc/GMT+12': 'UTC-12',
    'Etc/GMT+11': 'UTC-11',
    'Etc/GMT+10': 'UTC-10',
    'Etc/GMT+9': 'UTC-9',
    'Etc/GMT+8': 'UTC-8',
    'Etc/GMT+7': 'UTC-7',
    'Etc/GMT+6': 'UTC-6',
    'Etc/GMT+5': 'UTC-5',
    'Etc/GMT+4': 'UTC-4',
    'Etc/GMT+3': 'UTC-3',
    'Etc/GMT+2': 'UTC-2',
    'Etc/GMT+1': 'UTC-1',
    'Etc/GMT+0': 'UTC+0',
    'Etc/GMT-1': 'UTC+1',
    'Etc/GMT-2': 'UTC+2',
    'Etc/GMT-3': 'UTC+3',
    'Etc/GMT-4': 'UTC+4',
    'Etc/GMT-5': 'UTC+5',
    'Etc/GMT-6': 'UTC+6',
    'Etc/GMT-7': 'UTC+7',
    'Etc/GMT-8': 'UTC+8',
    'Etc/GMT-9': 'UTC+9',
    'Etc/GMT-10': 'UTC+10',
    'Etc/GMT-11': 'UTC+11',
    'Etc/GMT-12': 'UTC+12',
    'Etc/GMT-13': 'UTC+13',
    'Etc/GMT-14': 'UTC+14',
};

type ProfilePageProps = {
    username: string;
};

const ProfilePage = () => {
    const { username } = useParams<ProfilePageProps>();
    const navigate = useNavigate();
    const api = useApi();
    const currentUser = useAuth().user!;
    const request = useRequest<User>();

    const currentUserProfile = !username || username === currentUser.username;

    const [searchParams, setSearchParams] = useSearchParams(
        currentUserProfile ? { view: 'progress' } : { view: 'stats' }
    );

    const [showGraduationDialog, setShowGraduationDialog] = useState(false);

    useEffect(() => {
        if (!currentUserProfile && !request.isSent()) {
            request.onStart();
            api.getUserPublic(username)
                .then((response) => {
                    request.onSuccess(response.data);
                })
                .catch((err) => {
                    console.error('Failed to get user profile: ', err);
                    request.onFailure(err);
                });
        }
    }, [api, currentUserProfile, request, username]);

    const user = currentUserProfile ? currentUser : request.data;

    if (!user && request.isLoading()) {
        return <LoadingPage />;
    } else if (!user) {
        return <NotFoundPage />;
    }

    return (
        <Container maxWidth='md' sx={{ pt: 6, pb: 4 }}>
            <Stack spacing={5}>
                <Stack
                    direction='row'
                    justifyContent='space-between'
                    alignItems='start'
                    flexWrap='wrap'
                    rowGap={2}
                >
                    <Stack>
                        <Stack direction='row' spacing={2} flexWrap='wrap' rowGap={1}>
                            <Typography variant='h4'>{user.displayName}</Typography>
                            {user.graduationCohorts &&
                            user.graduationCohorts.length > 0 ? (
                                <Stack
                                    direction='row'
                                    spacing={0.5}
                                    flexWrap='wrap'
                                    rowGap={1}
                                >
                                    {user.graduationCohorts.map((c) => (
                                        <GraduationIcon key={c} cohort={c} />
                                    ))}
                                </Stack>
                            ) : (
                                user.previousCohort && (
                                    <GraduationIcon cohort={user.previousCohort} />
                                )
                            )}
                        </Stack>
                        <Typography variant='h5' color='text.secondary'>
                            {user.dojoCohort}
                        </Typography>

                        {user.createdAt && (
                            <Typography mt={1}>
                                Dojo Member Since{' '}
                                {new Date(user.createdAt).toLocaleDateString()}
                            </Typography>
                        )}

                        {user.timezoneOverride &&
                            user.timezoneOverride !== DefaultTimezone && (
                                <Typography mt={1}>
                                    {timezoneDisplayLabels[user.timezoneOverride]}
                                </Typography>
                            )}

                        {user.discordUsername && (
                            <Stack direction='row' spacing={1} alignItems='center' mt={1}>
                                <img
                                    alt=''
                                    src='/discord-icon.svg'
                                    width='24px'
                                    height='24px'
                                />
                                <Typography>{user.discordUsername}</Typography>
                            </Stack>
                        )}
                    </Stack>

                    {currentUserProfile && (
                        <Stack direction='row' spacing={2}>
                            <Button
                                variant='contained'
                                color='success'
                                onClick={() => setShowGraduationDialog(true)}
                            >
                                Graduate
                            </Button>
                            <Button
                                variant='contained'
                                onClick={() => navigate('/profile/edit')}
                            >
                                Edit Profile
                            </Button>
                        </Stack>
                    )}
                </Stack>

                {user.bio !== '' && (
                    <Typography variant='body1' sx={{ whiteSpace: 'pre-line' }}>
                        {user.bio}
                    </Typography>
                )}

                <Box sx={{ width: '100%', typography: 'body1' }}>
                    <TabContext value={searchParams.get('view') || 'stats'}>
                        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                            <TabList
                                onChange={(_, t) => setSearchParams({ view: t })}
                                aria-label='profile tabs'
                            >
                                <Tab label='Ratings' value='stats' />
                                <Tab label='Progress' value='progress' />
                                <Tab label='Activity' value='activity' />
                                <Tab label='Games' value='games' />
                            </TabList>
                        </Box>
                        <TabPanel value='stats' sx={{ px: { xs: 0, sm: 3 } }}>
                            <StatsTab user={user} />
                        </TabPanel>
                        <TabPanel value='progress' sx={{ px: { xs: 0, sm: 3 } }}>
                            <ProgressTab user={user} isCurrentUser={currentUserProfile} />
                        </TabPanel>
                        <TabPanel value='activity' sx={{ px: { xs: 0, sm: 3 } }}>
                            <ActivityTab user={user} />
                        </TabPanel>
                        <TabPanel value='games' sx={{ px: { xs: 0, sm: 3 } }}>
                            <GamesTab user={user} />
                        </TabPanel>
                    </TabContext>
                </Box>
            </Stack>

            {currentUserProfile && (
                <GraduationDialog
                    open={showGraduationDialog}
                    onClose={() => setShowGraduationDialog(false)}
                    cohort={user.dojoCohort}
                />
            )}
        </Container>
    );
};

export default ProfilePage;
