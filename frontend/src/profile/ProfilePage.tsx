import { useEffect, useState } from 'react';
import { Box, Button, Container, Stack, Tab, Typography } from '@mui/material';
import { TabContext, TabList, TabPanel } from '@mui/lab';
import { useNavigate, useParams } from 'react-router-dom';

import { useApi } from '../api/Api';
import { useRequest } from '../api/Request';
import { useAuth } from '../auth/Auth';
import { RatingSystem, User } from '../database/user';
import LoadingPage from '../loading/LoadingPage';
import NotFoundPage from '../NotFoundPage';
import RatingCard from './RatingCard';
import GamesTab from './GamesTab';
import ProgressTab from './ProgressTab';
import ActivityTab from './activity/ActivityTab';

type ProfilePageProps = {
    username: string;
};

const ProfilePage = () => {
    const { username } = useParams<ProfilePageProps>();
    const navigate = useNavigate();
    const api = useApi();
    const currentUser = useAuth().user!;
    const request = useRequest<User>();
    const [tab, setTab] = useState('progress');

    const currentUserProfile = !username || username === currentUser.username;

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
                <Stack direction='row' justifyContent='space-between' alignItems='center'>
                    <Stack>
                        <Typography variant='h4'>{user.discordUsername}</Typography>
                        <Typography variant='h5' color='text.secondary'>
                            {user.dojoCohort}
                        </Typography>
                    </Stack>

                    {currentUserProfile && (
                        <Button
                            variant='contained'
                            onClick={() => navigate('/profile/edit')}
                        >
                            Edit Profile
                        </Button>
                    )}
                </Stack>

                {user.bio !== '' && (
                    <Typography variant='body1' sx={{ whiteSpace: 'pre-line' }}>
                        {user.bio}
                    </Typography>
                )}

                <Stack spacing={4}>
                    <RatingCard
                        system={RatingSystem.Chesscom}
                        username={user.chesscomUsername}
                        currentRating={user.currentChesscomRating}
                        startRating={user.startChesscomRating}
                        isPreferred={user.ratingSystem === RatingSystem.Chesscom}
                    />

                    <RatingCard
                        system={RatingSystem.Lichess}
                        username={user.lichessUsername}
                        currentRating={user.currentLichessRating}
                        startRating={user.startLichessRating}
                        isPreferred={user.ratingSystem === RatingSystem.Lichess}
                    />

                    {user.fideId !== '' && (
                        <RatingCard
                            system={RatingSystem.Fide}
                            username={user.fideId}
                            currentRating={user.currentFideRating}
                            startRating={user.startFideRating}
                            isPreferred={user.ratingSystem === RatingSystem.Fide}
                        />
                    )}

                    {user.uscfId !== '' && (
                        <RatingCard
                            system={RatingSystem.Uscf}
                            username={user.uscfId}
                            currentRating={user.currentUscfRating}
                            startRating={user.startUscfRating}
                            isPreferred={user.ratingSystem === RatingSystem.Uscf}
                        />
                    )}
                </Stack>

                <Box sx={{ width: '100%', typography: 'body1' }}>
                    <TabContext value={tab}>
                        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                            <TabList
                                onChange={(_, t) => setTab(t)}
                                aria-label='profile tabs'
                            >
                                <Tab label='Progress' value='progress' />
                                <Tab label='Activity' value='activity' />
                                <Tab label='Games' value='games' />
                            </TabList>
                        </Box>
                        <TabPanel value='progress'>
                            <ProgressTab user={user} />
                        </TabPanel>
                        <TabPanel value='activity'>
                            <ActivityTab user={user} />
                        </TabPanel>
                        <TabPanel value='games'>
                            <GamesTab user={user} />
                        </TabPanel>
                    </TabContext>
                </Box>
            </Stack>
        </Container>
    );
};

export default ProfilePage;
